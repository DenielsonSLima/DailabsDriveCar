CREATE OR REPLACE FUNCTION public.get_despesas_variaveis_kpis(
    p_tab text DEFAULT 'MES_ATUAL',
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
        COALESCE(SUM(GREATEST(0, valor_total - COALESCE(valor_pago, 0))), 0)
    INTO
        v_valor_total,
        v_valor_pago,
        v_valor_pendente
    FROM public.fin_titulos
    WHERE tipo = 'PAGAR'
      AND origem_tipo IN ('DESPESA_VARIAVEL', 'DESPESA_VEICULO')
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
$$;
