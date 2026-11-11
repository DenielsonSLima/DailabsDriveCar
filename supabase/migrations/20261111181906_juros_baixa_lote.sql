-- Atomic lot settlement using the existing financial adjustment ledger.
CREATE FUNCTION drivecar_private.baixar_titulo_lote_impl(p_titulo_id uuid,p_valor numeric,p_conta_id uuid,
  p_forma_pagamento_id uuid,p_data_pagamento date,p_request_id uuid,p_desconto numeric,p_acrescimo numeric) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' SET TimeZone = 'America/Maceio' AS $$
DECLARE t public.fin_titulos%ROWTYPE; l public.est_lotes%ROWTYPE; previous drivecar_private.lote_baixa_requests%ROWTYPE;
  payload jsonb:=jsonb_build_object('titulo',p_titulo_id,'valor',p_valor,'conta',p_conta_id,'forma',p_forma_pagamento_id,'data',p_data_pagamento);
BEGIN
  -- Omit zero adjustments so old request payloads remain replayable.
  IF p_desconto IS DISTINCT FROM 0 OR p_acrescimo IS DISTINCT FROM 0 THEN
    payload:=payload || jsonb_build_object('desconto',p_desconto,'acrescimo',p_acrescimo);
  END IF;
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
  IF p_valor IS NULL OR p_desconto IS NULL OR p_acrescimo IS NULL
    OR p_valor::text IN ('NaN','Infinity','-Infinity')
    OR p_desconto::text IN ('NaN','Infinity','-Infinity')
    OR p_acrescimo::text IN ('NaN','Infinity','-Infinity')
    OR p_valor<0 OR p_desconto<0 OR p_acrescimo<0
    OR p_valor<>round(p_valor,2) OR p_desconto<>round(p_desconto,2) OR p_acrescimo<>round(p_acrescimo,2)
    OR (p_valor=0 AND p_desconto=0)
    OR coalesce(t.valor_pendente,t.valor_total+coalesce(t.valor_acrescimo,0)-coalesce(t.valor_desconto,0)-coalesce(t.valor_pago,0))<=0
    OR p_valor+p_desconto>coalesce(t.valor_pendente,t.valor_total+coalesce(t.valor_acrescimo,0)-coalesce(t.valor_desconto,0)-coalesce(t.valor_pago,0))+p_acrescimo
    OR p_data_pagamento IS NULL OR p_data_pagamento>CURRENT_DATE THEN
    RAISE EXCEPTION 'Informe pagamento e ajustes válidos até o saldo ajustado e data não futura.';
  END IF;
  -- Discount-only settlements do not create a cash movement or require bank details.
  IF p_valor>0 THEN
    PERFORM drivecar_private.assert_ref('public.fin_contas_bancarias',p_conta_id,l.organization_id,true);
    PERFORM drivecar_private.assert_ref('public.cad_formas_pagamento',p_forma_pagamento_id,l.organization_id,true);
    IF NOT EXISTS(SELECT 1 FROM public.fin_contas_bancarias WHERE id=p_conta_id AND ativo)
      OR NOT EXISTS(SELECT 1 FROM public.cad_formas_pagamento WHERE id=p_forma_pagamento_id AND ativo
        AND destino_lancamento<>'CONSIGNACAO' AND tipo_movimentacao IN ('AMBOS',CASE WHEN t.tipo='PAGAR' THEN 'PAGAMENTO' ELSE 'RECEBIMENTO' END)) THEN
      RAISE EXCEPTION 'Conta ou forma incompatível com a baixa.';
    END IF;
  END IF;
  PERFORM drivecar_private.lote_open(l.id);
  INSERT INTO drivecar_private.lote_baixa_requests(request_id,organization_id,titulo_id,payload) VALUES(p_request_id,l.organization_id,t.id,payload);
  PERFORM public.baixar_titulo(t.id,p_valor,p_conta_id,p_forma_pagamento_id,(p_data_pagamento::timestamp AT TIME ZONE 'America/Maceio'),p_desconto,p_acrescimo);
  PERFORM drivecar_private.lote_close(l.id);
END;
$$;

-- Preserve the six-argument endpoint and its defaults for deployed older clients.
CREATE OR REPLACE FUNCTION drivecar_private.baixar_titulo_lote_impl(p_titulo_id uuid,p_valor numeric,p_conta_id uuid,
  p_forma_pagamento_id uuid,p_data_pagamento date DEFAULT (now() AT TIME ZONE 'America/Maceio')::date,p_request_id uuid DEFAULT gen_random_uuid()) RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path = '' AS $$
  SELECT drivecar_private.baixar_titulo_lote_impl(p_titulo_id,p_valor,p_conta_id,p_forma_pagamento_id,p_data_pagamento,p_request_id,0,0);
$$;

-- All eight arguments are required: PostgREST can select the overload unambiguously.
CREATE FUNCTION public.baixar_titulo_lote(p_titulo_id uuid,p_valor numeric,p_conta_id uuid,p_forma_pagamento_id uuid,
  p_data_pagamento date,p_request_id uuid,p_desconto numeric,p_acrescimo numeric) RETURNS void
LANGUAGE sql SECURITY INVOKER SET search_path = '' AS $$
  SELECT drivecar_private.baixar_titulo_lote_impl(p_titulo_id,p_valor,p_conta_id,p_forma_pagamento_id,p_data_pagamento,p_request_id,p_desconto,p_acrescimo);
$$;
REVOKE ALL ON FUNCTION drivecar_private.baixar_titulo_lote_impl(uuid,numeric,uuid,uuid,date,uuid,numeric,numeric) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.baixar_titulo_lote(uuid,numeric,uuid,uuid,date,uuid,numeric,numeric) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION drivecar_private.baixar_titulo_lote_impl(uuid,numeric,uuid,uuid,date,uuid,numeric,numeric),
  public.baixar_titulo_lote(uuid,numeric,uuid,uuid,date,uuid,numeric,numeric) TO authenticated;
