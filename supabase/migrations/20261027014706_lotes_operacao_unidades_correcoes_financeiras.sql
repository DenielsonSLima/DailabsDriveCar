-- Operação explícita e correções auditáveis; nenhuma exclusão de lançamento financeiro.
CREATE OR REPLACE FUNCTION drivecar_private.registrar_venda_lote_impl(p_lote_id uuid,p_dados jsonb,p_request_id uuid)
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
  -- Novas vendas exigem unidades explícitas. O retorno idempotente acima
  -- mantém a retomada de requisições antigas que ainda não enviavam os IDs.
  IF jsonb_typeof(p_dados->'veiculo_ids') IS DISTINCT FROM 'array'
    OR jsonb_array_length(p_dados->'veiculo_ids')<>quantidade THEN
    RAISE EXCEPTION 'Selecione uma unidade física para cada item da venda.';
  END IF;
  SELECT array_agg(value::uuid ORDER BY ordinality) INTO units
    FROM jsonb_array_elements_text(p_dados->'veiculo_ids') WITH ORDINALITY;
  IF cardinality(units)<>(SELECT count(DISTINCT id) FROM unnest(units) id)
    OR array_position(units,NULL) IS NOT NULL THEN
    RAISE EXCEPTION 'As unidades selecionadas devem ser distintas e válidas.';
  END IF;
  -- Ordem estável de locks, incluindo a trava do lote já adquirida.
  PERFORM 1 FROM public.est_veiculos v WHERE v.id=ANY(units) AND v.lote_id=l.id AND v.organization_id=l.organization_id ORDER BY v.id FOR UPDATE;
  IF (SELECT count(*) FROM public.est_veiculos v WHERE v.id=ANY(units)
    AND v.lote_id=l.id AND v.organization_id=l.organization_id AND v.status='DISPONIVEL'
    AND NOT EXISTS(SELECT 1 FROM public.venda_lote_itens it JOIN public.venda_pedidos vp ON vp.id=it.venda_id
      WHERE it.veiculo_id=v.id AND vp.status='CONCLUIDO'))<>quantidade THEN
    RAISE EXCEPTION 'Uma unidade selecionada não está disponível neste lote.';
  END IF;
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


ALTER TABLE public.est_lote_despesas ADD COLUMN cancelada boolean NOT NULL DEFAULT false;
ALTER TABLE public.fin_transacoes ADD COLUMN estorno_de_id uuid REFERENCES public.fin_transacoes(id);
CREATE UNIQUE INDEX fin_transacoes_estorno_de_unique ON public.fin_transacoes(estorno_de_id) WHERE estorno_de_id IS NOT NULL;
CREATE TABLE public.est_lote_historico (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lote_id uuid NOT NULL REFERENCES public.est_lotes(id),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  user_id uuid NOT NULL,
  acao text NOT NULL CHECK (acao IN ('CORRIGIR_DESPESA','CANCELAR_DESPESA','ESTORNAR_BAIXA','DEVOLVER_VENDA')),
  motivo text NOT NULL CHECK (length(btrim(motivo)) BETWEEN 5 AND 500),
  request_id uuid NOT NULL UNIQUE,
  request_payload jsonb NOT NULL,
  resultado_id uuid NOT NULL,
  antes jsonb NOT NULL,
  depois jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.est_lote_historico ENABLE ROW LEVEL SECURITY;
CREATE POLICY est_lote_historico_read ON public.est_lote_historico FOR SELECT TO authenticated
  USING (public.is_member_of(organization_id));
REVOKE ALL ON public.est_lote_historico FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.est_lote_historico TO authenticated;
CREATE INDEX est_lote_historico_lote_created_idx ON public.est_lote_historico(lote_id,created_at DESC);

-- Mesma fórmula comprovada do recálculo original, excluindo despesas canceladas.
CREATE OR REPLACE FUNCTION drivecar_private.recalcular_lote(p_lote uuid) RETURNS void
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
    FROM public.est_veiculos v LEFT JOIN public.est_lote_despesas d ON d.lote_id=v.lote_id AND NOT d.cancelada
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

-- Auxiliares privados: não concedidos ao cliente; as implementações verificam
-- organização/estado antes de usá-los. A trava por request serializa repetições.
CREATE FUNCTION drivecar_private.lote_correction_request(p_lote uuid,p_request uuid,p_payload jsonb,p_motivo text)
RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE previous public.est_lote_historico%ROWTYPE;
BEGIN
  IF p_request IS NULL OR length(btrim(coalesce(p_motivo,''))) NOT BETWEEN 5 AND 500 THEN
    RAISE EXCEPTION 'Informe identificador da operação e motivo entre 5 e 500 caracteres.';
  END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(p_request::text,73));
  SELECT * INTO previous FROM public.est_lote_historico WHERE request_id=p_request;
  IF FOUND THEN
    IF previous.lote_id IS DISTINCT FROM p_lote OR previous.request_payload IS DISTINCT FROM p_payload THEN
      RAISE EXCEPTION 'Identificador da operação já utilizado com outros dados.';
    END IF;
    RETURN previous.resultado_id;
  END IF;
  RETURN NULL;
