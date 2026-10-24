-- Lotes conservam a compra original e geram unidades internas, sem novas dívidas.
-- Mutações multi-tabela são atômicas e só podem ocorrer pelas RPCs abaixo.
CREATE SCHEMA IF NOT EXISTS drivecar_private;
REVOKE ALL ON SCHEMA drivecar_private FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA drivecar_private TO authenticated;

CREATE TABLE public.est_lotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  pedido_id uuid NOT NULL UNIQUE REFERENCES public.cmp_pedidos(id),
  descricao text NOT NULL CHECK (length(btrim(descricao)) BETWEEN 1 AND 300),
  quantidade_inicial integer NOT NULL CHECK (quantidade_inicial BETWEEN 2 AND 10000),
  custo_aquisicao numeric(15,2) NOT NULL CHECK (custo_aquisicao > 0),
  socios jsonb NOT NULL DEFAULT '[]',
  origem_veiculo_snapshot jsonb NOT NULL,
  encerrado boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.est_veiculos
  ADD COLUMN lote_id uuid REFERENCES public.est_lotes(id),
  ADD COLUMN lote_ordem integer,
  ADD COLUMN custo_lote_servicos numeric(15,2) NOT NULL DEFAULT 0,
  ADD CONSTRAINT est_veiculos_lote_ordem_check CHECK (
    (lote_id IS NULL AND lote_ordem IS NULL) OR (lote_id IS NOT NULL AND lote_ordem > 0)),
  ADD CONSTRAINT est_veiculos_lote_ordem_unique UNIQUE (lote_id,lote_ordem);
ALTER TABLE public.venda_pedidos
  ADD COLUMN lote_id uuid REFERENCES public.est_lotes(id),
  ADD COLUMN quantidade_lote integer CHECK (quantidade_lote > 0),
  ADD COLUMN lote_request_id uuid UNIQUE,
  ADD COLUMN lote_request_payload jsonb;

CREATE TABLE public.venda_lote_itens (
  venda_id uuid NOT NULL REFERENCES public.venda_pedidos(id),
  veiculo_id uuid NOT NULL REFERENCES public.est_veiculos(id),
  lote_id uuid NOT NULL REFERENCES public.est_lotes(id),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  custo_na_venda numeric(15,2) NOT NULL CHECK (custo_na_venda >= 0),
  valor_venda numeric(15,2) NOT NULL CHECK (valor_venda >= 0),
  status_anterior text NOT NULL CHECK (status_anterior IN ('DISPONIVEL','PREPARACAO')),
  PRIMARY KEY(venda_id,veiculo_id)
);
CREATE INDEX venda_lote_itens_veiculo_idx ON public.venda_lote_itens(veiculo_id);
CREATE INDEX venda_pedidos_lote_idx ON public.venda_pedidos(lote_id);

CREATE TABLE public.est_lote_despesas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  lote_id uuid NOT NULL REFERENCES public.est_lotes(id),
  veiculo_id uuid REFERENCES public.est_veiculos(id),
  request_id uuid NOT NULL UNIQUE,
  request_payload jsonb NOT NULL,
  titulo_id uuid NOT NULL UNIQUE REFERENCES public.fin_titulos(id),
  descricao text NOT NULL CHECK (length(btrim(descricao)) BETWEEN 1 AND 300),
  valor_total numeric(15,2) NOT NULL CHECK (valor_total > 0),
  data_vencimento date NOT NULL,
  categoria_id uuid NOT NULL REFERENCES public.fin_categorias(id),
  fornecedor_id uuid REFERENCES public.parceiros(id),
  comprovante_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX est_lote_despesas_lote_idx ON public.est_lote_despesas(lote_id);

ALTER TABLE public.fin_titulos DROP CONSTRAINT fin_titulos_origem_tipo_check;
ALTER TABLE public.fin_titulos ADD COLUMN lote_id uuid REFERENCES public.est_lotes(id);
CREATE INDEX fin_titulos_lote_idx ON public.fin_titulos(lote_id);
ALTER TABLE public.fin_titulos ADD CONSTRAINT fin_titulos_origem_tipo_check CHECK (
  origem_tipo IN ('PEDIDO_COMPRA','PEDIDO_VENDA','DESPESA_VEICULO','DESPESA_LOTE',
    'DESPESA_FIXA','DESPESA_VARIAVEL','OUTRO_CREDITO','OUTRO_DEBITO','MANUAL'));

ALTER TABLE public.est_lotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.est_lote_despesas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venda_lote_itens ENABLE ROW LEVEL SECURITY;
CREATE POLICY est_lotes_read ON public.est_lotes FOR SELECT TO authenticated
  USING (public.is_member_of(organization_id));
CREATE POLICY est_lote_despesas_read ON public.est_lote_despesas FOR SELECT TO authenticated
  USING (public.is_member_of(organization_id));
CREATE POLICY venda_lote_itens_read ON public.venda_lote_itens FOR SELECT TO authenticated
  USING (public.is_member_of(organization_id));
REVOKE ALL ON public.est_lotes,public.est_lote_despesas,public.venda_lote_itens FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.est_lotes,public.est_lote_despesas,public.venda_lote_itens TO authenticated;

