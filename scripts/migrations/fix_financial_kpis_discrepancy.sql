-- ============================================================
-- CORREÇÃO (V2): Unificação de KPIs Financeiro e Caixa
-- ============================================================
-- Alvo: R$ 89.700,00 (Soma real dos saldos pendentes)
-- Garante que o Caixa e o Financeiro usem a mesma lógica
-- de soma aritmética do saldo aberto de cada título.

CREATE OR REPLACE FUNCTION public.get_submodule_kpis(
    p_tipo public.fin_titulo_tipo,
    p_origem_tipo public.fin_origem_sistema DEFAULT NULL::public.fin_origem_sistema,
    p_exclude_origem_tipo public.fin_origem_sistema DEFAULT NULL::public.fin_origem_sistema
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
    -- Total Pendente: Soma exata do saldo aberto (Total - Pago - Desconto + Acréscimo)
    -- de todos os títulos não quitados nem cancelados.
    SELECT COALESCE(SUM(valor_total + COALESCE(valor_acrescimo, 0) - valor_pago - COALESCE(valor_desconto, 0)), 0)
    INTO v_total_pendente
    FROM fin_titulos
    WHERE tipo = p_tipo
      AND status NOT IN ('PAGO', 'CANCELADO')
      AND (p_origem_tipo IS NULL OR origem_tipo = p_origem_tipo)
      AND (p_exclude_origem_tipo IS NULL OR origem_tipo <> p_exclude_origem_tipo);

    -- Recebido/Pago Hoje (Apenas transações do dia)
    SELECT COALESCE(SUM(t.valor), 0)
    INTO v_total_recebido_hoje
    FROM fin_transacoes t
    JOIN fin_titulos tit ON t.titulo_id = tit.id
    WHERE tit.tipo = p_tipo
      AND t.data_pagamento::date = CURRENT_DATE
      AND (p_origem_tipo IS NULL OR tit.origem_tipo = p_origem_tipo)
      AND (p_exclude_origem_tipo IS NULL OR tit.origem_tipo <> p_exclude_origem_tipo);

    -- Total em Atraso (Soma do saldo aberto dos títulos com status ATRASADO)
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
    -- Total a Receber Global
    SELECT COALESCE(SUM(valor_total + COALESCE(valor_acrescimo, 0) - valor_pago - COALESCE(valor_desconto, 0)), 0)
    INTO v_total_receber
    FROM fin_titulos
    WHERE tipo = 'RECEBER'
      AND status NOT IN ('PAGO', 'CANCELADO');

    -- Total a Pagar Global
    SELECT COALESCE(SUM(valor_total + COALESCE(valor_acrescimo, 0) - valor_pago - COALESCE(valor_desconto, 0)), 0)
    INTO v_total_pagar
    FROM fin_titulos
    WHERE tipo = 'PAGAR'
      AND status NOT IN ('PAGO', 'CANCELADO');

    -- Disponibilidade (Saldo Atual das Contas)
    SELECT COALESCE(SUM(saldo_atual), 0)
    INTO v_saldo_atual
    FROM contas_bancarias_saldos;

    RETURN json_build_object(
        'total_receber', v_total_receber,
        'total_pagar', v_total_pagar,
        'saldo_atual', v_saldo_atual
    );
END;
$function$;

-- NOTA: Se o get_caixa_metrics for uma função que herda ou repete esta lógica,
-- ele também deve ser atualizado para não subtrair pagamentos do período do saldo total global.
