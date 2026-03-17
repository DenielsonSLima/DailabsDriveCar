-- ============================================================
-- CORREÇÃO MODULAR (V3): Individualização de KPIs
-- ============================================================
-- Alvo: Criar blocos lógicos independentes para cada métrica
-- evitando que um erro em uma zere todo o dashboard.

-- 1. FUNÇÕES ATÔMICAS (Módulos Base)

-- 1.1. Saldo Bancário Real (Usa a tabela correta)
CREATE OR REPLACE FUNCTION public.get_kpi_saldo_bancario()
RETURNS numeric AS $$
    SELECT COALESCE(SUM(saldo_atual), 0) FROM public.fin_contas_bancarias;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 1.2. Total de Títulos (Receber/Pagar) por Status e Origem
CREATE OR REPLACE FUNCTION public.get_kpi_total_titulos(
    p_tipo text,
    p_status_exclude text[] DEFAULT ARRAY['PAGO', 'CANCELADO'],
    p_origem_include text DEFAULT NULL,
    p_exclude_origem text DEFAULT NULL
)
RETURNS numeric AS $$
    SELECT COALESCE(SUM(valor_total + COALESCE(valor_acrescimo, 0) - valor_pago - COALESCE(valor_desconto, 0)), 0)
    FROM public.fin_titulos
    WHERE tipo = p_tipo
      AND status <> ALL (p_status_exclude)
      AND (p_origem_include IS NULL OR origem_tipo = p_origem_include)
      AND (p_exclude_origem IS NULL OR origem_tipo <> p_exclude_origem);
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 1.3. Movimentação Financeira Efetiva no Período
CREATE OR REPLACE FUNCTION public.get_kpi_movimentacao_periodo(
    p_tipo text,
    p_origem_exclude text[] DEFAULT ARRAY['TRANSFERENCIA'],
    p_start_date date DEFAULT NULL,
    p_end_date date DEFAULT NULL
)
RETURNS numeric AS $$
    SELECT COALESCE(SUM(t.valor), 0)
    FROM public.fin_transacoes t
    JOIN public.fin_titulos tit ON t.titulo_id = tit.id
    WHERE tit.tipo = p_tipo
      AND tit.origem_tipo <> ALL (p_origem_exclude)
      AND (p_start_date IS NULL OR t.data_pagamento::date >= p_start_date)
      AND (p_end_date IS NULL OR t.data_pagamento::date <= p_end_date);
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 1.4. Valor em Estoque (Ativos)
CREATE OR REPLACE FUNCTION public.get_kpi_estoque_valor()
RETURNS numeric AS $$
    SELECT COALESCE(SUM(COALESCE(valor_custo, 0) + COALESCE(valor_custo_servicos, 0)), 0)
    FROM public.est_veiculos
    WHERE status IN ('DISPONIVEL', 'PREPARACAO', 'RESERVADO');
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 2. ORQUESTRADORES (Mantêm compatibilidade com o Frontend)

-- 2.1. Refatoração do get_submodule_kpis
CREATE OR REPLACE FUNCTION public.get_submodule_kpis(
    p_tipo text,
    p_origem_tipo text DEFAULT NULL::text,
    p_exclude_origem_tipo text DEFAULT NULL::text
)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_total_pendente numeric;
    v_total_recebido_hoje numeric;
    v_total_atraso numeric;
BEGIN
    v_total_pendente := public.get_kpi_total_titulos(p_tipo, ARRAY['PAGO', 'CANCELADO'], p_origem_tipo, p_exclude_origem_tipo);
    v_total_recebido_hoje := public.get_kpi_movimentacao_periodo(p_tipo, ARRAY['TRANSFERENCIA'], CURRENT_DATE, CURRENT_DATE);
    
    -- Correção específica para Total Atraso
    SELECT COALESCE(SUM(valor_total + COALESCE(valor_acrescimo, 0) - valor_pago - COALESCE(valor_desconto, 0)), 0)
    INTO v_total_atraso
    FROM fin_titulos
    WHERE tipo = p_tipo
      AND status = 'ATRASADO'
      AND (p_origem_tipo IS NULL OR origem_tipo = p_origem_tipo)
      AND (p_exclude_origem_tipo IS NULL OR origem_tipo <> p_exclude_origem_tipo);

    RETURN json_build_object(
        'total_pendente', v_total_pendente,
        'recebido_hoje', v_total_recebido_hoje,
        'total_atraso', v_total_atraso
    );
END;
$function$;

-- 2.2. Refatoração do get_financeiro_kpis (Dashboard Financeiro)
CREATE OR REPLACE FUNCTION public.get_financeiro_kpis()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_total_receber numeric;
    v_total_pagar numeric;
    v_saldo_atual numeric;
