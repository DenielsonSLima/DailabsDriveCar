CREATE OR REPLACE FUNCTION public.get_despesas_kpis(
    p_origem_tipo text,
    p_tab text,
    p_busca text DEFAULT NULL,
    p_categoria_id uuid DEFAULT NULL,
    p_data_inicio date DEFAULT NULL,
    p_data_fim date DEFAULT NULL,
    p_hoje date DEFAULT CURRENT_DATE
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_total_liquidar numeric := 0;
    v_vencendo_hoje numeric := 0;
    v_total_atrasado numeric := 0;
    v_mes_inicio date := date_trunc('month', p_hoje)::date;
    v_mes_fim date := (date_trunc('month', p_hoje) + interval '1 month - 1 day')::date;
    v_proximo_mes_inicio date := (date_trunc('month', p_hoje) + interval '1 month')::date;
BEGIN
    SELECT 
        COALESCE(SUM(GREATEST(0, valor_total - COALESCE(valor_pago, 0))), 0) AS total_liquidar,
        COALESCE(SUM(CASE WHEN data_vencimento = p_hoje THEN GREATEST(0, valor_total - COALESCE(valor_pago, 0)) ELSE 0 END), 0) AS vencendo_hoje,
        COALESCE(SUM(CASE WHEN data_vencimento < p_hoje THEN GREATEST(0, valor_total - COALESCE(valor_pago, 0)) ELSE 0 END), 0) AS total_atrasado
    INTO
        v_total_liquidar,
        v_vencendo_hoje,
        v_total_atrasado
    FROM public.fin_titulos
    WHERE tipo = 'PAGAR'
      AND origem_tipo = p_origem_tipo
      AND status != 'CANCELADO'
      -- Filtro da aba
      AND (
          CASE 
              WHEN p_tab = 'MES_ATUAL' THEN (data_vencimento BETWEEN v_mes_inicio AND v_mes_fim)
              WHEN p_tab = 'FUTUROS' THEN (data_vencimento >= v_proximo_mes_inicio)
              WHEN p_tab = 'PAGO' OR p_tab = 'PAGOS' THEN (status = 'PAGO')
              WHEN p_tab = 'PENDENTES' THEN (status != 'PAGO')
              ELSE TRUE -- TODOS
          END
      )
      -- Filtro de busca
      AND (p_busca IS NULL OR p_busca = '' OR (descricao ILIKE '%' || p_busca || '%' OR documento_ref ILIKE '%' || p_busca || '%'))
      -- Filtro de categoria
      AND (p_categoria_id IS NULL OR categoria_id = p_categoria_id)
      -- Filtros de datas adicionais
      AND (p_data_inicio IS NULL OR data_vencimento >= p_data_inicio)
      AND (p_data_fim IS NULL OR data_vencimento <= p_data_fim);

    RETURN jsonb_build_object(
        'total_liquidar', v_total_liquidar,
        'vencendo_hoje', v_vencendo_hoje,
        'total_atrasado', v_total_atrasado
    );
END;
$$;