-- Uma capacidade privada por transação protege inclusive chamadas às RPCs legadas
-- SECURITY DEFINER. Um GUC editável pelo cliente não serviria como autorização.
CREATE TABLE drivecar_private.lote_contexto (
  backend_pid integer NOT NULL,
  transaction_id bigint NOT NULL,
  lote_id uuid NOT NULL,
  PRIMARY KEY(backend_pid,transaction_id,lote_id)
);
REVOKE ALL ON drivecar_private.lote_contexto FROM PUBLIC,anon,authenticated;
CREATE TABLE drivecar_private.lote_baixa_requests (
  request_id uuid PRIMARY KEY,
  organization_id uuid NOT NULL,
  titulo_id uuid NOT NULL,
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON drivecar_private.lote_baixa_requests FROM PUBLIC,anon,authenticated;

CREATE FUNCTION drivecar_private.assert_lote_org(p_org uuid) RETURNS void
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN
  IF auth.uid() IS NULL OR p_org IS NULL OR NOT public.is_member_of(p_org) THEN
    RAISE EXCEPTION 'Lote não encontrado ou acesso não autorizado.' USING ERRCODE='42501';
  END IF;
END;
$$;

CREATE FUNCTION drivecar_private.assert_ref(p_table regclass,p_id uuid,p_org uuid,p_required boolean DEFAULT false)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE v_ok boolean;
BEGIN
  IF p_id IS NULL THEN
    IF p_required THEN RAISE EXCEPTION 'Referência obrigatória ausente: %.',p_table; END IF;
    RETURN;
  END IF;
  EXECUTE format('SELECT EXISTS(SELECT 1 FROM %s WHERE id=$1 AND (organization_id=$2%s))',p_table,
    CASE WHEN p_table IN ('public.cad_formas_pagamento'::regclass,'public.cad_montadoras'::regclass,
      'public.cad_modelos'::regclass,'public.cad_versoes'::regclass,'public.cad_tipos_veiculos'::regclass,'public.cad_cores'::regclass)
      THEN ' OR organization_id IS NULL' ELSE '' END)
    INTO v_ok USING p_id,p_org;
  IF NOT v_ok THEN RAISE EXCEPTION 'Referência inválida para a organização: %.',p_table USING ERRCODE='42501'; END IF;
END;
$$;

CREATE FUNCTION drivecar_private.lote_socios(p_total numeric,p_socios jsonb) RETURNS jsonb
LANGUAGE sql IMMUTABLE SECURITY INVOKER SET search_path = '' AS $$
  WITH shares AS (
    SELECT value,ordinality,(value->>'porcentagem')::numeric pct
    FROM jsonb_array_elements(p_socios) WITH ORDINALITY
  ), weights AS (
    SELECT *,sum(pct) OVER() total,sum(pct) OVER(ORDER BY ordinality) cumulative FROM shares
  )
  SELECT coalesce(jsonb_agg(value || jsonb_build_object('valor',
    CASE WHEN total > 0 THEN round(p_total*cumulative/total,2)-round(p_total*(cumulative-pct)/total,2) ELSE 0 END)
    ORDER BY ordinality),'[]'::jsonb) FROM weights;
$$;

CREATE FUNCTION drivecar_private.lote_open(p_lote uuid) RETURNS void
LANGUAGE sql SECURITY INVOKER SET search_path = '' AS $$
  INSERT INTO drivecar_private.lote_contexto VALUES(pg_backend_pid(),txid_current(),p_lote) ON CONFLICT DO NOTHING;
$$;
CREATE FUNCTION drivecar_private.lote_close(p_lote uuid) RETURNS void
LANGUAGE sql SECURITY INVOKER SET search_path = '' AS $$
  DELETE FROM drivecar_private.lote_contexto WHERE backend_pid=pg_backend_pid() AND transaction_id=txid_current() AND lote_id=p_lote;
$$;
CREATE FUNCTION drivecar_private.lote_has_context(p_lote uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' SET TimeZone = 'America/Maceio' AS $$
  SELECT EXISTS(SELECT 1 FROM drivecar_private.lote_contexto
    WHERE backend_pid=pg_backend_pid() AND transaction_id=txid_current() AND lote_id=p_lote);
$$;

-- Custo gerencial atual. O custo original de cada venda permanece imutável
-- em venda_lote_itens.custo_na_venda para comparação e auditoria.
CREATE FUNCTION drivecar_private.custo_atual_venda_lote(p_venda_id uuid) RETURNS numeric
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = '' AS $$
  SELECT coalesce(sum(coalesce(u.valor_custo,0)+coalesce(u.valor_custo_servicos,0)),0)
  FROM public.venda_lote_itens it JOIN public.est_veiculos u ON u.id=it.veiculo_id
    AND u.lote_id=it.lote_id AND u.organization_id=it.organization_id
  JOIN public.venda_pedidos v ON v.id=it.venda_id AND v.lote_id=it.lote_id AND v.organization_id=it.organization_id
  WHERE it.venda_id=p_venda_id AND public.is_member_of(it.organization_id);
$$;

CREATE FUNCTION drivecar_private.recalcular_lote(p_lote uuid) RETURNS void
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE l public.est_lotes%ROWTYPE;
BEGIN
  SELECT * INTO STRICT l FROM public.est_lotes WHERE id=p_lote FOR UPDATE;
  WITH costs AS (
    SELECT v.id,coalesce(sum(CASE WHEN d.veiculo_id=v.id THEN d.valor_total
      WHEN d.veiculo_id IS NULL THEN
        (floor(d.valor_total*100/l.quantidade_inicial)+
          CASE WHEN v.lote_ordem <= mod(d.valor_total*100,l.quantidade_inicial) THEN 1 ELSE 0 END)/100
      ELSE 0 END),0) expense
    FROM public.est_veiculos v LEFT JOIN public.est_lote_despesas d ON d.lote_id=v.lote_id
    WHERE v.lote_id=p_lote GROUP BY v.id
  )
  UPDATE public.est_veiculos v SET custo_lote_servicos=c.expense,valor_custo_servicos=c.expense,
    socios=drivecar_private.lote_socios(v.valor_custo+c.expense,l.socios),updated_at=now()
  FROM costs c WHERE v.id=c.id;
  UPDATE public.venda_pedidos v SET valor_custo_veiculo=c.current_cost,
    valor_lucro=coalesce(v.valor_venda,0)-c.current_cost,updated_at=now()
  FROM (SELECT vp.id,drivecar_private.custo_atual_venda_lote(vp.id) current_cost
    FROM public.venda_pedidos vp WHERE vp.lote_id=p_lote AND vp.status='CONCLUIDO') c
  WHERE v.id=c.id;
END;
$$;

CREATE FUNCTION drivecar_private.criar_lote_impl(p_veiculo_id uuid,p_quantidade integer,p_descricao text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' SET TimeZone = 'America/Maceio' AS $$
DECLARE v public.est_veiculos%ROWTYPE; p public.cmp_pedidos%ROWTYPE; l uuid; i integer; amount numeric; s jsonb;
BEGIN
  SELECT * INTO v FROM public.est_veiculos WHERE id=p_veiculo_id FOR UPDATE;
  PERFORM drivecar_private.assert_lote_org(v.organization_id);
  IF v.lote_id IS NOT NULL THEN RETURN v.lote_id; END IF;
  IF p_quantidade IS NULL OR p_quantidade NOT BETWEEN 2 AND 10000 OR btrim(coalesce(p_descricao,''))='' THEN
    RAISE EXCEPTION 'Informe descrição e quantidade entre 2 e 10000.';
  END IF;
  SELECT * INTO p FROM public.cmp_pedidos WHERE id=v.pedido_id FOR UPDATE;
  IF p.id IS NULL OR p.organization_id IS DISTINCT FROM v.organization_id OR p.status IS DISTINCT FROM 'CONCLUIDO'
    OR v.status IS DISTINCT FROM 'DISPONIVEL' OR coalesce(v.is_consignado,false) THEN
    RAISE EXCEPTION 'Converta somente compra própria confirmada com veículo disponível.';
  END IF;
  IF (SELECT count(*) FROM public.est_veiculos WHERE pedido_id=p.id)<>1 THEN
    RAISE EXCEPTION 'A conversão inicial exige pedido com apenas o veículo representativo do lote.';
  END IF;
  IF coalesce(v.valor_custo,0)<=0 OR v.valor_custo<>round(v.valor_custo,2) OR coalesce(v.valor_custo_servicos,0)<>0
    OR EXISTS(SELECT 1 FROM public.est_veiculos_despesas WHERE veiculo_id=v.id)
    OR EXISTS(SELECT 1 FROM public.venda_pedidos WHERE veiculo_id=v.id)
    OR EXISTS(SELECT 1 FROM public.fin_titulos WHERE veiculo_id=v.id AND origem_tipo IS DISTINCT FROM 'PEDIDO_COMPRA') THEN
    RAISE EXCEPTION 'A conversão exige custo positivo e ausência de vendas ou despesas individuais anteriores.';
  END IF;
  IF coalesce(p.valor_negociado,0)>0 AND p.valor_negociado<>v.valor_custo THEN
    RAISE EXCEPTION 'O custo representativo deve coincidir com o valor negociado do pedido.';
  END IF;
  PERFORM drivecar_private.assert_ref('public.cad_montadoras',v.montadora_id,v.organization_id);
  PERFORM drivecar_private.assert_ref('public.cad_modelos',v.modelo_id,v.organization_id);
  PERFORM drivecar_private.assert_ref('public.cad_versoes',v.versao_id,v.organization_id);
  PERFORM drivecar_private.assert_ref('public.cad_tipos_veiculos',v.tipo_veiculo_id,v.organization_id);
  PERFORM drivecar_private.assert_ref('public.cad_cores',v.cor_id,v.organization_id);
  IF jsonb_typeof(coalesce(v.socios,'[]'))<>'array' THEN RAISE EXCEPTION 'Composição societária inválida.'; END IF;
  FOR s IN SELECT value FROM jsonb_array_elements(coalesce(v.socios,'[]')) LOOP
    PERFORM drivecar_private.assert_ref('public.config_socios',(s->>'socio_id')::uuid,v.organization_id,true);
    IF coalesce((s->>'porcentagem')::numeric,-1) NOT BETWEEN 0 AND 100 THEN RAISE EXCEPTION 'Percentual de sócio inválido.'; END IF;
  END LOOP;
  IF jsonb_array_length(coalesce(v.socios,'[]'))>0 AND (SELECT coalesce(sum((value->>'porcentagem')::numeric),0) FROM jsonb_array_elements(v.socios))<=0 THEN
    RAISE EXCEPTION 'A composição de sócios precisa ter participação positiva.';
  END IF;
  INSERT INTO public.est_lotes(organization_id,pedido_id,descricao,quantidade_inicial,custo_aquisicao,socios,origem_veiculo_snapshot)
    VALUES(v.organization_id,p.id,btrim(p_descricao),p_quantidade,v.valor_custo,coalesce(v.socios,'[]'),to_jsonb(v)) RETURNING id INTO l;
  PERFORM drivecar_private.lote_open(l);
  UPDATE public.fin_titulos SET lote_id=l WHERE pedido_id=p.id AND organization_id=v.organization_id AND origem_tipo='PEDIDO_COMPRA';
  FOR i IN 1..p_quantidade LOOP
    amount:=(floor(v.valor_custo*100/p_quantidade)+CASE WHEN i<=mod(v.valor_custo*100,p_quantidade) THEN 1 ELSE 0 END)/100;
    IF i=1 THEN
      UPDATE public.est_veiculos SET lote_id=l,lote_ordem=i,valor_custo=amount,valor_venda=0,valor_promocional=NULL,
        socios=drivecar_private.lote_socios(amount,coalesce(v.socios,'[]')),publicado_site=false,updated_at=now() WHERE id=v.id;
    ELSE
      INSERT INTO public.est_veiculos(user_id,organization_id,pedido_id,lote_id,lote_ordem,
        montadora_id,tipo_veiculo_id,modelo_id,versao_id,cor_id,km,ano_fabricacao,ano_modelo,
        combustivel,transmissao,motorizacao,portas,valor_custo,valor_venda,status,socios,
        caracteristicas_ids,opcionais_ids,observacoes,publicado_site,is_consignado,created_at)
      VALUES(auth.uid(),v.organization_id,p.id,l,i,v.montadora_id,v.tipo_veiculo_id,v.modelo_id,
        v.versao_id,v.cor_id,v.km,v.ano_fabricacao,v.ano_modelo,v.combustivel,v.transmissao,
        v.motorizacao,v.portas,amount,0,v.status,drivecar_private.lote_socios(amount,coalesce(v.socios,'[]')),
        v.caracteristicas_ids,v.opcionais_ids,'Unidade interna do lote: '||btrim(p_descricao),false,false,v.created_at);
    END IF;
  END LOOP;
  PERFORM drivecar_private.lote_close(l);
  RETURN l;
END;
$$;

CREATE FUNCTION drivecar_private.registrar_despesa_lote_impl(p_lote_id uuid,p_dados jsonb,p_request_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' SET TimeZone = 'America/Maceio' AS $$
DECLARE l public.est_lotes%ROWTYPE; existing public.est_lote_despesas%ROWTYPE;
  d uuid:=gen_random_uuid(); t uuid; amount numeric; categoria uuid; fornecedor uuid; unidade uuid;
  v_account_id uuid; forma uuid; vence date; pago boolean;
BEGIN
  SELECT * INTO l FROM public.est_lotes WHERE id=p_lote_id FOR UPDATE;
  PERFORM drivecar_private.assert_lote_org(l.organization_id);
  IF p_request_id IS NULL OR jsonb_typeof(p_dados) IS DISTINCT FROM 'object' THEN RAISE EXCEPTION 'Dados e identificador da operação são obrigatórios.'; END IF;
  SELECT * INTO existing FROM public.est_lote_despesas WHERE request_id=p_request_id;
  IF FOUND THEN
    IF existing.lote_id<>l.id OR existing.request_payload<>p_dados THEN RAISE EXCEPTION 'Identificador de operação já utilizado com outros dados.'; END IF;
    RETURN existing.id;
  END IF;
  IF l.encerrado THEN RAISE EXCEPTION 'O lote está encerrado; não aceita novas despesas.'; END IF;
  amount:=(p_dados->>'valor_total')::numeric;
  IF amount IS NULL OR amount<=0 OR amount<>round(amount,2) OR amount>=10000000000000
    OR length(btrim(coalesce(p_dados->>'descricao',''))) NOT BETWEEN 1 AND 300
    OR coalesce(p_dados->>'data_vencimento','') !~ '^\d{4}-\d{2}-\d{2}$' THEN
    RAISE EXCEPTION 'Informe descrição, valor positivo em centavos e data de vencimento válida.';
  END IF;
  vence:=(p_dados->>'data_vencimento')::date;
  categoria:=(p_dados->>'categoria_id')::uuid; fornecedor:=(p_dados->>'fornecedor_id')::uuid;
  unidade:=(p_dados->>'veiculo_id')::uuid; v_account_id:=(p_dados->>'conta_bancaria_id')::uuid;
  forma:=(p_dados->>'forma_pagamento_id')::uuid; pago:=coalesce((p_dados->>'pago_agora')::boolean,false);
  PERFORM drivecar_private.assert_ref('public.fin_categorias',categoria,l.organization_id,true);
  IF NOT EXISTS(SELECT 1 FROM public.fin_categorias WHERE id=categoria AND natureza='SAIDA' AND tipo='VARIAVEL') THEN
    RAISE EXCEPTION 'Selecione uma categoria de despesa variável de saída.';
  END IF;
  PERFORM drivecar_private.assert_ref('public.parceiros',fornecedor,l.organization_id);
  PERFORM drivecar_private.assert_ref('public.fin_contas_bancarias',v_account_id,l.organization_id,pago);
  IF v_account_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.fin_contas_bancarias WHERE id=v_account_id AND ativo) THEN RAISE EXCEPTION 'Selecione uma conta bancária ativa.'; END IF;
  PERFORM drivecar_private.assert_ref('public.cad_formas_pagamento',forma,l.organization_id,pago);
  IF unidade IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.est_veiculos WHERE id=unidade AND lote_id=l.id AND organization_id=l.organization_id) THEN
    RAISE EXCEPTION 'A unidade informada não pertence ao lote.';
  END IF;
  IF forma IS NOT NULL AND EXISTS(SELECT 1 FROM public.cad_formas_pagamento WHERE id=forma AND (NOT coalesce(ativo,false) OR destino_lancamento='CONSIGNACAO' OR tipo_movimentacao NOT IN ('AMBOS','PAGAMENTO'))) THEN
    RAISE EXCEPTION 'Forma de pagamento incompatível com a despesa.';
  END IF;
  PERFORM drivecar_private.lote_open(l.id);
  INSERT INTO public.fin_titulos(lote_id,organization_id,user_id,parceiro_id,categoria_id,descricao,tipo,
    valor_total,data_emissao,data_vencimento,forma_pagamento_id,origem_tipo,origem_id)
  VALUES(l.id,l.organization_id,auth.uid(),fornecedor,categoria,'Lote: '||btrim(p_dados->>'descricao'),
    'PAGAR',amount,CURRENT_DATE,vence,forma,'DESPESA_LOTE',d) RETURNING id INTO t;
  INSERT INTO public.est_lote_despesas(id,organization_id,lote_id,veiculo_id,request_id,request_payload,titulo_id,
    descricao,valor_total,data_vencimento,categoria_id,fornecedor_id,comprovante_url)
  VALUES(d,l.organization_id,l.id,unidade,p_request_id,p_dados,t,btrim(p_dados->>'descricao'),amount,
    vence,categoria,fornecedor,nullif(p_dados->>'comprovante_url',''));
  IF pago THEN
    PERFORM public.baixar_titulo(t,amount,v_account_id,forma,(CURRENT_DATE::timestamp AT TIME ZONE 'America/Maceio'));
  END IF;
  PERFORM drivecar_private.recalcular_lote(l.id);
  PERFORM drivecar_private.lote_close(l.id);
  RETURN d;
END;
$$;

CREATE FUNCTION drivecar_private.registrar_venda_lote_impl(p_lote_id uuid,p_dados jsonb,p_request_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' SET TimeZone = 'America/Maceio' AS $$
DECLARE l public.est_lotes%ROWTYPE; existing public.venda_pedidos%ROWTYPE;
  sale uuid:=gen_random_uuid(); cliente uuid; quantidade integer; amount numeric; sale_date date;
  units uuid[]; u public.est_veiculos%ROWTYPE; payment jsonb; identification jsonb;
  i integer:=0; payment_count integer; payment_number integer:=0; price numeric; cost numeric:=0;
  pvalue numeric; pdate date; pforma uuid; pconta uuid; t uuid; total_payments numeric;
BEGIN
  SELECT * INTO l FROM public.est_lotes WHERE id=p_lote_id FOR UPDATE;
  PERFORM drivecar_private.assert_lote_org(l.organization_id);
  IF p_request_id IS NULL OR jsonb_typeof(p_dados) IS DISTINCT FROM 'object' THEN RAISE EXCEPTION 'Dados e identificador da operação são obrigatórios.'; END IF;
  SELECT * INTO existing FROM public.venda_pedidos WHERE lote_request_id=p_request_id;
  IF FOUND THEN
    IF existing.lote_id IS DISTINCT FROM l.id OR existing.lote_request_payload<>p_dados THEN RAISE EXCEPTION 'Identificador de operação já utilizado com outros dados.'; END IF;
    RETURN existing.id;
  END IF;
  IF l.encerrado THEN RAISE EXCEPTION 'O lote está encerrado.'; END IF;
  IF coalesce(p_dados->>'quantidade','') !~ '^[1-9][0-9]*$' OR coalesce(p_dados->>'data_venda','') !~ '^\d{4}-\d{2}-\d{2}$' THEN
    RAISE EXCEPTION 'Informe quantidade inteira positiva e data civil da venda.';
  END IF;
  quantidade:=(p_dados->>'quantidade')::integer; amount:=(p_dados->>'valor_total')::numeric;
  sale_date:=(p_dados->>'data_venda')::date; cliente:=(p_dados->>'cliente_id')::uuid;
  IF amount IS NULL OR amount<=0 OR amount<>round(amount,2) OR amount>=10000000000000 OR quantidade>l.quantidade_inicial OR sale_date>CURRENT_DATE THEN
    RAISE EXCEPTION 'Quantidade, valor ou data da venda inválidos.';
  END IF;
  PERFORM drivecar_private.assert_ref('public.parceiros',cliente,l.organization_id,true);
  IF jsonb_typeof(p_dados->'pagamentos') IS DISTINCT FROM 'array' OR jsonb_array_length(p_dados->'pagamentos')=0 THEN
    RAISE EXCEPTION 'Informe o cronograma de recebimentos, incluindo eventual saldo a prazo.';
  END IF;
  SELECT sum((value->>'valor')::numeric),count(*) INTO total_payments,payment_count FROM jsonb_array_elements(p_dados->'pagamentos');
  IF total_payments IS DISTINCT FROM amount THEN RAISE EXCEPTION 'O cronograma deve totalizar exatamente o valor da venda.'; END IF;
  IF p_dados ? 'identificacoes' AND (jsonb_typeof(p_dados->'identificacoes')<>'array' OR jsonb_array_length(p_dados->'identificacoes')<>quantidade) THEN
    RAISE EXCEPTION 'Informe uma identificação por unidade ou omita a lista.';
  END IF;
  -- Serialização pelo lote impede duas vendas da mesma última unidade.
  SELECT array_agg(selected.id ORDER BY selected.lote_ordem) INTO units FROM (
    SELECT v.id,v.lote_ordem FROM public.est_veiculos v
    WHERE v.lote_id=l.id AND v.organization_id=l.organization_id AND v.status='DISPONIVEL'
      AND NOT EXISTS(SELECT 1 FROM public.venda_lote_itens it JOIN public.venda_pedidos vp ON vp.id=it.venda_id WHERE it.veiculo_id=v.id AND vp.status='CONCLUIDO')
    ORDER BY v.lote_ordem LIMIT quantidade FOR UPDATE OF v
  ) selected;
  IF coalesce(cardinality(units),0)<>quantidade THEN RAISE EXCEPTION 'Quantidade superior ao saldo disponível do lote.'; END IF;
  PERFORM drivecar_private.lote_open(l.id);
  PERFORM pg_advisory_xact_lock(hashtextextended(l.organization_id::text,41));
  INSERT INTO public.venda_pedidos(id,user_id,organization_id,cliente_id,veiculo_id,lote_id,quantidade_lote,
    lote_request_id,lote_request_payload,numero_venda,data_venda,valor_venda,observacoes,status,is_consignado)
  VALUES(sale,auth.uid(),l.organization_id,cliente,units[1],l.id,quantidade,p_request_id,p_dados,
    'LT-'||upper(substr(replace(sale::text,'-',''),1,12)),sale_date,amount,p_dados->>'observacoes','RASCUNHO',false);
  FOREACH t IN ARRAY units LOOP
    SELECT * INTO STRICT u FROM public.est_veiculos WHERE id=t;
    i:=i+1; identification:=p_dados->'identificacoes'->(i-1);
    IF identification IS NOT NULL AND jsonb_typeof(identification)<>'object' THEN RAISE EXCEPTION 'Identificação inválida.'; END IF;
    IF length(coalesce(identification->>'chassi',''))>50 OR length(coalesce(identification->>'placa',''))>20 THEN RAISE EXCEPTION 'Identificação muito longa.'; END IF;
    IF EXISTS(SELECT 1 FROM public.est_veiculos other WHERE other.organization_id=l.organization_id AND other.id<>u.id
      AND ((nullif(btrim(identification->>'chassi'),'') IS NOT NULL AND upper(btrim(other.chassi))=upper(btrim(identification->>'chassi')))
        OR (nullif(btrim(identification->>'placa'),'') IS NOT NULL AND upper(btrim(other.placa))=upper(btrim(identification->>'placa'))))) THEN
      RAISE EXCEPTION 'Chassi ou placa já utilizado na organização.';
    END IF;
    price:=(floor(amount*100/quantidade)+CASE WHEN i<=mod(amount*100,quantidade) THEN 1 ELSE 0 END)/100;
    cost:=cost+coalesce(u.valor_custo,0)+coalesce(u.valor_custo_servicos,0);
    INSERT INTO public.venda_lote_itens(venda_id,veiculo_id,lote_id,organization_id,custo_na_venda,valor_venda,status_anterior)
    VALUES(sale,u.id,l.id,l.organization_id,coalesce(u.valor_custo,0)+coalesce(u.valor_custo_servicos,0),price,u.status);
    UPDATE public.est_veiculos SET status='VENDIDO',publicado_site=false,
      placa=coalesce(nullif(upper(btrim(identification->>'placa')),''),placa),
      chassi=coalesce(nullif(upper(btrim(identification->>'chassi')),''),chassi),updated_at=now() WHERE id=u.id;
  END LOOP;
  FOR payment IN SELECT value FROM jsonb_array_elements(p_dados->'pagamentos') LOOP
    pvalue:=(payment->>'valor')::numeric; pforma:=(payment->>'forma_pagamento_id')::uuid;
    pconta:=(payment->>'conta_bancaria_id')::uuid;
    IF pvalue IS NULL OR pvalue<=0 OR pvalue<>round(pvalue,2) OR coalesce(payment->>'data_recebimento','') !~ '^\d{4}-\d{2}-\d{2}$' THEN
      RAISE EXCEPTION 'Cada recebimento precisa de valor positivo em centavos e data civil válida.';
    END IF;
    pdate:=(payment->>'data_recebimento')::date;
    IF pdate<sale_date THEN RAISE EXCEPTION 'O recebimento não pode anteceder a venda.'; END IF;
    PERFORM drivecar_private.assert_ref('public.cad_formas_pagamento',pforma,l.organization_id,true);
    PERFORM drivecar_private.assert_ref('public.fin_contas_bancarias',pconta,l.organization_id);
    IF pconta IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.fin_contas_bancarias WHERE id=pconta AND ativo) THEN RAISE EXCEPTION 'Selecione uma conta bancária ativa.'; END IF;
    IF EXISTS(SELECT 1 FROM public.cad_formas_pagamento WHERE id=pforma AND (NOT coalesce(ativo,false) OR destino_lancamento='CONSIGNACAO' OR tipo_movimentacao NOT IN ('AMBOS','RECEBIMENTO'))) THEN
      RAISE EXCEPTION 'Forma de recebimento incompatível com a venda.';
    END IF;
    payment_number:=payment_number+1;
    INSERT INTO public.venda_pedidos_pagamentos(pedido_id,organization_id,data_recebimento,valor,forma_pagamento_id,conta_bancaria_id)
      VALUES(sale,l.organization_id,pdate,pvalue,pforma,pconta);
    INSERT INTO public.fin_titulos(lote_id,organization_id,user_id,parceiro_id,venda_pedido_id,veiculo_id,descricao,tipo,
      valor_total,data_emissao,data_vencimento,forma_pagamento_id,origem_tipo,origem_id,parcela_numero,parcela_total,socios)
    VALUES(l.id,l.organization_id,auth.uid(),cliente,sale,units[1],'Venda do lote: '||l.descricao,'RECEBER',
      pvalue,sale_date,pdate,pforma,'PEDIDO_VENDA',sale,payment_number,payment_count,l.socios) RETURNING id INTO t;
    IF pconta IS NOT NULL AND pdate<=CURRENT_DATE THEN
      PERFORM public.baixar_titulo(t,pvalue,pconta,pforma,(pdate::timestamp AT TIME ZONE 'America/Maceio'));
    END IF;
  END LOOP;
  UPDATE public.venda_pedidos SET status='CONCLUIDO',valor_custo_veiculo=cost,valor_lucro=amount-cost WHERE id=sale;
  PERFORM drivecar_private.lote_close(l.id);
  RETURN sale;
END;
$$;

CREATE FUNCTION drivecar_private.cancelar_venda_lote_impl(p_venda_id uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' SET TimeZone = 'America/Maceio' AS $$
DECLARE v public.venda_pedidos%ROWTYPE; l public.est_lotes%ROWTYPE;
BEGIN
  -- Sempre bloquear lote antes da venda/unidades, mesma ordem de aquisição.
  SELECT * INTO v FROM public.venda_pedidos WHERE id=p_venda_id;
  SELECT * INTO l FROM public.est_lotes WHERE id=v.lote_id FOR UPDATE;
  PERFORM drivecar_private.assert_lote_org(l.organization_id);
  SELECT * INTO STRICT v FROM public.venda_pedidos WHERE id=p_venda_id FOR UPDATE;
  IF v.status='CANCELADO' THEN RETURN; END IF;
  IF l.encerrado THEN RAISE EXCEPTION 'Lote encerrado não permite cancelamento.'; END IF;
  PERFORM 1 FROM public.fin_titulos WHERE venda_pedido_id=v.id FOR UPDATE;
  IF EXISTS(SELECT 1 FROM public.fin_titulos t WHERE t.venda_pedido_id=v.id
    AND (coalesce(t.valor_pago,0)<>0 OR coalesce(t.valor_desconto,0)<>0 OR coalesce(t.valor_acrescimo,0)<>0
      OR EXISTS(SELECT 1 FROM public.fin_transacoes tr WHERE tr.titulo_id=t.id))) THEN
    RAISE EXCEPTION 'Venda com movimentação financeira não pode ser cancelada por este fluxo. Estorno e reembolso exigem uma operação específica ainda não disponível.';
  END IF;
  PERFORM drivecar_private.lote_open(l.id);
  UPDATE public.fin_titulos SET status='CANCELADO',updated_at=now() WHERE venda_pedido_id=v.id;
  UPDATE public.est_veiculos u SET status=it.status_anterior,publicado_site=false,updated_at=now()
    FROM public.venda_lote_itens it WHERE it.venda_id=v.id AND u.id=it.veiculo_id;
  UPDATE public.venda_pedidos SET status='CANCELADO',updated_at=now() WHERE id=v.id;
  PERFORM drivecar_private.lote_close(l.id);
END;
$$;

CREATE FUNCTION drivecar_private.baixar_titulo_lote_impl(p_titulo_id uuid,p_valor numeric,p_conta_id uuid,
  p_forma_pagamento_id uuid,p_data_pagamento date DEFAULT (now() AT TIME ZONE 'America/Maceio')::date,p_request_id uuid DEFAULT gen_random_uuid()) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' SET TimeZone = 'America/Maceio' AS $$
DECLARE t public.fin_titulos%ROWTYPE; l public.est_lotes%ROWTYPE; previous drivecar_private.lote_baixa_requests%ROWTYPE;
  payload jsonb:=jsonb_build_object('titulo',p_titulo_id,'valor',p_valor,'conta',p_conta_id,'forma',p_forma_pagamento_id,'data',p_data_pagamento);
BEGIN
  SELECT * INTO t FROM public.fin_titulos WHERE id=p_titulo_id;
  SELECT * INTO l FROM public.est_lotes WHERE id=t.lote_id FOR UPDATE;
  PERFORM drivecar_private.assert_lote_org(l.organization_id);
  IF p_request_id IS NULL THEN RAISE EXCEPTION 'Identificador de baixa obrigatório.'; END IF;
  SELECT * INTO previous FROM drivecar_private.lote_baixa_requests WHERE request_id=p_request_id;
  IF FOUND THEN
    IF previous.organization_id<>l.organization_id OR previous.payload<>payload THEN RAISE EXCEPTION 'Identificador de baixa utilizado com outros dados.'; END IF;
    RETURN;
  END IF;
  SELECT * INTO STRICT t FROM public.fin_titulos WHERE id=p_titulo_id FOR UPDATE;
  IF t.organization_id IS DISTINCT FROM l.organization_id OR t.status='CANCELADO' OR l.encerrado THEN
    RAISE EXCEPTION 'Título cancelado, lote encerrado ou referência inválida.';
  END IF;
  IF p_valor IS NULL OR p_valor<=0 OR p_valor<>round(p_valor,2)
    OR p_valor>coalesce(t.valor_pendente,t.valor_total+coalesce(t.valor_acrescimo,0)-coalesce(t.valor_desconto,0)-coalesce(t.valor_pago,0))
    OR p_data_pagamento IS NULL OR p_data_pagamento>CURRENT_DATE THEN
    RAISE EXCEPTION 'Informe valor positivo até o saldo pendente e data não futura.';
  END IF;
  PERFORM drivecar_private.assert_ref('public.fin_contas_bancarias',p_conta_id,l.organization_id,true);
  PERFORM drivecar_private.assert_ref('public.cad_formas_pagamento',p_forma_pagamento_id,l.organization_id,true);
  IF NOT EXISTS(SELECT 1 FROM public.fin_contas_bancarias WHERE id=p_conta_id AND ativo)
    OR NOT EXISTS(SELECT 1 FROM public.cad_formas_pagamento WHERE id=p_forma_pagamento_id AND ativo
      AND destino_lancamento<>'CONSIGNACAO' AND tipo_movimentacao IN ('AMBOS',CASE WHEN t.tipo='PAGAR' THEN 'PAGAMENTO' ELSE 'RECEBIMENTO' END)) THEN
    RAISE EXCEPTION 'Conta ou forma incompatível com a baixa.';
  END IF;
  PERFORM drivecar_private.lote_open(l.id);
  INSERT INTO drivecar_private.lote_baixa_requests(request_id,organization_id,titulo_id,payload) VALUES(p_request_id,l.organization_id,t.id,payload);
  PERFORM public.baixar_titulo(t.id,p_valor,p_conta_id,p_forma_pagamento_id,(p_data_pagamento::timestamp AT TIME ZONE 'America/Maceio'));
  PERFORM drivecar_private.lote_close(l.id);
END;
$$;

CREATE FUNCTION drivecar_private.identificar_unidade_lote_impl(p_veiculo_id uuid,p_chassi text DEFAULT NULL,p_placa text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' SET TimeZone = 'America/Maceio' AS $$
DECLARE v public.est_veiculos%ROWTYPE; l public.est_lotes%ROWTYPE; ch text:=nullif(upper(btrim(p_chassi)),''); pl text:=nullif(upper(btrim(p_placa)),'');
BEGIN
  SELECT * INTO v FROM public.est_veiculos WHERE id=p_veiculo_id;
  SELECT * INTO l FROM public.est_lotes WHERE id=v.lote_id FOR UPDATE;
  PERFORM drivecar_private.assert_lote_org(l.organization_id);
  SELECT * INTO STRICT v FROM public.est_veiculos WHERE id=p_veiculo_id FOR UPDATE;
  -- Lock por organização também serializa identificação entre lotes distintos.
  PERFORM pg_advisory_xact_lock(hashtextextended(l.organization_id::text,41));
  IF length(coalesce(ch,''))>50 OR length(coalesce(pl,''))>20 THEN RAISE EXCEPTION 'Identificação muito longa.'; END IF;
  IF EXISTS(SELECT 1 FROM public.est_veiculos WHERE organization_id=l.organization_id AND id<>v.id
    AND ((ch IS NOT NULL AND upper(btrim(chassi))=ch) OR (pl IS NOT NULL AND upper(btrim(placa))=pl))) THEN
    RAISE EXCEPTION 'Chassi ou placa já utilizado em outro veículo da organização.';
  END IF;
  PERFORM drivecar_private.lote_open(l.id);
  UPDATE public.est_veiculos SET chassi=ch,placa=pl,updated_at=now() WHERE id=v.id;
  PERFORM drivecar_private.lote_close(l.id);
END;
$$;

CREATE FUNCTION drivecar_private.encerrar_lote_impl(p_lote_id uuid) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' SET TimeZone = 'America/Maceio' AS $$
DECLARE l public.est_lotes%ROWTYPE;
BEGIN
  SELECT * INTO l FROM public.est_lotes WHERE id=p_lote_id FOR UPDATE;
  PERFORM drivecar_private.assert_lote_org(l.organization_id);
  IF l.encerrado THEN RETURN true; END IF;
  IF EXISTS(SELECT 1 FROM public.est_veiculos WHERE lote_id=l.id AND status IS DISTINCT FROM 'VENDIDO') THEN
    RAISE EXCEPTION 'Venda todas as unidades antes de encerrar o lote.';
  END IF;
  PERFORM 1 FROM public.fin_titulos WHERE lote_id=l.id FOR UPDATE;
  IF EXISTS(SELECT 1 FROM public.fin_titulos WHERE lote_id=l.id AND status NOT IN ('PAGO','CANCELADO')) THEN
    RAISE EXCEPTION 'Quite os títulos de compra, despesas e vendas antes de encerrar o lote.';
  END IF;
  UPDATE public.est_lotes SET encerrado=true WHERE id=l.id;
  RETURN true;
END;
$$;

CREATE FUNCTION public.get_lote_detalhes(p_lote_id uuid) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path = '' AS $$
DECLARE l public.est_lotes%ROWTYPE;
BEGIN
  SELECT * INTO l FROM public.est_lotes WHERE id=p_lote_id;
  IF auth.uid() IS NULL OR l.id IS NULL OR NOT public.is_member_of(l.organization_id) THEN
    RAISE EXCEPTION 'Lote não encontrado ou acesso não autorizado.' USING ERRCODE='42501';
  END IF;
  RETURN jsonb_build_object(
    'lote',to_jsonb(l),
    'unidades',coalesce((SELECT jsonb_agg(to_jsonb(v) ORDER BY v.lote_ordem) FROM public.est_veiculos v WHERE v.lote_id=l.id AND v.organization_id=l.organization_id),'[]'::jsonb),
    'despesas',coalesce((SELECT jsonb_agg(to_jsonb(d)-'request_payload' ORDER BY d.created_at DESC) FROM public.est_lote_despesas d WHERE d.lote_id=l.id AND d.organization_id=l.organization_id),'[]'::jsonb),
    'vendas',coalesce((SELECT jsonb_agg((to_jsonb(v)-'lote_request_payload')||jsonb_build_object(
      'cliente_nome',(SELECT nome FROM public.parceiros WHERE id=v.cliente_id AND organization_id=l.organization_id),
      'itens',coalesce((SELECT jsonb_agg(to_jsonb(it)) FROM public.venda_lote_itens it WHERE it.venda_id=v.id AND it.organization_id=l.organization_id),'[]'::jsonb)) ORDER BY v.created_at DESC)
      FROM public.venda_pedidos v WHERE v.lote_id=l.id AND v.organization_id=l.organization_id),'[]'::jsonb),
    'titulos',coalesce((SELECT jsonb_agg(to_jsonb(t) ORDER BY t.data_vencimento) FROM public.fin_titulos t
      WHERE t.lote_id=l.id AND t.organization_id=l.organization_id),'[]'::jsonb));
END;
$$;

CREATE FUNCTION public.listar_lotes(p_pedido_id uuid DEFAULT NULL,p_search text DEFAULT NULL,
  p_status text DEFAULT NULL,p_montadora_id uuid DEFAULT NULL,p_tipo_id uuid DEFAULT NULL) RETURNS jsonb
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = '' AS $$
  SELECT coalesce(jsonb_agg(to_jsonb(summary) ORDER BY summary.created_at DESC),'[]'::jsonb)
  FROM (
    SELECT l.*,
      count(v.id) FILTER(WHERE v.status='DISPONIVEL') quantidade_disponivel,
      count(v.id) FILTER(WHERE v.status='VENDIDO') quantidade_vendida,
      count(v.id) FILTER(WHERE v.status='PREPARACAO') quantidade_preparacao,
      count(v.id) FILTER(WHERE v.status='RESERVADO') quantidade_reservada
    FROM public.est_lotes l JOIN public.est_veiculos v ON v.lote_id=l.id AND v.organization_id=l.organization_id
    WHERE public.is_member_of(l.organization_id) AND (p_pedido_id IS NULL OR l.pedido_id=p_pedido_id)
      AND EXISTS(SELECT 1 FROM public.est_veiculos u
        LEFT JOIN public.cad_montadoras m ON m.id=u.montadora_id
        LEFT JOIN public.cad_modelos mo ON mo.id=u.modelo_id
        LEFT JOIN public.cad_versoes ve ON ve.id=u.versao_id
        WHERE u.lote_id=l.id AND u.organization_id=l.organization_id
          AND (p_status IS NULL OR p_status='TODOS' OR u.status=CASE WHEN p_status='RASCUNHO' THEN 'PREPARACAO' ELSE p_status END)
          AND (p_montadora_id IS NULL OR u.montadora_id=p_montadora_id)
          AND (p_tipo_id IS NULL OR u.tipo_veiculo_id=p_tipo_id)
          AND (nullif(btrim(p_search),'') IS NULL OR concat_ws(' ',l.descricao,m.nome,mo.nome,ve.nome,u.placa,u.chassi) ILIKE
            '%'||replace(replace(replace(btrim(p_search),chr(92),chr(92)||chr(92)),'%',chr(92)||'%'),'_',chr(92)||'_')||'%'))
    GROUP BY l.id
  ) summary;
$$;

CREATE FUNCTION drivecar_private.guard_lote_legacy() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' SET TimeZone = 'America/Maceio' AS $$
DECLARE oldrow jsonb; newrow jsonb; rowdata jsonb; lot uuid; otherlot uuid; org uuid;
BEGIN
  IF TG_OP<>'INSERT' THEN oldrow:=to_jsonb(OLD); END IF;
  IF TG_OP<>'DELETE' THEN newrow:=to_jsonb(NEW); END IF;
  -- Avalia OLD e NEW: limpar lote_id, trocar FKs ou apagar não escapa da guarda.
  FOR rowdata IN SELECT value FROM jsonb_array_elements(jsonb_build_array(oldrow,newrow)) WHERE value<>'null'::jsonb LOOP
    lot:=NULL; otherlot:=NULL;
    IF TG_TABLE_NAME='est_veiculos' THEN
      lot:=(rowdata->>'lote_id')::uuid;
    ELSIF TG_TABLE_NAME='cmp_pedidos' THEN
      SELECT id INTO lot FROM public.est_lotes WHERE pedido_id=(rowdata->>'id')::uuid;
    ELSIF TG_TABLE_NAME='venda_pedidos' THEN
      lot:=(rowdata->>'lote_id')::uuid;
      SELECT lote_id INTO otherlot FROM public.est_veiculos WHERE id=(rowdata->>'veiculo_id')::uuid;
      lot:=coalesce(lot,otherlot);
      IF lot IS NOT NULL AND (rowdata->>'lote_id')::uuid IS DISTINCT FROM otherlot THEN
        RAISE EXCEPTION 'Venda de unidade de lote deve usar o fluxo de lote.';
      END IF;
    ELSIF TG_TABLE_NAME='venda_pedidos_pagamentos' THEN
      SELECT coalesce(v.lote_id,u.lote_id) INTO lot FROM public.venda_pedidos v
        LEFT JOIN public.est_veiculos u ON u.id=v.veiculo_id WHERE v.id=(rowdata->>'pedido_id')::uuid;
    ELSIF TG_TABLE_NAME='est_veiculos_despesas' THEN
      SELECT lote_id INTO lot FROM public.est_veiculos WHERE id=(rowdata->>'veiculo_id')::uuid;
      IF lot IS NOT NULL THEN RAISE EXCEPTION 'Registre despesas pelo lote; selecione a unidade se a despesa for específica.'; END IF;
    ELSIF TG_TABLE_NAME='fin_titulos' THEN
      lot:=(rowdata->>'lote_id')::uuid;
      IF lot IS NULL THEN SELECT lote_id INTO lot FROM public.est_veiculos WHERE id=(rowdata->>'veiculo_id')::uuid; END IF;
      IF lot IS NULL THEN SELECT id INTO lot FROM public.est_lotes WHERE pedido_id=(rowdata->>'pedido_id')::uuid; END IF;
      IF lot IS NULL THEN SELECT lote_id INTO lot FROM public.venda_pedidos WHERE id=(rowdata->>'venda_pedido_id')::uuid; END IF;
    ELSIF TG_TABLE_NAME='fin_transacoes' THEN
      SELECT lote_id INTO lot FROM public.fin_titulos WHERE id=(rowdata->>'titulo_id')::uuid;
    END IF;
    IF lot IS NOT NULL THEN
      SELECT organization_id INTO org FROM public.est_lotes WHERE id=lot;
      PERFORM drivecar_private.assert_lote_org(org);
      IF rowdata ? 'organization_id' AND (rowdata->>'organization_id')::uuid IS DISTINCT FROM org THEN
        RAISE EXCEPTION 'Referência de organização divergente no lote.' USING ERRCODE='42501';
      END IF;
      IF NOT drivecar_private.lote_has_context(lot) THEN
        RAISE EXCEPTION 'Operação protegida: utilize as ações do lote.' USING ERRCODE='42501';
      END IF;
    END IF;
  END LOOP;
  RETURN coalesce(NEW,OLD);
END;
$$;
CREATE TRIGGER aa_guard_lote_vehicle BEFORE INSERT OR UPDATE OR DELETE ON public.est_veiculos
  FOR EACH ROW EXECUTE FUNCTION drivecar_private.guard_lote_legacy();
CREATE TRIGGER aa_guard_lote_purchase BEFORE UPDATE OR DELETE ON public.cmp_pedidos
  FOR EACH ROW EXECUTE FUNCTION drivecar_private.guard_lote_legacy();
CREATE TRIGGER aa_guard_lote_sale BEFORE INSERT OR UPDATE OR DELETE ON public.venda_pedidos
  FOR EACH ROW EXECUTE FUNCTION drivecar_private.guard_lote_legacy();
CREATE TRIGGER aa_guard_lote_sale_payments BEFORE INSERT OR UPDATE OR DELETE ON public.venda_pedidos_pagamentos
  FOR EACH ROW EXECUTE FUNCTION drivecar_private.guard_lote_legacy();
CREATE TRIGGER aa_guard_lote_vehicle_expenses BEFORE INSERT OR UPDATE OR DELETE ON public.est_veiculos_despesas
  FOR EACH ROW EXECUTE FUNCTION drivecar_private.guard_lote_legacy();
CREATE TRIGGER aa_guard_lote_titles BEFORE INSERT OR UPDATE OR DELETE ON public.fin_titulos
  FOR EACH ROW EXECUTE FUNCTION drivecar_private.guard_lote_legacy();
CREATE TRIGGER aa_guard_lote_transactions BEFORE INSERT OR UPDATE OR DELETE ON public.fin_transacoes
  FOR EACH ROW EXECUTE FUNCTION drivecar_private.guard_lote_legacy();

-- O gatilho legado considerava somente a primeira unidade. A venda de lote tem
-- custo agregado atual; o snapshot original permanece nos itens da venda.
CREATE OR REPLACE FUNCTION public.fn_sync_venda_pedidos_finance() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE amount numeric;
BEGIN
  IF NEW.lote_id IS NOT NULL THEN
    amount:=drivecar_private.custo_atual_venda_lote(NEW.id);
    NEW.valor_custo_veiculo:=amount;
  ELSE
    SELECT coalesce(valor_custo,0)+coalesce(valor_custo_servicos,0) INTO amount FROM public.est_veiculos WHERE id=NEW.veiculo_id;
    NEW.valor_custo_veiculo:=coalesce(amount,0);
  END IF;
  NEW.valor_lucro:=coalesce(NEW.valor_venda,0)-NEW.valor_custo_veiculo;
  RETURN NEW;
END;
$$;

-- Fachadas invoker; implementações privilegiadas ficam em schema não exposto,
-- com auth.uid e associação da organização verificadas antes de qualquer escrita.
CREATE FUNCTION public.criar_lote(p_veiculo_id uuid,p_quantidade integer,p_descricao text) RETURNS uuid
LANGUAGE sql SECURITY INVOKER SET search_path = '' AS $$ SELECT drivecar_private.criar_lote_impl(p_veiculo_id,p_quantidade,p_descricao); $$;
CREATE FUNCTION public.registrar_despesa_lote(p_lote_id uuid,p_dados jsonb,p_request_id uuid) RETURNS uuid
LANGUAGE sql SECURITY INVOKER SET search_path = '' AS $$ SELECT drivecar_private.registrar_despesa_lote_impl(p_lote_id,p_dados,p_request_id); $$;
CREATE FUNCTION public.registrar_venda_lote(p_lote_id uuid,p_dados jsonb,p_request_id uuid) RETURNS uuid
LANGUAGE sql SECURITY INVOKER SET search_path = '' AS $$ SELECT drivecar_private.registrar_venda_lote_impl(p_lote_id,p_dados,p_request_id); $$;
CREATE FUNCTION public.cancelar_venda_lote(p_venda_id uuid) RETURNS void
LANGUAGE sql SECURITY INVOKER SET search_path = '' AS $$ SELECT drivecar_private.cancelar_venda_lote_impl(p_venda_id); $$;
CREATE FUNCTION public.baixar_titulo_lote(p_titulo_id uuid,p_valor numeric,p_conta_id uuid,p_forma_pagamento_id uuid,
  p_data_pagamento date DEFAULT (now() AT TIME ZONE 'America/Maceio')::date,p_request_id uuid DEFAULT gen_random_uuid()) RETURNS void
LANGUAGE sql SECURITY INVOKER SET search_path = '' AS $$ SELECT drivecar_private.baixar_titulo_lote_impl(p_titulo_id,p_valor,p_conta_id,p_forma_pagamento_id,p_data_pagamento,p_request_id); $$;
CREATE FUNCTION public.identificar_unidade_lote(p_veiculo_id uuid,p_chassi text DEFAULT NULL,p_placa text DEFAULT NULL) RETURNS void
LANGUAGE sql SECURITY INVOKER SET search_path = '' AS $$ SELECT drivecar_private.identificar_unidade_lote_impl(p_veiculo_id,p_chassi,p_placa); $$;
CREATE FUNCTION public.encerrar_lote(p_lote_id uuid) RETURNS boolean
LANGUAGE sql SECURITY INVOKER SET search_path = '' AS $$ SELECT drivecar_private.encerrar_lote_impl(p_lote_id); $$;

REVOKE ALL ON ALL FUNCTIONS IN SCHEMA drivecar_private FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION drivecar_private.criar_lote_impl(uuid,integer,text),
  drivecar_private.registrar_despesa_lote_impl(uuid,jsonb,uuid),drivecar_private.registrar_venda_lote_impl(uuid,jsonb,uuid),
  drivecar_private.cancelar_venda_lote_impl(uuid),drivecar_private.baixar_titulo_lote_impl(uuid,numeric,uuid,uuid,date,uuid),
  drivecar_private.identificar_unidade_lote_impl(uuid,text,text),drivecar_private.encerrar_lote_impl(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION drivecar_private.custo_atual_venda_lote(uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.criar_lote(uuid,integer,text),public.registrar_despesa_lote(uuid,jsonb,uuid),
  public.registrar_venda_lote(uuid,jsonb,uuid),public.cancelar_venda_lote(uuid),
  public.baixar_titulo_lote(uuid,numeric,uuid,uuid,date,uuid),public.identificar_unidade_lote(uuid,text,text),
  public.encerrar_lote(uuid),public.get_lote_detalhes(uuid),public.listar_lotes(uuid,text,text,uuid,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.criar_lote(uuid,integer,text),public.registrar_despesa_lote(uuid,jsonb,uuid),
  public.registrar_venda_lote(uuid,jsonb,uuid),public.cancelar_venda_lote(uuid),
  public.baixar_titulo_lote(uuid,numeric,uuid,uuid,date,uuid),public.identificar_unidade_lote(uuid,text,text),
  public.encerrar_lote(uuid),public.get_lote_detalhes(uuid),public.listar_lotes(uuid,text,text,uuid,uuid) TO authenticated;

-- Relatórios globais preservam os contratos anteriores e usam custo gerencial
-- atual agregado de todas as unidades. Despesas tardias atualizam o resultado
-- provisório; não são descontadas integralmente de novo como despesa de caixa.
-- Integração de lotes: get_despesas_variaveis_kpis
CREATE OR REPLACE FUNCTION public.get_despesas_variaveis_kpis(p_tab text DEFAULT 'MES_ATUAL'::text, p_busca text DEFAULT NULL::text, p_categoria_id uuid DEFAULT NULL::uuid, p_data_inicio date DEFAULT NULL::date, p_data_fim date DEFAULT NULL::date, p_hoje date DEFAULT CURRENT_DATE)
 RETURNS jsonb
 LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $function$
DECLARE
    v_valor_total numeric := 0;
    v_valor_pago numeric := 0;
    v_valor_pendente numeric := 0;
    v_mes_inicio date := date_trunc('month', p_hoje)::date;
    v_mes_fim date := (date_trunc('month', p_hoje) + interval '1 month - 1 day')::date;
    v_proximo_mes_inicio date := (date_trunc('month', p_hoje) + interval '1 month')::date;
BEGIN
    SELECT
        COALESCE(SUM(valor_total), 0),
        COALESCE(SUM(COALESCE(valor_pago, 0)), 0),
        COALESCE(SUM(GREATEST(0, valor_total + COALESCE(valor_acrescimo,0) - COALESCE(valor_desconto,0) - COALESCE(valor_pago, 0))), 0)
    INTO
        v_valor_total,
        v_valor_pago,
        v_valor_pendente
    FROM public.fin_titulos
    WHERE tipo = 'PAGAR'
      AND origem_tipo IN ('DESPESA_VARIAVEL', 'DESPESA_VEICULO', 'DESPESA_LOTE')
      AND status != 'CANCELADO'
      AND (
          CASE
              WHEN p_tab = 'MES_ATUAL' THEN (data_vencimento BETWEEN v_mes_inicio AND v_mes_fim)
              WHEN p_tab = 'FUTUROS' THEN (data_vencimento >= v_proximo_mes_inicio)
              WHEN p_tab = 'PAGO' OR p_tab = 'PAGOS' THEN (status = 'PAGO')
              WHEN p_tab = 'PENDENTES' THEN (status != 'PAGO')
              ELSE TRUE
          END
      )
      AND (p_busca IS NULL OR p_busca = '' OR (descricao ILIKE '%' || p_busca || '%' OR documento_ref ILIKE '%' || p_busca || '%'))
      AND (p_categoria_id IS NULL OR categoria_id = p_categoria_id)
      AND (p_data_inicio IS NULL OR data_vencimento >= p_data_inicio)
      AND (p_data_fim IS NULL OR data_vencimento <= p_data_fim);

    RETURN jsonb_build_object(
        'valor_total', v_valor_total,
        'valor_pago', v_valor_pago,
        'valor_pendente', v_valor_pendente
    );
END;
$function$;

-- Integração de lotes: get_caixa_metrics
CREATE OR REPLACE FUNCTION public.get_caixa_metrics(p_data_inicio date, p_data_fim date)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
SET search_path = public, pg_temp
AS $function$
DECLARE
    v_org_id UUID;
    v_total_ativos_estoque numeric;
    v_qtd_veiculos_estoque integer;
    v_saldo_disponivel numeric;
    v_total_recebiveis numeric;
    v_total_passivo_circulante numeric;
    v_total_despesas_fixas numeric;
    v_total_despesas_variaveis numeric;
    v_total_despesas_lote numeric := 0;
    v_total_outros_debitos numeric;
    v_total_outros_creditos numeric;
    v_total_entradas numeric;
    v_total_saidas numeric;
    v_total_compras numeric;
    v_total_vendas_recebido numeric;
    v_total_custo_vendas numeric;
    v_lucro_adicionais numeric;
    v_total_descontos_obtidos numeric;
    v_total_descontos_concedidos numeric;
    v_data_fim_limit timestamp with time zone;
BEGIN
    SELECT organization_id INTO v_org_id FROM public.organization_members WHERE user_id = auth.uid() LIMIT 1;
    IF v_org_id IS NULL THEN RETURN '{}'::jsonb; END IF;

    v_data_fim_limit := (p_data_fim + interval '1 day') - interval '1 microsecond';

    -- 1. Saldo Bancário Real
    SELECT COALESCE(SUM(
        CASE 
            WHEN c.data_saldo_inicial > v_data_fim_limit THEN 0
            ELSE 
                c.saldo_atual 
                - COALESCE((SELECT SUM(t.valor) FROM public.fin_transacoes t WHERE t.conta_origem_id = c.id AND t.tipo = 'ENTRADA' AND t.data_pagamento > v_data_fim_limit AND t.tipo_transacao != 'ESTORNO'), 0)
                + COALESCE((SELECT SUM(t.valor) FROM public.fin_transacoes t WHERE t.conta_origem_id = c.id AND t.tipo = 'SAIDA' AND t.data_pagamento > v_data_fim_limit AND t.tipo_transacao != 'ESTORNO'), 0)
        END
    ), 0) INTO v_saldo_disponivel 
    FROM public.fin_contas_bancarias c WHERE organization_id = v_org_id AND ativo = true;

    -- 2. Ativos em Estoque
    SELECT COALESCE(SUM(COALESCE(valor_custo, 0) + COALESCE(valor_custo_servicos, 0)), 0), COUNT(id)
    INTO v_total_ativos_estoque, v_qtd_veiculos_estoque
    FROM public.est_veiculos ev
    WHERE organization_id = v_org_id 
      AND ev.created_at <= v_data_fim_limit
      AND NOT EXISTS (
          SELECT 1 FROM public.venda_pedidos vp 
          WHERE (vp.veiculo_id = ev.id OR EXISTS(SELECT 1 FROM public.venda_lote_itens li WHERE li.venda_id=vp.id AND li.veiculo_id=ev.id)) 
            AND vp.status = 'CONCLUIDO' 
            AND vp.data_venda::date <= p_data_fim
      );
    
    -- 3. Contas a Receber (Subtraindo descontos)
    SELECT COALESCE(SUM(
        GREATEST(0, 
            tit.valor_total 
            + COALESCE((SELECT SUM(valor) FROM public.fin_transacoes WHERE titulo_id = tit.id AND tipo_transacao = 'ACRESCIMO_TITULO' AND data_pagamento <= v_data_fim_limit), 0)
            - COALESCE((SELECT SUM(valor) FROM public.fin_transacoes WHERE titulo_id = tit.id AND tipo_transacao = 'DESCONTO_TITULO' AND data_pagamento <= v_data_fim_limit), 0)
            - COALESCE((SELECT SUM(
                CASE 
                    WHEN tipo = 'ENTRADA' THEN valor 
                    ELSE -valor 
                END
              ) FROM public.fin_transacoes WHERE titulo_id = tit.id AND tipo_transacao NOT IN ('DESCONTO_TITULO', 'ACRESCIMO_TITULO', 'EMPRESTIMO_CONCEDIDO') AND data_pagamento <= v_data_fim_limit), 0)
        )
    ), 0)
    INTO v_total_recebiveis
    FROM public.fin_titulos tit
    WHERE organization_id = v_org_id 
      AND tipo = 'RECEBER' 
      AND status != 'CANCELADO'
      AND created_at <= v_data_fim_limit;

    -- 4. Contas a Pagar (Subtraindo descontos)
    SELECT COALESCE(SUM(
        GREATEST(0, 
            tit.valor_total 
            + COALESCE((SELECT SUM(valor) FROM public.fin_transacoes WHERE titulo_id = tit.id AND tipo_transacao = 'ACRESCIMO_TITULO' AND data_pagamento <= v_data_fim_limit), 0)
            - COALESCE((SELECT SUM(valor) FROM public.fin_transacoes WHERE titulo_id = tit.id AND tipo_transacao = 'DESCONTO_TITULO' AND data_pagamento <= v_data_fim_limit), 0)
            - COALESCE((SELECT SUM(
                CASE 
                    WHEN tipo = 'SAIDA' THEN valor 
                    ELSE -valor 
                END
              ) FROM public.fin_transacoes WHERE titulo_id = tit.id AND tipo_transacao NOT IN ('DESCONTO_TITULO', 'ACRESCIMO_TITULO', 'EMPRESTIMO_CONCEDIDO') AND data_pagamento <= v_data_fim_limit), 0)
        )
    ), 0)
    INTO v_total_passivo_circulante
    FROM public.fin_titulos tit
    WHERE organization_id = v_org_id 
      AND tipo = 'PAGAR' 
      AND status != 'CANCELADO'
      AND created_at <= v_data_fim_limit;

    -- 5. Entradas Efetivas (Excluindo descontos que são apenas ajustes no papel)
    SELECT COALESCE(SUM(t.valor), 0) INTO v_total_entradas
    FROM public.fin_transacoes t JOIN public.fin_titulos tit ON t.titulo_id = tit.id
    WHERE tit.organization_id = v_org_id 
      AND t.tipo = 'ENTRADA'
      AND tit.origem_tipo <> 'TRANSFERENCIA'
      AND tit.status != 'CANCELADO'
      AND t.tipo_transacao NOT IN ('ESTORNO', 'DESCONTO_TITULO')
      AND t.data_pagamento::date BETWEEN p_data_inicio AND p_data_fim;

    -- 6. Saídas Efetivas (Excluindo descontos obtidos)
    SELECT COALESCE(SUM(t.valor), 0) INTO v_total_saidas
    FROM public.fin_transacoes t JOIN public.fin_titulos tit ON t.titulo_id = tit.id
    WHERE tit.organization_id = v_org_id 
      AND t.tipo = 'SAIDA'
      AND tit.origem_tipo <> 'TRANSFERENCIA'
      AND tit.status != 'CANCELADO'
      AND t.tipo_transacao NOT IN ('ESTORNO', 'DESCONTO_TITULO')
      AND t.data_pagamento::date BETWEEN p_data_inicio AND p_data_fim;

    -- 7. Despesas Fixas Efetivas (Excluindo descontos e acréscimos das despesas normais)
    SELECT COALESCE(SUM(t.valor), 0) INTO v_total_despesas_fixas
    FROM public.fin_transacoes t JOIN public.fin_titulos tit ON t.titulo_id = tit.id
    WHERE tit.organization_id = v_org_id AND tit.tipo = 'PAGAR' AND tit.origem_tipo IN ('RECORRENTE', 'DESPESA', 'DESPESA_FIXA', 'FIXA')
      AND tit.status != 'CANCELADO'
      AND t.tipo_transacao NOT IN ('ESTORNO', 'DESCONTO_TITULO', 'ACRESCIMO_TITULO')
      AND t.data_pagamento::date BETWEEN p_data_inicio AND p_data_fim;

    -- 8. Despesas Variáveis Efetivas (Excluindo descontos e acréscimos)
    SELECT COALESCE(SUM(t.valor), 0) INTO v_total_despesas_variaveis
    FROM public.fin_transacoes t JOIN public.fin_titulos tit ON t.titulo_id = tit.id
    WHERE tit.organization_id = v_org_id AND tit.tipo = 'PAGAR' AND tit.origem_tipo IN ('DESPESA_VARIAVEL', 'DESPESA_VEICULO', 'DESPESA_LOTE', 'VARIAVEL')
      AND tit.status != 'CANCELADO'
      AND t.tipo_transacao NOT IN ('ESTORNO', 'DESCONTO_TITULO', 'ACRESCIMO_TITULO')
      AND t.data_pagamento::date BETWEEN p_data_inicio AND p_data_fim;

    -- Custos de lote são capitalizados e entram no custo das unidades vendidas.
    -- Aparecem na saída variável, mas não podem reduzir o lucro novamente.
    SELECT COALESCE(SUM(t.valor),0) INTO v_total_despesas_lote
    FROM public.fin_transacoes t JOIN public.fin_titulos tit ON tit.id=t.titulo_id
    WHERE tit.organization_id=v_org_id AND tit.origem_tipo='DESPESA_LOTE'
      AND tit.tipo='PAGAR' AND tit.status<>'CANCELADO'
      AND t.tipo_transacao NOT IN ('ESTORNO','DESCONTO_TITULO','ACRESCIMO_TITULO')
      AND t.data_pagamento::date BETWEEN p_data_inicio AND p_data_fim;

    -- 9. Outros Débitos Efetivos
    SELECT COALESCE(SUM(t.valor), 0) INTO v_total_outros_debitos
    FROM public.fin_transacoes t JOIN public.fin_titulos tit ON t.titulo_id = tit.id
    WHERE tit.organization_id = v_org_id AND tit.tipo = 'PAGAR' AND tit.origem_tipo = 'OUTRO_DEBITO'
      AND tit.status != 'CANCELADO'
      AND t.tipo_transacao NOT IN ('ESTORNO', 'DESCONTO_TITULO', 'ACRESCIMO_TITULO')
      AND t.data_pagamento::date BETWEEN p_data_inicio AND p_data_fim;

    -- 9.1. Outros Créditos Efetivos (Recebidos no período - Regime de Caixa)
    SELECT COALESCE(SUM(t.valor), 0) INTO v_total_outros_creditos
    FROM public.fin_transacoes t JOIN public.fin_titulos tit ON t.titulo_id = tit.id
    WHERE tit.organization_id = v_org_id AND tit.tipo = 'RECEBER' AND tit.origem_tipo = 'OUTRO_CREDITO'
      AND tit.status != 'CANCELADO'
      AND t.tipo_transacao NOT IN ('ESTORNO', 'DESCONTO_TITULO', 'ACRESCIMO_TITULO')
      AND t.data_pagamento::date BETWEEN p_data_inicio AND p_data_fim;

    -- 10. Levantamento de Descontos no Período para DRE
    -- Descontos obtidos em contas a pagar (Reduzem o custo / Aumentam o lucro)
    SELECT COALESCE(SUM(t.valor), 0) INTO v_total_descontos_obtidos
    FROM public.fin_transacoes t JOIN public.fin_titulos tit ON t.titulo_id = tit.id
    WHERE tit.organization_id = v_org_id AND tit.tipo = 'PAGAR'
      AND tit.status != 'CANCELADO'
      AND t.tipo_transacao = 'DESCONTO_TITULO'
      AND t.data_pagamento::date BETWEEN p_data_inicio AND p_data_fim;

    -- Descontos concedidos em contas a receber (Reduzem a receita / Diminuem o lucro)
    SELECT COALESCE(SUM(t.valor), 0) INTO v_total_descontos_concedidos
    FROM public.fin_transacoes t JOIN public.fin_titulos tit ON t.titulo_id = tit.id
    WHERE tit.organization_id = v_org_id AND tit.tipo = 'RECEBER'
      AND tit.status != 'CANCELADO'
      AND t.tipo_transacao = 'DESCONTO_TITULO'
      AND t.data_pagamento::date BETWEEN p_data_inicio AND p_data_fim;

    -- 11. Compras e Vendas do Período
    SELECT COALESCE(SUM(valor_negociado), 0) INTO v_total_compras FROM public.cmp_pedidos
    WHERE organization_id = v_org_id AND status = 'CONCLUIDO' AND (created_at::date BETWEEN p_data_inicio AND p_data_fim);

    SELECT COALESCE(SUM(v.valor_venda), 0), COALESCE(SUM(CASE WHEN v.lote_id IS NOT NULL THEN COALESCE(v.valor_custo_veiculo, 0) ELSE COALESCE(c.valor_custo, 0) + COALESCE(c.valor_custo_servicos, 0) END), 0)
    INTO v_total_vendas_recebido, v_total_custo_vendas
    FROM public.venda_pedidos v
    LEFT JOIN public.est_veiculos c ON v.veiculo_id = c.id
    WHERE v.organization_id = v_org_id AND v.status = 'CONCLUIDO' AND v.data_venda::date BETWEEN p_data_inicio AND p_data_fim;

    -- 12. Rendimentos de Empréstimos / Cobranças Avulsas
    SELECT COALESCE(SUM(
        tit.valor_total 
        - COALESCE((
            SELECT SUM(tr.valor) 
            FROM public.fin_transacoes tr 
            WHERE tr.titulo_id = tit.id 
              AND tr.tipo_transacao = 'EMPRESTIMO_CONCEDIDO' 
              AND tr.tipo = 'SAIDA'
          ), 0)
    ), 0)
    INTO v_lucro_adicionais
    FROM public.fin_titulos tit
    WHERE tit.organization_id = v_org_id 
      AND tit.origem_tipo = 'MANUAL'
      AND tit.status != 'CANCELADO'
      AND tit.data_vencimento::date BETWEEN p_data_inicio AND p_data_fim;

    RETURN jsonb_build_object(
        'patrimonio_liquido', (v_saldo_disponivel + v_total_ativos_estoque + v_total_recebiveis) - v_total_passivo_circulante,
        'saldo_disponivel', v_saldo_disponivel,
        'total_ativos_estoque', v_total_ativos_estoque,
        'qtd_veiculos_estoque', v_qtd_veiculos_estoque,
        'total_recebiveis', v_total_recebiveis,
        'total_passivo_circulante', v_total_passivo_circulante,
        'total_despesas_fixas', v_total_despesas_fixas,
        'total_despesas_variaveis', v_total_despesas_variaveis,
        'total_outros_debitos', v_total_outros_debitos,
        'total_entradas', v_total_entradas,
        'total_saidas', v_total_saidas,
        'total_compras', v_total_compras,
        'total_vendas_recebido', v_total_vendas_recebido,
        'total_custo_vendas', v_total_custo_vendas,
        -- O Lucro Mensal agora soma os descontos obtidos e subtrai descontos concedidos, e soma outros créditos recebidos (Regime de Caixa)
        'lucro_mensal', (v_total_vendas_recebido - v_total_custo_vendas + v_lucro_adicionais + v_total_outros_creditos + v_total_descontos_obtidos) - (v_total_despesas_fixas + v_total_despesas_variaveis - v_total_despesas_lote + v_total_outros_debitos + v_total_descontos_concedidos),
        'lucro_gerado', (v_total_vendas_recebido - v_total_custo_vendas + v_lucro_adicionais + v_total_outros_creditos + v_total_descontos_obtidos) - (v_total_despesas_fixas + v_total_despesas_variaveis - v_total_despesas_lote + v_total_outros_debitos + v_total_descontos_concedidos),
        'lucro_realizado', v_total_entradas - v_total_saidas,
        'lucro_pendente', v_total_recebiveis,
        -- Margem de lucro também considera outros créditos
        'margem_lucro', CASE WHEN (v_total_vendas_recebido + v_lucro_adicionais + v_total_outros_creditos) > 0 THEN (((v_total_vendas_recebido - v_total_custo_vendas + v_lucro_adicionais + v_total_outros_creditos + v_total_descontos_obtidos) - (v_total_despesas_fixas + v_total_despesas_variaveis - v_total_despesas_lote + v_total_outros_debitos + v_total_descontos_concedidos)) / (v_total_vendas_recebido + v_lucro_adicionais + v_total_outros_creditos)) * 100 ELSE 0 END
    );
END;
$function$;

-- Integração de lotes: get_caixa_comparativo_mensal
CREATE OR REPLACE FUNCTION public.get_caixa_comparativo_mensal(p_data_inicio timestamp with time zone, p_data_fim timestamp with time zone)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
    v_org_id UUID;
    v_result jsonb;
    
    -- Mês atual
    v_compras_atual NUMERIC;
    v_estoque_atual NUMERIC;
    v_despesas_veiculo_atual NUMERIC;
    v_despesas_fixas_atual NUMERIC;
    v_despesas_variaveis_atual NUMERIC;
    v_vendas_atual NUMERIC;
    v_lucro_atual NUMERIC;
    
    -- Mês anterior
    v_prev_inicio timestamptz;
    v_prev_fim timestamptz;
    v_compras_anterior NUMERIC;
    v_estoque_anterior NUMERIC;
    v_despesas_veiculo_anterior NUMERIC;
    v_despesas_fixas_anterior NUMERIC;
    v_despesas_variaveis_anterior NUMERIC;
    v_vendas_anterior NUMERIC;
    v_lucro_anterior NUMERIC;
BEGIN
    SELECT organization_id INTO v_org_id FROM public.organization_members WHERE user_id = auth.uid() LIMIT 1;
    IF v_org_id IS NULL THEN RETURN jsonb_build_object('error', 'Organização não detectada'); END IF;

    -- Calcular período anterior (mês anterior ao selecionado)
    v_prev_inicio := p_data_inicio - INTERVAL '1 month';
    v_prev_fim := p_data_inicio - INTERVAL '1 second';

    -- ==================== MÊS ATUAL ====================

    -- 1. Compras no mês atual
    SELECT COALESCE(SUM(valor_negociado), 0) INTO v_compras_atual
    FROM public.cmp_pedidos
    WHERE organization_id = v_org_id AND status = 'CONCLUIDO' 
      AND data_compra BETWEEN p_data_inicio AND p_data_fim;

    -- 2. Estoque atual (snapshot - valor no momento)
    SELECT COALESCE(SUM(
        CASE 
            WHEN is_consignado = TRUE THEN COALESCE(valor_custo_servicos, 0)
            ELSE COALESCE(valor_custo, 0) + COALESCE(valor_custo_servicos, 0)
        END
    ), 0) INTO v_estoque_atual
    FROM public.est_veiculos
    WHERE organization_id = v_org_id AND status IN ('DISPONIVEL', 'RESERVADO');

    -- 3. Despesas de veículo no mês atual
    SELECT COALESCE(SUM(d.valor_total), 0) INTO v_despesas_veiculo_atual
    FROM public.est_veiculos_despesas d
    WHERE d.organization_id = v_org_id 
      AND d.status_pagamento = 'PAGO'
      AND d.data BETWEEN p_data_inicio AND p_data_fim;

    -- 4. Despesas fixas no mês atual
    SELECT COALESCE(SUM(t.valor_pago), 0) INTO v_despesas_fixas_atual
    FROM public.fin_titulos t
    JOIN public.fin_categorias c ON t.categoria_id = c.id
    WHERE t.organization_id = v_org_id AND t.tipo = 'PAGAR' AND t.status = 'PAGO'
      AND c.tipo = 'FIXA'
      AND t.data_vencimento BETWEEN p_data_inicio AND p_data_fim;

    -- 5. Despesas variáveis no mês atual
    SELECT COALESCE(SUM(t.valor_pago), 0) INTO v_despesas_variaveis_atual
    FROM public.fin_titulos t
    JOIN public.fin_categorias c ON t.categoria_id = c.id
    WHERE t.organization_id = v_org_id AND t.tipo = 'PAGAR' AND t.status = 'PAGO'
      AND c.tipo = 'VARIAVEL'
      AND t.data_vencimento BETWEEN p_data_inicio AND p_data_fim;

    -- 5.5 Vendas no mês atual
    SELECT COALESCE(SUM(valor_venda), 0) INTO v_vendas_atual
    FROM public.venda_pedidos
    WHERE organization_id = v_org_id AND status = 'CONCLUIDO' 
      AND data_venda BETWEEN p_data_inicio AND p_data_fim;

    -- 6. Lucro no mês atual
    SELECT COALESCE(SUM(v.valor_venda - (CASE WHEN v.lote_id IS NOT NULL THEN COALESCE(v.valor_custo_veiculo, 0) ELSE (COALESCE(e.valor_custo, 0) + COALESCE(e.valor_custo_servicos, 0)) END)), 0)
    INTO v_lucro_atual
    FROM public.venda_pedidos v JOIN public.est_veiculos e ON v.veiculo_id = e.id
    WHERE v.organization_id = v_org_id AND v.status = 'CONCLUIDO' 
      AND v.data_venda BETWEEN p_data_inicio AND p_data_fim;

    -- ==================== MÊS ANTERIOR ====================

    -- 1. Compras no mês anterior
    SELECT COALESCE(SUM(valor_negociado), 0) INTO v_compras_anterior
    FROM public.cmp_pedidos
    WHERE organization_id = v_org_id AND status = 'CONCLUIDO'
      AND data_compra BETWEEN v_prev_inicio AND v_prev_fim;

    -- 2. Estoque do mês anterior (soma dos veículos que estavam em estoque naquele período)
    -- Aproximação: veículos criados antes do fim do período anterior que ainda não foram vendidos até aquele momento
    SELECT COALESCE(SUM(
        CASE 
            WHEN is_consignado = TRUE THEN COALESCE(valor_custo_servicos, 0)
            ELSE COALESCE(valor_custo, 0) + COALESCE(valor_custo_servicos, 0)
        END
    ), 0) INTO v_estoque_anterior
    FROM public.est_veiculos
    WHERE organization_id = v_org_id 
      AND created_at <= v_prev_fim
      AND (status IN ('DISPONIVEL', 'RESERVADO') 
           OR (status = 'VENDIDO' AND updated_at > v_prev_fim));

    -- 3. Despesas de veículo no mês anterior
    SELECT COALESCE(SUM(d.valor_total), 0) INTO v_despesas_veiculo_anterior
    FROM public.est_veiculos_despesas d
    WHERE d.organization_id = v_org_id 
      AND d.status_pagamento = 'PAGO'
      AND d.data BETWEEN v_prev_inicio AND v_prev_fim;

    -- 4. Despesas fixas no mês anterior
    SELECT COALESCE(SUM(t.valor_pago), 0) INTO v_despesas_fixas_anterior
    FROM public.fin_titulos t
    JOIN public.fin_categorias c ON t.categoria_id = c.id
    WHERE t.organization_id = v_org_id AND t.tipo = 'PAGAR' AND t.status = 'PAGO'
      AND c.tipo = 'FIXA'
      AND t.data_vencimento BETWEEN v_prev_inicio AND v_prev_fim;

    -- 5. Despesas variáveis no mês anterior
    SELECT COALESCE(SUM(t.valor_pago), 0) INTO v_despesas_variaveis_anterior
    FROM public.fin_titulos t
    JOIN public.fin_categorias c ON t.categoria_id = c.id
    WHERE t.organization_id = v_org_id AND t.tipo = 'PAGAR' AND t.status = 'PAGO'
      AND c.tipo = 'VARIAVEL'
      AND t.data_vencimento BETWEEN v_prev_inicio AND v_prev_fim;

    -- 5.5 Vendas no mês anterior
    SELECT COALESCE(SUM(valor_venda), 0) INTO v_vendas_anterior
    FROM public.venda_pedidos
    WHERE organization_id = v_org_id AND status = 'CONCLUIDO'
      AND data_venda BETWEEN v_prev_inicio AND v_prev_fim;

    -- 6. Lucro no mês anterior
    SELECT COALESCE(SUM(v.valor_venda - (CASE WHEN v.lote_id IS NOT NULL THEN COALESCE(v.valor_custo_veiculo, 0) ELSE (COALESCE(e.valor_custo, 0) + COALESCE(e.valor_custo_servicos, 0)) END)), 0)
    INTO v_lucro_anterior
    FROM public.venda_pedidos v JOIN public.est_veiculos e ON v.veiculo_id = e.id
    WHERE v.organization_id = v_org_id AND v.status = 'CONCLUIDO' 
      AND v.data_venda BETWEEN v_prev_inicio AND v_prev_fim;

    RETURN jsonb_build_object(
        'mes_atual', jsonb_build_object(
            'vendas', v_vendas_atual,
            'compras', v_compras_atual,
            'estoque', v_estoque_atual,
            'despesas_veiculo', v_despesas_veiculo_atual,
            'despesas_fixas', v_despesas_fixas_atual,
            'despesas_variaveis', v_despesas_variaveis_atual,
            'lucro', v_lucro_atual
        ),
        'mes_anterior', jsonb_build_object(
            'vendas', v_vendas_anterior,
            'compras', v_compras_anterior,
            'estoque', v_estoque_anterior,
            'despesas_veiculo', v_despesas_veiculo_anterior,
            'despesas_fixas', v_despesas_fixas_anterior,
            'despesas_variaveis', v_despesas_variaveis_anterior,
            'lucro', v_lucro_anterior
        )
    );
END;
$function$;

-- Integração de lotes: get_dashboard_history
CREATE OR REPLACE FUNCTION public.get_dashboard_history(p_months_count integer DEFAULT 36)
 RETURNS TABLE(mes date, vendas_valor numeric, vendas_qtd bigint, compras_valor numeric, compras_qtd bigint, despesas_valor numeric, lucro_valor numeric, estoque_valor numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
    v_org_id UUID;
BEGIN
    SELECT organization_id INTO v_org_id FROM public.organization_members WHERE user_id = auth.uid() LIMIT 1;
    IF v_org_id IS NULL THEN RETURN; END IF;

    RETURN QUERY
    WITH meses AS (
        SELECT (date_trunc('month', current_date) - (n || ' months')::interval)::date as mes_referencia
        FROM generate_series(0, p_months_count - 1) n
    ),
    vendas AS (
        SELECT 
            date_trunc('month', v.data_venda)::date as mes_ref,
            sum(v.valor_venda) as total_venda,
            sum(CASE WHEN v.lote_id IS NOT NULL THEN COALESCE(v.valor_custo_veiculo,0) ELSE COALESCE(e.valor_custo,0)+COALESCE(e.valor_custo_servicos,0) END) as total_custo_venda,
            sum(COALESCE(v.quantidade_lote,1))::bigint as qtd_venda
        FROM public.venda_pedidos v
        LEFT JOIN public.est_veiculos e ON v.veiculo_id = e.id
        WHERE v.organization_id = v_org_id 
          AND v.status = 'CONCLUIDO'
          AND v.data_venda >= (date_trunc('month', current_date) - (p_months_count || ' months')::interval)
        GROUP BY 1
    ),
    compras AS (
        SELECT 
            date_trunc('month', data_compra)::date as mes_ref,
            sum(valor_negociado) as total_compra,
            count(*) as qtd_compra
        FROM public.cmp_pedidos
        WHERE organization_id = v_org_id 
          AND status = 'CONCLUIDO'
          AND data_compra >= (date_trunc('month', current_date) - (p_months_count || ' months')::interval)
        GROUP BY 1
    ),
    despesas_titulos AS (
        SELECT 
            date_trunc('month', data_vencimento)::date as mes_ref,
            sum(valor_pago) as total_despesa,
            sum(valor_pago) FILTER (WHERE origem_tipo='DESPESA_LOTE') as total_capitalizado
        FROM public.fin_titulos
        WHERE organization_id = v_org_id 
          AND tipo = 'PAGAR'
          AND status = 'PAGO'
          AND pedido_id IS NULL
          AND despesa_veiculo_id IS NULL
          AND data_vencimento >= (date_trunc('month', current_date) - (p_months_count || ' months')::interval)
        GROUP BY 1
    ),
    historico_estoque AS (
        SELECT 
            m.mes_referencia,
            SUM(COALESCE(e.valor_custo, 0) + COALESCE(e.valor_custo_servicos, 0)) as valor_no_mes
        FROM meses m
        CROSS JOIN public.est_veiculos e
        LEFT JOIN public.venda_pedidos v ON (v.veiculo_id = e.id OR EXISTS(SELECT 1 FROM public.venda_lote_itens li WHERE li.venda_id=v.id AND li.veiculo_id=e.id)) AND v.status = 'CONCLUIDO'
        WHERE e.organization_id = v_org_id
          AND e.created_at <= (m.mes_referencia + interval '1 month' - interval '1 second')
          AND (v.data_venda IS NULL OR v.data_venda > (m.mes_referencia + interval '1 month' - interval '1 second'))
        GROUP BY 1
    )
    SELECT 
        m.mes_referencia as mes,
        coalesce(v.total_venda, 0)::numeric as vendas_valor,
        coalesce(v.qtd_venda, 0)::bigint as vendas_qtd,
        coalesce(c.total_compra, 0)::numeric as compras_valor,
        coalesce(c.qtd_compra, 0)::bigint as compras_qtd,
        coalesce(d.total_despesa, 0)::numeric as despesas_valor,
        (coalesce(v.total_venda, 0) - coalesce(v.total_custo_venda, 0)
          - coalesce(d.total_despesa, 0) + coalesce(d.total_capitalizado,0))::numeric as lucro_valor,
        coalesce(he.valor_no_mes, 0)::numeric as estoque_valor
    FROM meses m
    LEFT JOIN vendas v ON v.mes_ref = m.mes_referencia
    LEFT JOIN compras c ON c.mes_ref = m.mes_referencia
    LEFT JOIN despesas_titulos d ON d.mes_ref = m.mes_referencia
    LEFT JOIN historico_estoque he ON he.mes_referencia = m.mes_referencia
    ORDER BY m.mes_referencia ASC;
END;
$function$;

-- Integração de lotes: get_performance_overview
CREATE OR REPLACE FUNCTION public.get_performance_overview(p_start_date timestamp with time zone, p_end_date timestamp with time zone)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
SET search_path = public, pg_temp
AS $function$
DECLARE
    v_org_id UUID;
    v_vendas_valor NUMERIC := 0;
    v_vendas_qtd INTEGER := 0;
    v_compras_valor NUMERIC := 0;
    v_compras_qtd INTEGER := 0;
    v_lucro_bruto NUMERIC := 0;
    v_margem_media NUMERIC := 0;
    v_despesas_veiculos NUMERIC := 0;
    v_retiradas_socios NUMERIC := 0;
    v_contas_pagar_pendente NUMERIC := 0;
    v_contas_receber_pendente NUMERIC := 0;
    v_saldo_bancario NUMERIC := 0;
    v_total_entradas NUMERIC := 0;
    v_total_saidas NUMERIC := 0;
    v_lucro_adicionais NUMERIC := 0; -- NOVO
BEGIN
    SELECT organization_id INTO v_org_id FROM public.organization_members WHERE user_id = auth.uid() LIMIT 1;
    IF v_org_id IS NULL THEN RETURN null; END IF;

    -- Vendas & Lucro Real (Base + Prep)
    SELECT 
        COALESCE(SUM(v.valor_venda), 0),
        SUM(COALESCE(v.quantidade_lote,1))::integer,
        COALESCE(SUM(v.valor_venda - (CASE WHEN v.lote_id IS NOT NULL THEN COALESCE(v.valor_custo_veiculo, 0) ELSE (COALESCE(e.valor_custo, 0) + COALESCE(e.valor_custo_servicos, 0)) END)), 0),
        COALESCE(AVG(CASE WHEN (CASE WHEN v.lote_id IS NOT NULL THEN COALESCE(v.valor_custo_veiculo, 0) ELSE (COALESCE(e.valor_custo, 0) + COALESCE(e.valor_custo_servicos, 0)) END) > 0 
            THEN ((v.valor_venda - (CASE WHEN v.lote_id IS NOT NULL THEN COALESCE(v.valor_custo_veiculo, 0) ELSE (COALESCE(e.valor_custo, 0) + COALESCE(e.valor_custo_servicos, 0)) END)) / (CASE WHEN v.lote_id IS NOT NULL THEN COALESCE(v.valor_custo_veiculo, 0) ELSE (COALESCE(e.valor_custo, 0) + COALESCE(e.valor_custo_servicos, 0)) END)) * 100 
            ELSE 0 END), 0)
    INTO v_vendas_valor, v_vendas_qtd, v_lucro_bruto, v_margem_media
    FROM public.venda_pedidos v
    LEFT JOIN public.est_veiculos e ON v.veiculo_id = e.id
    WHERE v.organization_id = v_org_id AND v.status = 'CONCLUIDO' AND v.data_venda BETWEEN p_start_date AND p_end_date;

    -- Lucro de Cobranças Adicionais / Empréstimos (origem_tipo = 'MANUAL')
    SELECT COALESCE(SUM(
        tit.valor_total 
        - COALESCE((
            SELECT SUM(tr.valor) 
            FROM public.fin_transacoes tr 
            WHERE tr.titulo_id = tit.id 
              AND tr.tipo_transacao = 'EMPRESTIMO_CONCEDIDO' 
              AND tr.tipo = 'SAIDA'
          ), 0)
    ), 0)
    INTO v_lucro_adicionais
    FROM public.fin_titulos tit
    WHERE tit.organization_id = v_org_id 
      AND tit.origem_tipo = 'MANUAL'
      AND tit.status != 'CANCELADO'
      AND tit.data_vencimento BETWEEN p_start_date::date AND p_end_date::date;

    v_lucro_bruto := v_lucro_bruto + v_lucro_adicionais;

    -- Compras
    SELECT COALESCE(SUM(valor_negociado), 0), COUNT(*)
    INTO v_compras_valor, v_compras_qtd
    FROM public.cmp_pedidos
    WHERE organization_id = v_org_id AND status = 'CONCLUIDO' AND data_compra BETWEEN p_start_date AND p_end_date;

    -- Despesas de Veículos
    SELECT COALESCE(SUM(valor_total), 0)
    INTO v_despesas_veiculos
    FROM public.est_veiculos_despesas
    WHERE organization_id = v_org_id AND data BETWEEN p_start_date AND p_end_date;

    v_despesas_veiculos := v_despesas_veiculos + COALESCE((
      SELECT SUM(d.valor_total) FROM public.est_lote_despesas d
      WHERE d.organization_id=v_org_id AND d.created_at BETWEEN p_start_date AND p_end_date
    ),0);

    -- Retiradas
    SELECT COALESCE(SUM(valor), 0)
    INTO v_retiradas_socios
    FROM public.fin_retiradas
    WHERE organization_id = v_org_id AND data BETWEEN p_start_date AND p_end_date;

    -- Títulos Pendentes
    SELECT COALESCE(SUM(valor_total + COALESCE(valor_acrescimo, 0) - COALESCE(valor_pago, 0) - COALESCE(valor_desconto, 0)), 0) 
    INTO v_contas_pagar_pendente
    FROM public.fin_titulos WHERE organization_id = v_org_id AND tipo = 'PAGAR' AND status NOT IN ('PAGO', 'CANCELADO');
    
    SELECT COALESCE(SUM(valor_total + COALESCE(valor_acrescimo, 0) - COALESCE(valor_pago, 0) - COALESCE(valor_desconto, 0)), 0) 
    INTO v_contas_receber_pendente
    FROM public.fin_titulos WHERE organization_id = v_org_id AND tipo = 'RECEBER' AND status NOT IN ('PAGO', 'CANCELADO');

    -- Saldo Bancário Atual
    SELECT COALESCE(SUM(saldo_atual), 0) INTO v_saldo_bancario 
    FROM public.fin_contas_bancarias WHERE organization_id = v_org_id AND ativo = true;

    -- Fluxo de Transações no Período (Respeitando tipo real)
    SELECT 
        COALESCE(SUM(t.valor) FILTER (WHERE t.tipo = 'ENTRADA'), 0),
        COALESCE(SUM(t.valor) FILTER (WHERE t.tipo = 'SAIDA'), 0)
    INTO v_total_entradas, v_total_saidas
    FROM public.fin_transacoes t
    JOIN public.fin_titulos tit ON t.titulo_id = tit.id
    WHERE tit.organization_id = v_org_id 
      AND t.data_pagamento BETWEEN p_start_date AND p_end_date
      AND tit.status != 'CANCELADO'
      AND t.tipo_transacao != 'ESTORNO';

    RETURN jsonb_build_object(
        'total_vendas_valor', v_vendas_valor,
        'total_vendas_qtd', v_vendas_qtd,
        'total_compras_valor', v_compras_valor,
        'total_compras_qtd', v_compras_qtd,
        'lucro_bruto', v_lucro_bruto,
        'margem_media', v_margem_media,
        'ticket_medio_venda', CASE WHEN v_vendas_qtd > 0 THEN v_vendas_valor / v_vendas_qtd ELSE 0 END,
        'despesas_veiculos', v_despesas_veiculos,
        'retiradas_socios', v_retiradas_socios,
        'contas_pagar_pendente', v_contas_pagar_pendente,
        'contas_receber_pendente', v_contas_receber_pendente,
        'saldo_contas_bancarias', v_saldo_bancario,
        'total_entradas', v_total_entradas,
        'total_saidas', v_total_saidas
    );
END;
$function$;

-- Integração de lotes: get_saldos_socios
CREATE OR REPLACE FUNCTION public.get_saldos_socios()
 RETURNS jsonb
 LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $function$
DECLARE
    v_org_id UUID;
    v_result JSONB;
BEGIN
    SELECT organization_id INTO v_org_id FROM public.organization_members WHERE user_id = auth.uid() LIMIT 1;
    IF v_org_id IS NULL THEN RETURN '[]'::jsonb; END IF;

    WITH lucros_vendas AS (
        SELECT 
            s.id as socio_id,
            s.nome,
            COALESCE(SUM(
                -- NORMALIZED CALCULATION: (Profit * PartnerPerc) / TotalPerc
                ( (vp.valor_venda - (CASE WHEN vp.lote_id IS NOT NULL THEN COALESCE(vp.valor_custo_veiculo,0) ELSE (COALESCE(ev.valor_custo, 0) + COALESCE(ev.valor_custo_servicos, 0)) END)) * COALESCE((vps->>'porcentagem')::numeric, 0) ) 
                / 
                NULLIF((SELECT SUM(COALESCE((p->>'porcentagem')::numeric, 0)) FROM jsonb_array_elements(ev.socios) p), 0)
            ), 0) as total_lucro_vendas
        FROM public.config_socios s
        JOIN public.venda_pedidos vp ON vp.organization_id = s.organization_id
        JOIN public.est_veiculos ev ON vp.veiculo_id = ev.id
        CROSS JOIN LATERAL jsonb_array_elements(ev.socios) vps 
        WHERE s.organization_id = v_org_id
          AND vp.status = 'CONCLUIDO' 
          AND (vps->>'socio_id')::uuid = s.id
          AND s.ativo = true
        GROUP BY s.id, s.nome
    ),
    creditos_diretos AS (
        SELECT 
            (s_elem->>'socio_id')::uuid as socio_id,
            COALESCE(SUM(
                (s_elem->>'valor')::numeric * (t.valor_pago / t.valor_total)
            ), 0) as total_creditos_distribuidos
        FROM public.fin_titulos t
        CROSS JOIN LATERAL jsonb_array_elements(t.socios) s_elem
        WHERE t.organization_id = v_org_id
          AND t.origem_tipo = 'OUTRO_CREDITO'
          AND t.valor_pago > 0
        GROUP BY (s_elem->>'socio_id')::uuid
    ),
    retiradas_reais AS (
        SELECT 
            socio_id,
            COALESCE(SUM(valor), 0) as total_retiradas
        FROM public.fin_retiradas
        WHERE organization_id = v_org_id
          AND descricao NOT LIKE 'DIVISÃO CRÉDITO:%'
        GROUP BY socio_id
    )
    SELECT jsonb_agg(
        jsonb_build_object(
            'socio_id', s.id,
            'nome', s.nome,
            'total_lucro_vendas', ROUND(COALESCE(lv.total_lucro_vendas, 0), 2),
            'total_creditos_distribuidos', ROUND(COALESCE(cd.total_creditos_distribuidos, 0), 2),
            'total_retiradas', ROUND(COALESCE(rr.total_retiradas, 0), 2),
            'saldo_disponivel', ROUND((COALESCE(lv.total_lucro_vendas, 0) + COALESCE(cd.total_creditos_distribuidos, 0)) - COALESCE(rr.total_retiradas, 0), 2)
        )
    ) INTO v_result
    FROM public.config_socios s
    LEFT JOIN lucros_vendas lv ON lv.socio_id = s.id
    LEFT JOIN creditos_diretos cd ON cd.socio_id = s.id
    LEFT JOIN retiradas_reais rr ON rr.socio_id = s.id
    WHERE s.organization_id = v_org_id AND s.ativo = true;

    RETURN COALESCE(v_result, '[]'::jsonb);
END;
$function$;

-- Integração de lotes: get_caixa_patrimonio_socios
CREATE OR REPLACE FUNCTION public.get_caixa_patrimonio_socios(p_data_inicio date, p_data_fim date)
 RETURNS TABLE(socio_id uuid, nome text, cor_primaria text, participacao numeric, lucro_mensal numeric, lucro_pendente numeric, lucro_caixa numeric, valor_investido numeric, percentual_lucro numeric, veiculos jsonb, patrimonio_pessoal jsonb, quantidade_carros bigint, total_investido_todos_socios numeric, total_patrimonio_liquido_todos numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
    v_metrics jsonb;
    v_lucro_total numeric;
    v_lucro_pendente numeric;
    v_lucro_caixa numeric;
    v_total_estoque numeric;
    v_total_liquido numeric;
    v_org_id UUID;
BEGIN
    SELECT organization_id INTO v_org_id FROM public.organization_members WHERE user_id = auth.uid() LIMIT 1;

    -- Obter métricas globais (SSOT)
    SELECT public.get_caixa_metrics(p_data_inicio, p_data_fim) INTO v_metrics;
    v_lucro_total := COALESCE((v_metrics->>'lucro_mensal')::numeric, 0);
    v_lucro_pendente := COALESCE((v_metrics->>'lucro_pendente')::numeric, 0);
    v_lucro_caixa := COALESCE((v_metrics->>'lucro_realizado')::numeric, 0);
    v_total_estoque := COALESCE((v_metrics->>'total_ativos_estoque')::numeric, 0);
    v_total_liquido := COALESCE((v_metrics->>'patrimonio_liquido')::numeric, 0);

    RETURN QUERY
    WITH mapping AS (
        SELECT 
            cs.id as s_id,
            ev.id as v_id,
            ev.placa as v_placa,
            (ev.valor_custo + COALESCE(ev.valor_custo_servicos, 0)) as v_custo_total,
            ((val->>'porcentagem')::numeric) as v_participacao_percentual,
            COALESCE(mon.nome, 'N/A') as v_montadora,
            mon.logo_url as v_montadora_logo,
            COALESCE(mod.nome, 'N/A') as v_modelo,
            COALESCE(ver.nome, 'N/A') as v_versao,
            COALESCE(ev.motorizacao, ver.motorizacao) as v_motorizacao,
            COALESCE(ev.transmissao, ver.transmissao) as v_cambio,
            COALESCE(ev.combustivel, ver.combustivel) as v_combustivel,
            COALESCE(ev.ano_modelo, ver.ano_modelo) as v_ano_modelo,
            COALESCE(ev.ano_fabricacao, ver.ano_fabricacao) as v_ano_fabricacao
        FROM public.config_socios cs
        CROSS JOIN public.est_veiculos ev
        JOIN LATERAL jsonb_array_elements(ev.socios) val ON (val->>'socio_id')::uuid = cs.id
        LEFT JOIN public.cad_montadoras mon ON ev.montadora_id = mon.id
        LEFT JOIN public.cad_modelos mod ON ev.modelo_id = mod.id
        LEFT JOIN public.cad_versoes ver ON ev.versao_id = ver.id
        WHERE ev.organization_id = v_org_id
          AND (
            (p_data_fim >= CURRENT_DATE AND ev.status IN ('DISPONIVEL', 'PREPARACAO', 'RESERVADO'))
            OR
            (p_data_fim < CURRENT_DATE AND ev.created_at::date <= p_data_fim AND NOT EXISTS (
                SELECT 1 FROM public.venda_pedidos vp 
                WHERE (vp.veiculo_id = ev.id OR EXISTS(SELECT 1 FROM public.venda_lote_itens li WHERE li.venda_id=vp.id AND li.veiculo_id=ev.id)) 
                  AND vp.status = 'CONCLUIDO' 
                  AND vp.data_venda::date <= p_data_fim
            ))
          )
    ),
    socio_veiculos AS (
        SELECT 
            m.s_id,
            jsonb_agg(
                jsonb_build_object(
                    'id', m.v_id,
                    'placa', m.v_placa,
                    'montadora', m.v_montadora,
                    'montadora_logo', m.v_montadora_logo,
                    'modelo', m.v_modelo,
                    'versao', m.v_versao,
                    'motorizacao', m.v_motorizacao,
                    'cambio', m.v_cambio,
                    'combustivel', m.v_combustivel,
                    'ano_modelo', m.v_ano_modelo,
                    'ano_fabricacao', m.v_ano_fabricacao,
                    'valor_total_custo', m.v_custo_total,
                    'valor', m.v_custo_total * (m.v_participacao_percentual / 100)
                )
            ) as v_list,
            COUNT(m.v_id) as v_cnt,
            SUM(m.v_custo_total * (m.v_participacao_percentual / 100)) as v_sum
        FROM mapping m
        GROUP BY m.s_id
    )
    SELECT 
        s.id as socio_id,
        s.nome,
        '#3B82F6'::text as cor_primaria,
        COALESCE(s.participacao, 0) as participacao,
        (v_lucro_total * (COALESCE(s.participacao, 0) / 100)) as lucro_mensal,
        (v_lucro_pendente * (COALESCE(s.participacao, 0) / 100)) as lucro_pendente,
        (v_lucro_caixa * (COALESCE(s.participacao, 0) / 100)) as lucro_caixa,
        COALESCE(sv.v_sum, 0)::numeric as valor_investido,
        COALESCE(s.participacao, 0) as percentual_lucro,
        COALESCE(sv.v_list, '[]'::jsonb) as veiculos,
        '[]'::jsonb as patrimonio_pessoal,
        COALESCE(sv.v_cnt, 0) as quantidade_carros,
        v_total_estoque as total_investido_todos_socios,
        v_total_liquido as total_patrimonio_liquido_todos
    FROM public.config_socios s
    LEFT JOIN socio_veiculos sv ON s.id = sv.s_id
    WHERE s.ativo = true
    AND s.organization_id = v_org_id;
END;
$function$;

-- Integração de lotes: get_patrimonio_liquido_at_date
CREATE OR REPLACE FUNCTION public.get_patrimonio_liquido_at_date(p_org_id uuid, p_date timestamp with time zone)
 RETURNS numeric
 LANGUAGE plpgsql
 STABLE
SET search_path = public, pg_temp
AS $function$
DECLARE
    v_saldo_disponivel numeric;
    v_total_ativos_estoque numeric;
    v_total_recebiveis numeric;
    v_total_passivo_circulante numeric;
BEGIN
    -- 1. Saldo Bancário Real no timestamp p_date
    SELECT COALESCE(SUM(
        CASE 
            WHEN c.data_saldo_inicial > p_date THEN 0
            ELSE 
                c.saldo_atual 
                - COALESCE((SELECT SUM(t.valor) FROM public.fin_transacoes t WHERE t.conta_origem_id = c.id AND t.tipo = 'ENTRADA' AND t.data_pagamento > p_date AND t.tipo_transacao != 'ESTORNO'), 0)
                + COALESCE((SELECT SUM(t.valor) FROM public.fin_transacoes t WHERE t.conta_origem_id = c.id AND t.tipo = 'SAIDA' AND t.data_pagamento > p_date AND t.tipo_transacao != 'ESTORNO'), 0)
        END
    ), 0) INTO v_saldo_disponivel 
    FROM public.fin_contas_bancarias c WHERE organization_id = p_org_id AND ativo = true;

    -- 2. Ativos em Estoque no timestamp p_date
    SELECT COALESCE(SUM(COALESCE(valor_custo, 0) + COALESCE(valor_custo_servicos, 0)), 0)
    INTO v_total_ativos_estoque
    FROM public.est_veiculos ev
    WHERE organization_id = p_org_id 
      AND ev.created_at <= p_date
      AND NOT EXISTS (
          SELECT 1 FROM public.venda_pedidos vp 
          WHERE (vp.veiculo_id = ev.id OR EXISTS(SELECT 1 FROM public.venda_lote_itens li WHERE li.venda_id=vp.id AND li.veiculo_id=ev.id)) 
            AND vp.status = 'CONCLUIDO' 
            AND vp.data_venda::timestamp <= p_date
      );

    -- 3. Contas a Receber (Subtraindo descontos) no timestamp p_date
    SELECT COALESCE(SUM(
        GREATEST(0, 
            tit.valor_total 
            + COALESCE((SELECT SUM(valor) FROM public.fin_transacoes WHERE titulo_id = tit.id AND tipo_transacao = 'ACRESCIMO_TITULO' AND data_pagamento <= p_date), 0)
            - COALESCE((SELECT SUM(valor) FROM public.fin_transacoes WHERE titulo_id = tit.id AND tipo_transacao = 'DESCONTO_TITULO' AND data_pagamento <= p_date), 0)
            - COALESCE((SELECT SUM(
                CASE 
                    WHEN tipo = 'ENTRADA' THEN valor 
                    ELSE -valor 
                END
              ) FROM public.fin_transacoes WHERE titulo_id = tit.id AND tipo_transacao NOT IN ('DESCONTO_TITULO', 'ACRESCIMO_TITULO', 'EMPRESTIMO_CONCEDIDO') AND data_pagamento <= p_date), 0)
        )
    ), 0)
    INTO v_total_recebiveis
    FROM public.fin_titulos tit
    WHERE organization_id = p_org_id 
      AND tipo = 'RECEBER' 
      AND status != 'CANCELADO'
      AND created_at <= p_date;

    -- 4. Contas a Pagar (Subtraindo descontos) no timestamp p_date
    SELECT COALESCE(SUM(
        GREATEST(0, 
            tit.valor_total 
            + COALESCE((SELECT SUM(valor) FROM public.fin_transacoes WHERE titulo_id = tit.id AND tipo_transacao = 'ACRESCIMO_TITULO' AND data_pagamento <= p_date), 0)
            - COALESCE((SELECT SUM(valor) FROM public.fin_transacoes WHERE titulo_id = tit.id AND tipo_transacao = 'DESCONTO_TITULO' AND data_pagamento <= p_date), 0)
            - COALESCE((SELECT SUM(
                CASE 
                    WHEN tipo = 'SAIDA' THEN valor 
                    ELSE -valor 
                END
              ) FROM public.fin_transacoes WHERE titulo_id = tit.id AND tipo_transacao NOT IN ('DESCONTO_TITULO', 'ACRESCIMO_TITULO', 'EMPRESTIMO_CONCEDIDO') AND data_pagamento <= p_date), 0)
        )
    ), 0)
    INTO v_total_passivo_circulante
    FROM public.fin_titulos tit
    WHERE organization_id = p_org_id 
      AND tipo = 'PAGAR' 
      AND status != 'CANCELADO'
      AND created_at <= p_date;

    RETURN (v_saldo_disponivel + v_total_ativos_estoque + v_total_recebiveis) - v_total_passivo_circulante;
END;
$function$;