BEGIN
    v_total_receber := public.get_kpi_total_titulos('RECEBER');
    v_total_pagar := public.get_kpi_total_titulos('PAGAR');
    v_saldo_atual := public.get_kpi_saldo_bancario();

    RETURN json_build_object(
        'total_receber', v_total_receber,
        'total_pagar', v_total_pagar,
        'saldo_atual', v_saldo_atual
    );
END;
$function$;

-- 2.3. Refatoração do get_caixa_metrics (Caixa PDV)
CREATE OR REPLACE FUNCTION public.get_caixa_metrics(
    p_data_inicio date,
    p_data_fim date
)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_total_ativos_estoque numeric;
    v_qtd_veiculos_estoque integer;
    v_saldo_disponivel numeric;
    v_total_recebiveis numeric;
    v_total_passivo_circulante numeric;
    v_total_despesas_fixas numeric;
    v_total_despesas_variaveis numeric;
    v_total_entradas numeric;
    v_total_saidas numeric;
    v_total_compras numeric;
    v_total_vendas_recebido numeric;
    v_total_custo_vendas numeric;
BEGIN
    v_saldo_disponivel := public.get_kpi_saldo_bancario();
    v_total_ativos_estoque := public.get_kpi_estoque_valor();
    
    SELECT COUNT(id) INTO v_qtd_veiculos_estoque FROM est_veiculos WHERE status IN ('DISPONIVEL', 'PREPARACAO', 'RESERVADO');
    
    v_total_recebiveis := public.get_kpi_total_titulos('RECEBER');
    v_total_passivo_circulante := public.get_kpi_total_titulos('PAGAR');

    -- Outras métricas por período
    v_total_entradas := public.get_kpi_movimentacao_periodo('RECEBER', ARRAY['TRANSFERENCIA'], p_data_inicio, p_data_fim);
    v_total_saidas := public.get_kpi_movimentacao_periodo('PAGAR', ARRAY['TRANSFERENCIA'], p_data_inicio, p_data_fim);

    -- Despesas Fixas
    SELECT COALESCE(SUM(t.valor), 0) INTO v_total_despesas_fixas
    FROM fin_transacoes t
    JOIN fin_titulos tit ON t.titulo_id = tit.id
    WHERE tit.tipo = 'PAGAR' AND tit.origem_tipo IN ('RECORRENTE', 'DESPESA', 'DESPESA_FIXA')
      AND t.data_pagamento::date BETWEEN p_data_inicio AND p_data_fim;

    -- Despesas Variáveis
    SELECT COALESCE(SUM(t.valor), 0) INTO v_total_despesas_variaveis
    FROM fin_transacoes t
    JOIN fin_titulos tit ON t.titulo_id = tit.id
    WHERE tit.tipo = 'PAGAR' AND tit.origem_tipo IN ('DESPESA_VARIAVEL', 'DESPESA_VEICULO')
      AND t.data_pagamento::date BETWEEN p_data_inicio AND p_data_fim;

    -- VGV e Compras
    SELECT COALESCE(SUM(valor_negociado), 0) INTO v_total_compras FROM cmp_pedidos
    WHERE status = 'CONCLUIDO' AND created_at::date BETWEEN p_data_inicio AND p_data_fim;

    SELECT COALESCE(SUM(v.valor_venda), 0), COALESCE(SUM(COALESCE(c.valor_custo, 0) + COALESCE(c.valor_custo_servicos, 0)), 0)
    INTO v_total_vendas_recebido, v_total_custo_vendas
    FROM venda_pedidos v
    LEFT JOIN est_veiculos c ON v.veiculo_id = c.id
    WHERE v.status = 'CONCLUIDO' AND v.data_venda::date BETWEEN p_data_inicio AND p_data_fim;

    RETURN json_build_object(
        'patrimonio_liquido', (v_saldo_disponivel + v_total_ativos_estoque + v_total_recebiveis) - v_total_passivo_circulante,
        'saldo_disponivel', v_saldo_disponivel,
        'total_ativos_estoque', v_total_ativos_estoque,
        'qtd_veiculos_estoque', v_qtd_veiculos_estoque,
        'total_recebiveis', v_total_recebiveis,
        'total_passivo_circulante', v_total_passivo_circulante,
        'total_despesas_fixas', v_total_despesas_fixas,
        'total_despesas_variaveis', v_total_despesas_variaveis,
        'total_entradas', v_total_entradas,
        'total_saidas', v_total_saidas,
        'total_compras', v_total_compras,
        'total_vendas_recebido', v_total_vendas_recebido,
        'total_custo_vendas', v_total_custo_vendas,
        'lucro_mensal', v_total_vendas_recebido - v_total_custo_vendas
    );
END;
$function$;