END;
$$;
REVOKE ALL ON FUNCTION drivecar_private.lote_correction_request(uuid,uuid,jsonb,text) FROM PUBLIC,anon,authenticated;

CREATE FUNCTION drivecar_private.corrigir_despesa_lote_impl(p_despesa_id uuid,p_dados jsonb,p_motivo text,p_request_id uuid,p_cancelar boolean DEFAULT false)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' SET TimeZone = 'America/Maceio' AS $$
DECLARE d public.est_lote_despesas%ROWTYPE; l public.est_lotes%ROWTYPE; t public.fin_titulos%ROWTYPE;
  before_data jsonb; after_data jsonb; previous uuid; payload jsonb; amount numeric; vence date;
  categoria uuid; fornecedor uuid; unidade uuid; acao text;
BEGIN
  SELECT * INTO d FROM public.est_lote_despesas WHERE id=p_despesa_id;
  SELECT * INTO l FROM public.est_lotes WHERE id=d.lote_id FOR UPDATE;
  PERFORM drivecar_private.assert_lote_org(l.organization_id);
  acao:=CASE WHEN p_cancelar THEN 'CANCELAR_DESPESA' ELSE 'CORRIGIR_DESPESA' END;
  payload:=jsonb_build_object('acao',acao,'despesa',p_despesa_id,'dados',p_dados,'motivo',p_motivo);
  previous:=drivecar_private.lote_correction_request(l.id,p_request_id,payload,p_motivo);
  IF previous IS NOT NULL THEN RETURN previous; END IF;
  SELECT * INTO STRICT d FROM public.est_lote_despesas WHERE id=p_despesa_id FOR UPDATE;
  SELECT * INTO STRICT t FROM public.fin_titulos WHERE id=d.titulo_id FOR UPDATE;
  IF l.encerrado OR d.cancelada THEN RAISE EXCEPTION 'Lote encerrado ou despesa já cancelada.'; END IF;
  IF coalesce(t.valor_pago,0)<>0 OR coalesce(t.valor_desconto,0)<>0 OR coalesce(t.valor_acrescimo,0)<>0 THEN
    RAISE EXCEPTION 'Estorne integralmente os pagamentos e ajustes antes de corrigir ou cancelar a despesa.';
  END IF;
  before_data:=jsonb_build_object('despesa',to_jsonb(d)-'request_payload','titulo',to_jsonb(t));
  PERFORM drivecar_private.lote_open(l.id);
  IF p_cancelar THEN
    UPDATE public.est_lote_despesas SET cancelada=true WHERE id=d.id;
    UPDATE public.fin_titulos SET status='CANCELADO',updated_at=now() WHERE id=t.id;
  ELSE
    IF jsonb_typeof(p_dados) IS DISTINCT FROM 'object' THEN RAISE EXCEPTION 'Dados da correção inválidos.'; END IF;
    amount:=(p_dados->>'valor_total')::numeric;
    IF amount IS NULL OR amount<=0 OR amount<>round(amount,2) OR amount>=10000000000000
      OR length(btrim(coalesce(p_dados->>'descricao',''))) NOT BETWEEN 1 AND 300
      OR coalesce(p_dados->>'data_vencimento','') !~ '^\d{4}-\d{2}-\d{2}$' THEN
      RAISE EXCEPTION 'Informe descrição, valor positivo em centavos e vencimento válido.';
    END IF;
    vence:=(p_dados->>'data_vencimento')::date;
    categoria:=(p_dados->>'categoria_id')::uuid; fornecedor:=(p_dados->>'fornecedor_id')::uuid;
    unidade:=(p_dados->>'veiculo_id')::uuid;
    PERFORM drivecar_private.assert_ref('public.fin_categorias',categoria,l.organization_id,true);
    IF NOT EXISTS(SELECT 1 FROM public.fin_categorias WHERE id=categoria AND natureza='SAIDA' AND tipo='VARIAVEL') THEN
      RAISE EXCEPTION 'Selecione uma categoria de despesa variável de saída.';
    END IF;
    PERFORM drivecar_private.assert_ref('public.parceiros',fornecedor,l.organization_id);
    IF unidade IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.est_veiculos WHERE id=unidade AND lote_id=l.id AND organization_id=l.organization_id) THEN
      RAISE EXCEPTION 'A unidade informada não pertence ao lote.';
    END IF;
    IF coalesce(p_dados->>'comprovante_url','')<>'' AND (p_dados->>'comprovante_url') !~* '^https?://' THEN
      RAISE EXCEPTION 'Use um comprovante com endereço HTTP ou HTTPS.';
    END IF;
    UPDATE public.est_lote_despesas SET descricao=btrim(p_dados->>'descricao'),valor_total=amount,
      data_vencimento=vence,categoria_id=categoria,fornecedor_id=fornecedor,veiculo_id=unidade,
      comprovante_url=nullif(p_dados->>'comprovante_url','') WHERE id=d.id;
    UPDATE public.fin_titulos SET descricao='Lote: '||btrim(p_dados->>'descricao'),valor_total=amount,
      data_vencimento=vence,categoria_id=categoria,parceiro_id=fornecedor,status='PENDENTE',updated_at=now() WHERE id=t.id;
  END IF;
  PERFORM drivecar_private.recalcular_lote(l.id);
  SELECT jsonb_build_object('despesa',to_jsonb(expense)-'request_payload','titulo',to_jsonb(title)) INTO after_data
    FROM public.est_lote_despesas expense JOIN public.fin_titulos title ON title.id=expense.titulo_id WHERE expense.id=d.id;
  INSERT INTO public.est_lote_historico(lote_id,organization_id,user_id,acao,motivo,request_id,request_payload,resultado_id,antes,depois)
    VALUES(l.id,l.organization_id,auth.uid(),acao,btrim(p_motivo),p_request_id,payload,d.id,before_data,after_data);
  PERFORM drivecar_private.lote_close(l.id);
  RETURN d.id;
