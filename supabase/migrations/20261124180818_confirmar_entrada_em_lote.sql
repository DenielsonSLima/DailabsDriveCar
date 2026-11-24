-- Confirm a purchase and create its stock batch in the same transaction.
-- One batch per purchase, not one batch per organization; other batches stay intact.
CREATE FUNCTION public.confirmar_pedido_compra_em_lote(
  p_pedido_id uuid, p_quantidade integer, p_descricao text
) RETURNS uuid
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  pedido public.cmp_pedidos%ROWTYPE;
  existente public.est_lotes%ROWTYPE;
  representante uuid;
  total_veiculos bigint;
  disponiveis_para_lote bigint;
  descricao text := pg_catalog.regexp_replace(coalesce(p_descricao, ''), '^[[:space:]]+|[[:space:]]+$', '', 'g');
BEGIN
  IF p_quantidade IS NULL OR p_quantidade NOT BETWEEN 2 AND 1000 THEN
    RAISE EXCEPTION 'Informe uma quantidade inteira entre 2 e 1000 unidades.';
  END IF;
  IF char_length(descricao) NOT BETWEEN 1 AND 200 THEN
    RAISE EXCEPTION 'Informe uma descrição do lote com até 200 caracteres.';
  END IF;

  -- Same purchase lock as the regular confirmation path; serialize retries.
  SELECT * INTO pedido
  FROM public.cmp_pedidos p
  WHERE p.id = p_pedido_id
    AND auth.uid() IS NOT NULL
    AND public.is_member_of(p.organization_id)
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pedido de compra não encontrado ou acesso não autorizado.' USING ERRCODE = '42501';
  END IF;

  IF pedido.status = 'CONCLUIDO' THEN
    SELECT * INTO existente
    FROM public.est_lotes l
    WHERE l.pedido_id = pedido.id AND l.organization_id = pedido.organization_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Esta entrada já foi confirmada sem lote. Use Controlar como lote no pedido, se disponível.';
    END IF;
    IF existente.quantidade_inicial IS DISTINCT FROM p_quantidade OR existente.descricao IS DISTINCT FROM descricao THEN
      RAISE EXCEPTION 'Esta entrada já tem um lote com outros dados. Abra o lote existente para fazer ajustes.';
    END IF;
    RETURN existente.id; -- Idempotent result; never re-run purchase accounting.
  END IF;

  IF pedido.status IS DISTINCT FROM 'RASCUNHO' THEN
    RAISE EXCEPTION 'Somente uma entrada em preparação pode ser confirmada como lote.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.cad_formas_pagamento f
    WHERE f.id = pedido.forma_pagamento_id AND f.nome ILIKE '%consigna%'
  ) THEN
    RAISE EXCEPTION 'A entrada em lote não está disponível para consignação.';
  END IF;

  SELECT count(*),
         count(*) FILTER (WHERE v.organization_id = pedido.organization_id
           AND v.lote_id IS NULL AND NOT coalesce(v.is_consignado, false))
    INTO total_veiculos, disponiveis_para_lote
  FROM public.est_veiculos v WHERE v.pedido_id = pedido.id;

  IF total_veiculos <> 1 OR disponiveis_para_lote <> 1 THEN
    RAISE EXCEPTION 'Cadastre um único veículo para representar todas as unidades do lote.';
  END IF;

  -- Preserve existing finance and RLS behavior. A later validation error in
  -- criar_lote rolls the entire purchase confirmation back, including titles.
  PERFORM public.confirmar_pedido_compra(pedido.id);
  SELECT v.id INTO STRICT representante
  FROM public.est_veiculos v
  WHERE v.pedido_id = pedido.id AND v.organization_id = pedido.organization_id;
  RETURN public.criar_lote(representante, p_quantidade, descricao);
END;
$$;

REVOKE ALL ON FUNCTION public.confirmar_pedido_compra_em_lote(uuid, integer, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.confirmar_pedido_compra_em_lote(uuid, integer, text) TO authenticated;
