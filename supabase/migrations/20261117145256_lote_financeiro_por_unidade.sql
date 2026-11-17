-- Additive RPC contract only. No historical rows or payments are changed.
BEGIN;

CREATE OR REPLACE FUNCTION drivecar_private.registrar_venda_lote_impl(p_lote_id uuid,p_dados jsonb,p_request_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' SET TimeZone = 'America/Maceio' AS $$
DECLARE l public.est_lotes%ROWTYPE; existing public.venda_pedidos%ROWTYPE;
  sale uuid:=gen_random_uuid(); cliente uuid; quantidade integer; amount numeric; sale_date date;
  units uuid[]; u public.est_veiculos%ROWTYPE; payment jsonb; identification jsonb;
  i integer:=0; payment_count integer; payment_number integer:=0; price numeric; cost numeric:=0;
  per_unit boolean; unit_index integer; unit_numbers integer[]; payment_unit uuid;
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
  -- Explicit opt-in. Missing mode retains the old shared sale contract; never reallocate history.
  IF p_dados ? 'modo_financeiro' AND (p_dados->>'modo_financeiro') IS DISTINCT FROM 'POR_UNIDADE' THEN
    RAISE EXCEPTION 'Modo financeiro inválido.';
  END IF;
  per_unit := coalesce(p_dados->>'modo_financeiro' = 'POR_UNIDADE', false);
  IF per_unit THEN
    FOR payment IN SELECT value FROM jsonb_array_elements(p_dados->'pagamentos') LOOP
      IF jsonb_typeof(payment->'unidade_indice') IS DISTINCT FROM 'number'
        OR coalesce(payment->>'unidade_indice','') !~ '^(0|[1-9][0-9]*)$' THEN
        RAISE EXCEPTION 'Cada recebimento deve identificar a unidade por índice inteiro iniciado em zero.';
      END IF;
      -- Numeric comparison before integer cast prevents overflows for hostile payloads.
      IF (payment->>'unidade_indice')::numeric >= quantidade THEN
        RAISE EXCEPTION 'Índice da unidade fora da quantidade da venda.';
      END IF;
    END LOOP;
    FOR unit_index IN 0..quantidade-1 LOOP
      price := (floor(amount*100/quantidade)+CASE WHEN unit_index<mod(amount*100,quantidade) THEN 1 ELSE 0 END)/100;
      SELECT sum((value->>'valor')::numeric) INTO total_payments
        FROM jsonb_array_elements(p_dados->'pagamentos')
        WHERE (value->>'unidade_indice')::integer = unit_index;
      IF total_payments IS DISTINCT FROM price THEN
        RAISE EXCEPTION 'O cronograma de cada moto deve totalizar exatamente seu valor em centavos.';
      END IF;
    END LOOP;
    unit_numbers := array_fill(0, ARRAY[quantidade]);
  ELSIF EXISTS(SELECT 1 FROM jsonb_array_elements(p_dados->'pagamentos') WHERE value ? 'unidade_indice') THEN
    RAISE EXCEPTION 'Pagamentos por unidade exigem modo financeiro POR_UNIDADE.';
  END IF;
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
    IF per_unit THEN
      unit_index := (payment->>'unidade_indice')::integer;
      payment_unit := units[unit_index+1];
      unit_numbers[unit_index+1] := unit_numbers[unit_index+1]+1;
      payment_number := unit_numbers[unit_index+1];
      SELECT count(*) INTO payment_count FROM jsonb_array_elements(p_dados->'pagamentos')
        WHERE (value->>'unidade_indice')::integer = unit_index;
    ELSE
      payment_unit := units[1];
      payment_number := payment_number+1;
    END IF;
    INSERT INTO public.venda_pedidos_pagamentos(pedido_id,organization_id,data_recebimento,valor,forma_pagamento_id,conta_bancaria_id)
      VALUES(sale,l.organization_id,pdate,pvalue,pforma,pconta);
    INSERT INTO public.fin_titulos(lote_id,organization_id,user_id,parceiro_id,venda_pedido_id,veiculo_id,descricao,tipo,
      valor_total,data_emissao,data_vencimento,forma_pagamento_id,origem_tipo,origem_id,parcela_numero,parcela_total,socios)
    VALUES(l.id,l.organization_id,auth.uid(),cliente,sale,payment_unit,'Venda do lote: '||l.descricao,'RECEBER',
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

CREATE OR REPLACE FUNCTION public.get_lote_detalhes(p_lote_id uuid) RETURNS jsonb
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
      'modo_financeiro',coalesce(v.lote_request_payload->>'modo_financeiro','LEGADO'),
      'cliente_nome',(SELECT nome FROM public.parceiros WHERE id=v.cliente_id AND organization_id=l.organization_id),
      'itens',coalesce((SELECT jsonb_agg(to_jsonb(it)) FROM public.venda_lote_itens it WHERE it.venda_id=v.id AND it.organization_id=l.organization_id),'[]'::jsonb)) ORDER BY v.created_at DESC)
      FROM public.venda_pedidos v WHERE v.lote_id=l.id AND v.organization_id=l.organization_id),'[]'::jsonb),
    'titulos',coalesce((SELECT jsonb_agg(to_jsonb(t) ORDER BY t.data_vencimento) FROM public.fin_titulos t
      WHERE t.lote_id=l.id AND t.organization_id=l.organization_id),'[]'::jsonb));
END;
$$;


COMMIT;