END;
$$;

-- Somente a compensação insere o movimento inverso. O original permanece
-- imutável e o par é único. As triggers existentes recalculam banco e título.
CREATE FUNCTION drivecar_private.compensar_baixa_lote(p_transacao uuid,p_data date,p_motivo text)
RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE original public.fin_transacoes%ROWTYPE; compensation uuid; account public.fin_contas_bancarias%ROWTYPE; title public.fin_titulos%ROWTYPE;
BEGIN
  SELECT * INTO STRICT original FROM public.fin_transacoes WHERE id=p_transacao FOR UPDATE;
  IF original.estorno_de_id IS NOT NULL OR coalesce(original.tipo_transacao,'')<>'RECEBIMENTO_TITULO'
    OR original.conta_origem_id IS NULL OR original.tipo NOT IN ('ENTRADA','SAIDA') OR original.valor<=0 THEN
    RAISE EXCEPTION 'Somente pagamentos e recebimentos reais podem ser estornados por este fluxo.';
  END IF;
  IF EXISTS(SELECT 1 FROM public.fin_transacoes WHERE estorno_de_id=original.id) THEN
    RAISE EXCEPTION 'Este movimento já possui um estorno.';
  END IF;
  IF p_data IS NULL OR p_data>CURRENT_DATE OR p_data<(original.data_pagamento AT TIME ZONE 'America/Maceio')::date THEN
    RAISE EXCEPTION 'A data do estorno deve estar entre a baixa original e hoje.';
  END IF;
  SELECT * INTO account FROM public.fin_contas_bancarias WHERE id=original.conta_origem_id AND organization_id=original.organization_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Conta original não encontrada na organização.'; END IF;
  IF original.tipo='ENTRADA' AND NOT coalesce(account.permite_negativo,true) AND coalesce(account.saldo_atual,0)<original.valor THEN
    RAISE EXCEPTION 'A conta original não possui saldo suficiente para devolver este recebimento.';
  END IF;
  SELECT * INTO STRICT title FROM public.fin_titulos WHERE id=original.titulo_id;
  IF original.organization_id IS DISTINCT FROM title.organization_id OR original.tipo IS DISTINCT FROM
    (CASE WHEN title.tipo='RECEBER' THEN 'ENTRADA' ELSE 'SAIDA' END) THEN
    RAISE EXCEPTION 'A direção da baixa original diverge do título financeiro.';
  END IF;
  INSERT INTO public.fin_transacoes(user_id,organization_id,titulo_id,conta_origem_id,valor,tipo,
    data_pagamento,forma_pagamento_id,descricao,tipo_transacao,estorno_de_id)
  VALUES(auth.uid(),original.organization_id,original.titulo_id,original.conta_origem_id,original.valor,
    CASE WHEN original.tipo='ENTRADA' THEN 'SAIDA' ELSE 'ENTRADA' END,
    (p_data::timestamp AT TIME ZONE 'America/Maceio'),original.forma_pagamento_id,
    'ESTORNO DO LOTE: '||btrim(p_motivo),'ESTORNO_LOTE',original.id) RETURNING id INTO compensation;
  RETURN compensation;
