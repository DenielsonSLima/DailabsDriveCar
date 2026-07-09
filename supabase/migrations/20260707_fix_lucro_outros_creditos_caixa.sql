-- Migration: Contabilização de Outros Créditos no Lucro Líquido do Caixa/DRE (Regime de Caixa)
-- Date: 2026-07-07
-- Objetivo: Garantir que recebimentos de "Outros Créditos" sejam contabilizados no Lucro Mensal,
-- considerando o regime de caixa (data do recebimento físico e valor efetivo da parcela/transação).

CREATE OR REPLACE FUNCTION public.get_caixa_metrics(p_data_inicio date, p_data_fim date)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
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
          WHERE vp.veiculo_id = ev.id 
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
    WHERE tit.organization_id = v_org_id AND tit.tipo = 'PAGAR' AND tit.origem_tipo IN ('DESPESA_VARIAVEL', 'DESPESA_VEICULO', 'VARIAVEL')
      AND tit.status != 'CANCELADO'
      AND t.tipo_transacao NOT IN ('ESTORNO', 'DESCONTO_TITULO', 'ACRESCIMO_TITULO')
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

    SELECT COALESCE(SUM(v.valor_venda), 0), COALESCE(SUM(COALESCE(c.valor_custo, 0) + COALESCE(c.valor_custo_servicos, 0)), 0)
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
        'lucro_mensal', (v_total_vendas_recebido - v_total_custo_vendas + v_lucro_adicionais + v_total_outros_creditos + v_total_descontos_obtidos) - (v_total_despesas_fixas + v_total_despesas_variaveis + v_total_outros_debitos + v_total_descontos_concedidos),
        'lucro_gerado', (v_total_vendas_recebido - v_total_custo_vendas + v_lucro_adicionais + v_total_outros_creditos + v_total_descontos_obtidos) - (v_total_despesas_fixas + v_total_despesas_variaveis + v_total_outros_debitos + v_total_descontos_concedidos),
        'lucro_realizado', v_total_entradas - v_total_saidas,
        'lucro_pendente', v_total_recebiveis,
        -- Margem de lucro também considera outros créditos
        'margem_lucro', CASE WHEN (v_total_vendas_recebido + v_lucro_adicionais + v_total_outros_creditos) > 0 THEN (((v_total_vendas_recebido - v_total_custo_vendas + v_lucro_adicionais + v_total_outros_creditos + v_total_descontos_obtidos) - (v_total_despesas_fixas + v_total_despesas_variaveis + v_total_outros_debitos + v_total_descontos_concedidos)) / (v_total_vendas_recebido + v_lucro_adicionais + v_total_outros_creditos)) * 100 ELSE 0 END
    );
END;
$function$;
