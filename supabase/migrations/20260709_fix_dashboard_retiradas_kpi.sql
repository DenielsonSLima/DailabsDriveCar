-- Migration: Fix Retiradas KPI in Financeiro Dashboard
-- Date: 2026-07-09
-- Objetivo: Corrigir o cálculo de v_retiradas na função rpc_kpi_dashboard_financeiro.
-- Anteriormente, tentava dar JOIN com fin_titulos e filtrava por origem_tipo = 'RETIRADA'.
-- Porém, retiradas reais do módulo não possuem título e ficam salvas apenas em fin_retiradas.

CREATE OR REPLACE FUNCTION public.rpc_kpi_dashboard_financeiro()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_org_id uuid := public.get_my_org_id();
    v_saldo_disponivel numeric;
    v_compra_veiculos numeric;
    v_despesas_fixas numeric;
    v_despesas_variaveis numeric;
    v_outras_receitas numeric;
    v_outros_debitos numeric;
    v_retiradas numeric;
BEGIN
    IF v_org_id IS NULL THEN RETURN null; END IF;

    v_saldo_disponivel := public.get_kpi_saldo_bancario();

    -- Compra de Veículos (Mês Atual)
    SELECT COALESCE(SUM(valor_negociado), 0)
    INTO v_compra_veiculos
    FROM public.cmp_pedidos
    WHERE organization_id = v_org_id
      AND status = 'CONCLUIDO'
      AND date_trunc('month', created_at) = date_trunc('month', CURRENT_DATE);

    -- Despesas Fixas (Mês Atual) — CORRIGIDO: exclui estornos e cancelados
    SELECT COALESCE(SUM(tr.valor), 0)
    INTO v_despesas_fixas
    FROM public.fin_transacoes tr
    JOIN public.fin_titulos ti ON tr.titulo_id = ti.id
    WHERE ti.organization_id = v_org_id
      AND ti.tipo = 'PAGAR'
      AND ti.origem_tipo IN ('RECORRENTE', 'DESPESA', 'DESPESA_FIXA')
      AND ti.status != 'CANCELADO'
      AND tr.tipo_transacao != 'ESTORNO'
      AND date_trunc('month', tr.data_pagamento) = date_trunc('month', CURRENT_DATE);

    -- Despesas Variáveis (Mês Atual) — CORRIGIDO: exclui estornos e cancelados
    SELECT COALESCE(SUM(tr.valor), 0)
    INTO v_despesas_variaveis
    FROM public.fin_transacoes tr
    JOIN public.fin_titulos ti ON tr.titulo_id = ti.id
    WHERE ti.organization_id = v_org_id
      AND ti.tipo = 'PAGAR'
      AND ti.origem_tipo IN ('DESPESA_VARIAVEL', 'DESPESA_VEICULO')
      AND ti.status != 'CANCELADO'
      AND tr.tipo_transacao != 'ESTORNO'
      AND date_trunc('month', tr.data_pagamento) = date_trunc('month', CURRENT_DATE);

    -- Outras Receitas (Mês Atual) — CORRIGIDO
    SELECT COALESCE(SUM(tr.valor), 0)
    INTO v_outras_receitas
    FROM public.fin_transacoes tr
    JOIN public.fin_titulos ti ON tr.titulo_id = ti.id
    WHERE ti.organization_id = v_org_id
      AND ti.tipo = 'RECEBER'
      AND ti.origem_tipo = 'OUTRO_CREDITO'
      AND ti.status != 'CANCELADO'
      AND tr.tipo_transacao != 'ESTORNO'
      AND date_trunc('month', tr.data_pagamento) = date_trunc('month', CURRENT_DATE);

    -- Outros Débitos (Mês Atual) — CORRIGIDO
    SELECT COALESCE(SUM(tr.valor), 0)
    INTO v_outros_debitos
    FROM public.fin_transacoes tr
    JOIN public.fin_titulos ti ON tr.titulo_id = ti.id
    WHERE ti.organization_id = v_org_id
      AND ti.tipo = 'PAGAR'
      AND ti.origem_tipo = 'OUTRO_DEBITO'
      AND ti.status != 'CANCELADO'
      AND tr.tipo_transacao != 'ESTORNO'
      AND date_trunc('month', tr.data_pagamento) = date_trunc('month', CURRENT_DATE);

    -- Retiradas (Mês Atual) — CORRIGIDO: Obtém o total diretamente de fin_retiradas
    SELECT COALESCE(SUM(valor), 0)
    INTO v_retiradas
    FROM public.fin_retiradas
    WHERE organization_id = v_org_id
      AND date_trunc('month', data) = date_trunc('month', CURRENT_DATE);

    RETURN json_build_object(
        'saldo_disponivel', v_saldo_disponivel,
        'compra_veiculos', v_compra_veiculos,
        'despesas_fixas', v_despesas_fixas,
        'despesas_variaveis', v_despesas_variaveis,
        'outras_receitas', v_outras_receitas,
        'outros_debitos', v_outros_debitos,
        'retiradas', v_retiradas
    );
END;
$function$;