END;
$$;
REVOKE ALL ON FUNCTION drivecar_private.compensar_baixa_lote(uuid,date,text) FROM PUBLIC,anon,authenticated;

CREATE FUNCTION drivecar_private.estornar_baixa_lote_impl(p_transacao_id uuid,p_motivo text,p_data date,p_request_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' SET TimeZone = 'America/Maceio' AS $$
DECLARE original public.fin_transacoes%ROWTYPE; l public.est_lotes%ROWTYPE; t public.fin_titulos%ROWTYPE;
  previous uuid; compensation uuid; payload jsonb; before_data jsonb; after_data jsonb;
BEGIN
  SELECT * INTO original FROM public.fin_transacoes WHERE id=p_transacao_id;
  SELECT * INTO t FROM public.fin_titulos WHERE id=original.titulo_id;
  SELECT * INTO l FROM public.est_lotes WHERE id=t.lote_id FOR UPDATE;
  PERFORM drivecar_private.assert_lote_org(l.organization_id);
  payload:=jsonb_build_object('acao','ESTORNAR_BAIXA','transacao',p_transacao_id,'motivo',p_motivo,'data',p_data);
  previous:=drivecar_private.lote_correction_request(l.id,p_request_id,payload,p_motivo);
  IF previous IS NOT NULL THEN RETURN previous; END IF;
  IF l.encerrado THEN RAISE EXCEPTION 'O lote está encerrado.'; END IF;
  SELECT * INTO STRICT t FROM public.fin_titulos WHERE id=original.titulo_id FOR UPDATE;
  IF original.organization_id IS DISTINCT FROM l.organization_id OR t.organization_id IS DISTINCT FROM l.organization_id OR t.status='CANCELADO' THEN
    RAISE EXCEPTION 'Título cancelado ou movimento incompatível com a organização.';
  END IF;
  before_data:=jsonb_build_object('titulo',to_jsonb(t),'transacao',to_jsonb(original));
  PERFORM drivecar_private.lote_open(l.id);
  compensation:=drivecar_private.compensar_baixa_lote(original.id,p_data,p_motivo);
  SELECT jsonb_build_object('titulo',to_jsonb(title),'transacao',to_jsonb(movement)) INTO after_data
    FROM public.fin_titulos title JOIN public.fin_transacoes movement ON movement.titulo_id=title.id WHERE movement.id=compensation;
  INSERT INTO public.est_lote_historico(lote_id,organization_id,user_id,acao,motivo,request_id,request_payload,resultado_id,antes,depois)
    VALUES(l.id,l.organization_id,auth.uid(),'ESTORNAR_BAIXA',btrim(p_motivo),p_request_id,payload,compensation,before_data,after_data);
  PERFORM drivecar_private.lote_close(l.id);
  RETURN compensation;
END;
$$;

CREATE FUNCTION drivecar_private.devolver_venda_lote_impl(p_venda_id uuid,p_motivo text,p_data date,p_request_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' SET TimeZone = 'America/Maceio' AS $$
DECLARE v public.venda_pedidos%ROWTYPE; l public.est_lotes%ROWTYPE; original record; result_id uuid:=gen_random_uuid();
  previous uuid; payload jsonb; before_data jsonb; after_data jsonb;
BEGIN
  SELECT * INTO v FROM public.venda_pedidos WHERE id=p_venda_id;
  SELECT * INTO l FROM public.est_lotes WHERE id=v.lote_id FOR UPDATE;
  PERFORM drivecar_private.assert_lote_org(l.organization_id);
  payload:=jsonb_build_object('acao','DEVOLVER_VENDA','venda',p_venda_id,'motivo',p_motivo,'data',p_data);
  previous:=drivecar_private.lote_correction_request(l.id,p_request_id,payload,p_motivo);
  IF previous IS NOT NULL THEN RETURN previous; END IF;
  SELECT * INTO STRICT v FROM public.venda_pedidos WHERE id=p_venda_id FOR UPDATE;
  IF l.encerrado OR v.status<>'CONCLUIDO' THEN RAISE EXCEPTION 'A devolução exige venda concluída em lote aberto.'; END IF;
  IF p_data IS NULL OR p_data>CURRENT_DATE OR p_data<v.data_venda THEN RAISE EXCEPTION 'Informe data entre a venda e hoje.'; END IF;
  PERFORM 1 FROM public.fin_titulos WHERE venda_pedido_id=v.id ORDER BY id FOR UPDATE;
  PERFORM 1 FROM public.fin_transacoes WHERE titulo_id IN (SELECT id FROM public.fin_titulos WHERE venda_pedido_id=v.id) ORDER BY id FOR UPDATE;
  IF EXISTS(SELECT 1 FROM public.fin_titulos WHERE venda_pedido_id=v.id
    AND (organization_id IS DISTINCT FROM l.organization_id OR lote_id IS DISTINCT FROM l.id
      OR coalesce(valor_desconto,0)<>0 OR coalesce(valor_acrescimo,0)<>0))
    OR EXISTS(SELECT 1 FROM public.fin_transacoes tr JOIN public.fin_titulos t ON t.id=tr.titulo_id WHERE t.venda_pedido_id=v.id
      AND (tr.organization_id IS DISTINCT FROM l.organization_id OR coalesce(tr.tipo_transacao,'') NOT IN ('RECEBIMENTO_TITULO','ESTORNO_LOTE')))
  THEN RAISE EXCEPTION 'Venda com ajustes ou movimentos legados exige conferência financeira específica antes da devolução.'; END IF;
  IF EXISTS(SELECT 1 FROM public.fin_titulos t WHERE t.venda_pedido_id=v.id AND coalesce(t.valor_pago,0) IS DISTINCT FROM
    (SELECT coalesce(sum(tr.valor),0) FROM public.fin_transacoes tr WHERE tr.titulo_id=t.id AND tr.tipo='ENTRADA'
      AND tr.tipo_transacao='RECEBIMENTO_TITULO' AND tr.estorno_de_id IS NULL
      AND NOT EXISTS(SELECT 1 FROM public.fin_transacoes reversal WHERE reversal.estorno_de_id=tr.id))) THEN
    RAISE EXCEPTION 'O recebido do título diverge das baixas reais; confira o histórico antes da devolução.';
  END IF;
  IF (SELECT count(*) FROM public.venda_lote_itens WHERE venda_id=v.id AND lote_id=l.id AND organization_id=l.organization_id) IS DISTINCT FROM v.quantidade_lote THEN
    RAISE EXCEPTION 'As unidades vinculadas divergem da quantidade da venda.';
  END IF;
  IF EXISTS(SELECT 1 FROM public.venda_lote_itens it JOIN public.est_veiculos u ON u.id=it.veiculo_id
    WHERE it.venda_id=v.id AND (u.lote_id IS DISTINCT FROM l.id OR u.organization_id IS DISTINCT FROM l.organization_id OR u.status<>'VENDIDO')) THEN
    RAISE EXCEPTION 'As unidades da venda não estão em situação compatível com a devolução.';
  END IF;
  PERFORM 1 FROM public.fin_contas_bancarias WHERE id IN
    (SELECT tr.conta_origem_id FROM public.fin_transacoes tr JOIN public.fin_titulos t ON t.id=tr.titulo_id WHERE t.venda_pedido_id=v.id)
    ORDER BY id FOR UPDATE;
  before_data:=jsonb_build_object('venda',to_jsonb(v),'titulos',(SELECT coalesce(jsonb_agg(to_jsonb(t)),'[]'::jsonb) FROM public.fin_titulos t WHERE t.venda_pedido_id=v.id));
  PERFORM drivecar_private.lote_open(l.id);
  FOR original IN SELECT tr.id FROM public.fin_transacoes tr JOIN public.fin_titulos t ON t.id=tr.titulo_id
    WHERE t.venda_pedido_id=v.id AND tr.tipo_transacao='RECEBIMENTO_TITULO' AND tr.estorno_de_id IS NULL
      AND NOT EXISTS(SELECT 1 FROM public.fin_transacoes reversal WHERE reversal.estorno_de_id=tr.id)
    ORDER BY tr.id
  LOOP
    PERFORM drivecar_private.compensar_baixa_lote(original.id,p_data,'Devolução integral: '||p_motivo);
  END LOOP;
  IF EXISTS(SELECT 1 FROM public.fin_titulos WHERE venda_pedido_id=v.id AND coalesce(valor_pago,0)<>0) THEN
    RAISE EXCEPTION 'A compensação não zerou o recebido; nenhuma alteração foi concluída.';
  END IF;
  UPDATE public.fin_titulos SET status='CANCELADO',updated_at=now() WHERE venda_pedido_id=v.id;
  UPDATE public.est_veiculos u SET status=it.status_anterior,publicado_site=false,updated_at=now()
    FROM public.venda_lote_itens it WHERE it.venda_id=v.id AND u.id=it.veiculo_id;
  UPDATE public.venda_pedidos SET status='CANCELADO',updated_at=now() WHERE id=v.id;
  SELECT jsonb_build_object('venda',to_jsonb(sale),'titulos',(SELECT coalesce(jsonb_agg(to_jsonb(t)),'[]'::jsonb) FROM public.fin_titulos t WHERE t.venda_pedido_id=v.id)) INTO after_data FROM public.venda_pedidos sale WHERE sale.id=v.id;
  INSERT INTO public.est_lote_historico(id,lote_id,organization_id,user_id,acao,motivo,request_id,request_payload,resultado_id,antes,depois)
    VALUES(result_id,l.id,l.organization_id,auth.uid(),'DEVOLVER_VENDA',btrim(p_motivo),p_request_id,payload,result_id,before_data,after_data);
  PERFORM drivecar_private.lote_close(l.id);
  RETURN result_id;
END;
$$;

CREATE FUNCTION public.corrigir_despesa_lote(p_despesa_id uuid,p_dados jsonb,p_motivo text,p_request_id uuid) RETURNS uuid
LANGUAGE sql SECURITY INVOKER SET search_path = '' AS $$ SELECT drivecar_private.corrigir_despesa_lote_impl(p_despesa_id,p_dados,p_motivo,p_request_id,false); $$;
CREATE FUNCTION public.cancelar_despesa_lote(p_despesa_id uuid,p_motivo text,p_request_id uuid) RETURNS uuid
LANGUAGE sql SECURITY INVOKER SET search_path = '' AS $$ SELECT drivecar_private.corrigir_despesa_lote_impl(p_despesa_id,NULL,p_motivo,p_request_id,true); $$;
CREATE FUNCTION public.estornar_baixa_lote(p_transacao_id uuid,p_motivo text,p_data date,p_request_id uuid) RETURNS uuid
LANGUAGE sql SECURITY INVOKER SET search_path = '' AS $$ SELECT drivecar_private.estornar_baixa_lote_impl(p_transacao_id,p_motivo,p_data,p_request_id); $$;
CREATE FUNCTION public.devolver_venda_lote(p_venda_id uuid,p_motivo text,p_data date,p_request_id uuid) RETURNS uuid
LANGUAGE sql SECURITY INVOKER SET search_path = '' AS $$ SELECT drivecar_private.devolver_venda_lote_impl(p_venda_id,p_motivo,p_data,p_request_id); $$;
REVOKE ALL ON FUNCTION drivecar_private.corrigir_despesa_lote_impl(uuid,jsonb,text,uuid,boolean),drivecar_private.estornar_baixa_lote_impl(uuid,text,date,uuid),drivecar_private.devolver_venda_lote_impl(uuid,text,date,uuid),
  public.corrigir_despesa_lote(uuid,jsonb,text,uuid),public.cancelar_despesa_lote(uuid,text,uuid),public.estornar_baixa_lote(uuid,text,date,uuid),public.devolver_venda_lote(uuid,text,date,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION drivecar_private.corrigir_despesa_lote_impl(uuid,jsonb,text,uuid,boolean),drivecar_private.estornar_baixa_lote_impl(uuid,text,date,uuid),drivecar_private.devolver_venda_lote_impl(uuid,text,date,uuid),
  public.corrigir_despesa_lote(uuid,jsonb,text,uuid),public.cancelar_despesa_lote(uuid,text,uuid),public.estornar_baixa_lote(uuid,text,date,uuid),public.devolver_venda_lote(uuid,text,date,uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_lote_detalhes(p_lote_id uuid) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path = '' AS $$
DECLARE l public.est_lotes%ROWTYPE;
BEGIN
  SELECT * INTO l FROM public.est_lotes WHERE id=p_lote_id;
  IF auth.uid() IS NULL OR l.id IS NULL OR NOT public.is_member_of(l.organization_id) THEN
    RAISE EXCEPTION 'Lote não encontrado ou acesso não autorizado.' USING ERRCODE='42501';
  END IF;
  RETURN jsonb_build_object(
    'gestao_versao',2,
    'lote',to_jsonb(l),
    'unidades',coalesce((SELECT jsonb_agg(to_jsonb(v) ORDER BY v.lote_ordem) FROM public.est_veiculos v WHERE v.lote_id=l.id AND v.organization_id=l.organization_id),'[]'::jsonb),
    'despesas',coalesce((SELECT jsonb_agg(to_jsonb(d)-'request_payload' ORDER BY d.created_at DESC) FROM public.est_lote_despesas d WHERE d.lote_id=l.id AND d.organization_id=l.organization_id),'[]'::jsonb),
    'vendas',coalesce((SELECT jsonb_agg((to_jsonb(v)-'lote_request_payload')||jsonb_build_object(
      'cliente_nome',(SELECT nome FROM public.parceiros WHERE id=v.cliente_id AND organization_id=l.organization_id),
      'itens',coalesce((SELECT jsonb_agg(to_jsonb(it)) FROM public.venda_lote_itens it WHERE it.venda_id=v.id AND it.organization_id=l.organization_id),'[]'::jsonb)) ORDER BY v.created_at DESC)
      FROM public.venda_pedidos v WHERE v.lote_id=l.id AND v.organization_id=l.organization_id),'[]'::jsonb),
    'titulos',coalesce((SELECT jsonb_agg(to_jsonb(t) ORDER BY t.data_vencimento) FROM public.fin_titulos t WHERE t.lote_id=l.id AND t.organization_id=l.organization_id),'[]'::jsonb),
    'transacoes',coalesce((SELECT jsonb_agg(to_jsonb(tr)||jsonb_build_object('conta_nome',coalesce(c.banco_nome,'Conta não informada')) ORDER BY tr.data_pagamento DESC,tr.created_at DESC)
      FROM public.fin_transacoes tr JOIN public.fin_titulos t ON t.id=tr.titulo_id AND t.organization_id=tr.organization_id
      LEFT JOIN public.fin_contas_bancarias c ON c.id=tr.conta_origem_id AND c.organization_id=l.organization_id
      WHERE t.lote_id=l.id AND tr.organization_id=l.organization_id),'[]'::jsonb),
    'historico',coalesce((SELECT jsonb_agg(to_jsonb(h)-'request_payload' ORDER BY h.created_at DESC) FROM public.est_lote_historico h WHERE h.lote_id=l.id AND h.organization_id=l.organization_id),'[]'::jsonb));
END;
$$;
NOTIFY pgrst,'reload schema';

-- Despesas canceladas permanecem auditáveis, mas não contam nas métricas.
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
      WHERE d.organization_id=v_org_id AND NOT d.cancelada AND d.created_at BETWEEN p_start_date AND p_end_date
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
      AND (tit.status != 'CANCELADO' OR tit.lote_id IS NOT NULL)
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


-- O ponteiro não é uma autorização. Uma linha sem título não pode sequestrar
-- o UNIQUE de um estorno nem simular que uma baixa já foi compensada.
CREATE FUNCTION drivecar_private.guard_estorno_lote() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE snapshot jsonb; original public.fin_transacoes%ROWTYPE; t public.fin_titulos%ROWTYPE;
  lote public.est_lotes%ROWTYPE; rows jsonb[]:='{}';
BEGIN
  IF TG_OP<>'INSERT' THEN rows:=array_append(rows,to_jsonb(OLD)); END IF;
  IF TG_OP<>'DELETE' THEN rows:=array_append(rows,to_jsonb(NEW)); END IF;
  FOREACH snapshot IN ARRAY rows LOOP
    IF snapshot->>'estorno_de_id' IS NULL THEN
      IF snapshot->>'tipo_transacao'='ESTORNO_LOTE' THEN RAISE EXCEPTION 'Um estorno do lote exige o movimento original.'; END IF;
      CONTINUE;
    END IF;
    SELECT * INTO original FROM public.fin_transacoes WHERE id=(snapshot->>'estorno_de_id')::uuid;
    SELECT * INTO t FROM public.fin_titulos WHERE id=original.titulo_id;
    SELECT * INTO lote FROM public.est_lotes WHERE id=t.lote_id;
    PERFORM drivecar_private.assert_lote_org(lote.organization_id);
    IF NOT drivecar_private.lote_has_context(lote.id) THEN
      RAISE EXCEPTION 'Operação protegida: estorne a baixa pelo controle do lote.' USING ERRCODE='42501';
    END IF;
    IF original.estorno_de_id IS NOT NULL OR original.tipo_transacao IS DISTINCT FROM 'RECEBIMENTO_TITULO'
      OR original.organization_id IS DISTINCT FROM lote.organization_id
      OR t.organization_id IS DISTINCT FROM lote.organization_id
      OR (snapshot->>'titulo_id')::uuid IS DISTINCT FROM original.titulo_id
      OR (snapshot->>'organization_id')::uuid IS DISTINCT FROM original.organization_id
      OR (snapshot->>'conta_origem_id')::uuid IS DISTINCT FROM original.conta_origem_id
      OR (snapshot->>'valor')::numeric IS DISTINCT FROM original.valor
      OR snapshot->>'tipo' IS DISTINCT FROM (CASE WHEN original.tipo='ENTRADA' THEN 'SAIDA' ELSE 'ENTRADA' END)
      OR snapshot->>'tipo_transacao' IS DISTINCT FROM 'ESTORNO_LOTE'
      OR original.conta_origem_id IS NULL OR original.valor<=0
    THEN RAISE EXCEPTION 'A compensação deve conservar título, organização, conta e valor da baixa original, com direção inversa.'; END IF;
  END LOOP;
  RETURN coalesce(NEW,OLD);
END;
$$;
REVOKE ALL ON FUNCTION drivecar_private.guard_estorno_lote() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER aa_guard_estorno_lote BEFORE INSERT OR UPDATE OR DELETE ON public.fin_transacoes
  FOR EACH ROW EXECUTE FUNCTION drivecar_private.guard_estorno_lote();
NOTIFY pgrst,'reload schema';

-- Movimentos reais de lotes cancelados permanecem no fluxo de caixa;
-- pendências e receitas continuam excluindo títulos cancelados.
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
      AND (tit.status != 'CANCELADO' OR tit.lote_id IS NOT NULL)
      AND t.tipo_transacao NOT IN ('ESTORNO', 'DESCONTO_TITULO')
      AND t.data_pagamento::date BETWEEN p_data_inicio AND p_data_fim;

    -- 6. Saídas Efetivas (Excluindo descontos obtidos)
    SELECT COALESCE(SUM(t.valor), 0) INTO v_total_saidas
    FROM public.fin_transacoes t JOIN public.fin_titulos tit ON t.titulo_id = tit.id
    WHERE tit.organization_id = v_org_id 
      AND t.tipo = 'SAIDA'
      AND tit.origem_tipo <> 'TRANSFERENCIA'
      AND (tit.status != 'CANCELADO' OR tit.lote_id IS NOT NULL)
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
    SELECT COALESCE(SUM(CASE WHEN tit.lote_id IS NOT NULL AND t.tipo='ENTRADA' THEN -t.valor ELSE t.valor END), 0) INTO v_total_despesas_variaveis
    FROM public.fin_transacoes t JOIN public.fin_titulos tit ON t.titulo_id = tit.id
    WHERE tit.organization_id = v_org_id AND tit.tipo = 'PAGAR' AND tit.origem_tipo IN ('DESPESA_VARIAVEL', 'DESPESA_VEICULO', 'DESPESA_LOTE', 'VARIAVEL')
      AND (tit.status != 'CANCELADO' OR tit.lote_id IS NOT NULL)
      AND t.tipo_transacao NOT IN ('ESTORNO', 'DESCONTO_TITULO', 'ACRESCIMO_TITULO')
      AND t.data_pagamento::date BETWEEN p_data_inicio AND p_data_fim;

    -- Custos de lote são capitalizados e entram no custo das unidades vendidas.
    -- Aparecem na saída variável, mas não podem reduzir o lucro novamente.
    SELECT COALESCE(SUM(CASE WHEN tit.lote_id IS NOT NULL AND t.tipo='ENTRADA' THEN -t.valor ELSE t.valor END),0) INTO v_total_despesas_lote
    FROM public.fin_transacoes t JOIN public.fin_titulos tit ON tit.id=t.titulo_id
    WHERE tit.organization_id=v_org_id AND tit.origem_tipo='DESPESA_LOTE'
      AND tit.tipo='PAGAR' AND (tit.status<>'CANCELADO' OR tit.lote_id IS NOT NULL)
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

