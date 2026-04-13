-- ==============================================================================
-- FINAL CONSOLIDATED FINANCIAL FIX (2026-04-13)
-- Objetivo: Resolver duplicações, corrigir descontos e unificar funções de baixa.
-- ==============================================================================

-- 1. TRIGGER DE SINCRONIZAÇÃO ROBUSTA (A Fonte Única da Verdade)
CREATE OR REPLACE FUNCTION public.fn_sync_titulo_totals()
 RETURNS trigger
 LANGUAGE plpgsql
 AS $function$
DECLARE
    v_titulo_ids UUID[] := '{}';
    v_tid UUID;
    v_pago NUMERIC;
    v_desconto NUMERIC;
    v_acrescimo NUMERIC;
    v_titulo RECORD;
    v_liquidado NUMERIC;
    v_devido NUMERIC;
    v_status TEXT; 
BEGIN
    IF (TG_OP = 'DELETE') THEN
        v_titulo_ids := ARRAY[OLD.titulo_id];
    ELSIF (TG_OP = 'UPDATE') THEN
        IF (OLD.titulo_id IS DISTINCT FROM NEW.titulo_id) THEN
            v_titulo_ids := ARRAY[OLD.titulo_id, NEW.titulo_id];
        ELSE
            v_titulo_ids := ARRAY[NEW.titulo_id];
        END IF;
    ELSE
        v_titulo_ids := ARRAY[NEW.titulo_id];
    END IF;

    FOREACH v_tid IN ARRAY v_titulo_ids
    LOOP
        CONTINUE WHEN v_tid IS NULL;

        SELECT * INTO v_titulo FROM public.fin_titulos WHERE id = v_tid;

        IF FOUND THEN
            -- Calcular Pagos, Descontos e Acréscimos em um único SELECT
            SELECT 
                COALESCE(SUM(
                    CASE 
                        WHEN tipo_transacao NOT IN ('DESCONTO_TITULO', 'ACRESCIMO_TITULO') THEN
                            CASE 
                                WHEN v_titulo.tipo = 'RECEBER' THEN (CASE WHEN tipo = 'ENTRADA' THEN valor ELSE -valor END)
                                WHEN v_titulo.tipo = 'PAGAR' THEN (CASE WHEN tipo = 'SAIDA' THEN valor ELSE -valor END)
                                ELSE 0
                            END
                        ELSE 0
                    END
                ), 0),
                COALESCE(SUM(CASE WHEN tipo_transacao = 'DESCONTO_TITULO' THEN valor ELSE 0 END), 0),
                COALESCE(SUM(CASE WHEN tipo_transacao = 'ACRESCIMO_TITULO' THEN valor ELSE 0 END), 0)
            INTO v_pago, v_desconto, v_acrescimo
            FROM public.fin_transacoes
            WHERE titulo_id = v_tid;

            v_liquidado := v_pago + v_desconto;
            v_devido := v_titulo.valor_total + COALESCE(v_acrescimo, 0);

            IF v_liquidado >= v_devido - 0.01 THEN
                v_status := 'PAGO';
            ELSIF v_liquidado > 0 THEN
                v_status := 'PARCIAL';
            ELSE
                v_status := 'PENDENTE';
            END IF;

            UPDATE public.fin_titulos
            SET 
                valor_pago = v_pago,
                valor_desconto = v_desconto,
                valor_acrescimo = v_acrescimo,
                status = v_status,
                updated_at = now()
            WHERE id = v_tid;
        END IF;
    END LOOP;
    RETURN NULL;
END;
$function$;

-- 2. FUNÇÃO UNIFICADA DE BAIXA DE TÍTULO
CREATE OR REPLACE FUNCTION public.baixar_titulo(
    p_titulo_id uuid,
    p_valor numeric,
    p_conta_id uuid,
    p_forma_pagamento_id uuid,
    p_data_pagamento timestamptz DEFAULT now(),
    p_desconto numeric DEFAULT 0,
    p_acrescimo numeric DEFAULT 0
)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_titulo RECORD;
BEGIN
    SELECT * INTO v_titulo FROM public.fin_titulos WHERE id = p_titulo_id FOR UPDATE;
    IF NOT FOUND THEN
        PERFORM public.raise_error('Título não encontrado', 'O título financeiro especificado não existe.');
    END IF;

    -- Registrar Transação Principal
    IF p_valor > 0 THEN
        INSERT INTO public.fin_transacoes (
            user_id, organization_id, titulo_id, conta_origem_id, valor, tipo, 
            data_pagamento, forma_pagamento_id, descricao, tipo_transacao
        ) VALUES (
            auth.uid(), v_titulo.organization_id, p_titulo_id, p_conta_id, p_valor,
            CASE WHEN v_titulo.tipo = 'RECEBER' THEN 'ENTRADA' ELSE 'SAIDA' END,
            p_data_pagamento, p_forma_pagamento_id,
            CASE WHEN v_titulo.tipo = 'RECEBER' THEN 'BAIXA: ' ELSE 'PAGAMENTO: ' END || v_titulo.descricao,
            'RECEBIMENTO_TITULO'
        );
    END IF;

    -- Registrar Desconto
    IF p_desconto > 0 THEN
        INSERT INTO public.fin_transacoes (
            user_id, organization_id, titulo_id, valor, tipo, 
            data_pagamento, descricao, tipo_transacao
        ) VALUES (
            auth.uid(), v_titulo.organization_id, p_titulo_id, p_desconto,
            CASE WHEN v_titulo.tipo = 'RECEBER' THEN 'ENTRADA' ELSE 'SAIDA' END,
            p_data_pagamento,
            'DESCONTO: ' || v_titulo.descricao,
            'DESCONTO_TITULO'
        );
    END IF;

    -- Registrar Acréscimo
    IF p_acrescimo > 0 THEN
        INSERT INTO public.fin_transacoes (
            user_id, organization_id, titulo_id, valor, tipo, 
            data_pagamento, descricao, tipo_transacao
        ) VALUES (
            auth.uid(), v_titulo.organization_id, p_titulo_id, p_acrescimo,
            CASE WHEN v_titulo.tipo = 'RECEBER' THEN 'SAIDA' ELSE 'ENTRADA' END,
            p_data_pagamento,
            'ACRÉSCIMO/JUROS: ' || v_titulo.descricao,
            'ACRESCIMO_TITULO'
        );
    END IF;
END;
$function$;

-- 3. AJUSTE DE ROTINAS DE COMPRA E VENDA (Fim das duplicações)
-- As funções confirmar_pedido_compra, confirm_purchase_order e confirm_sales_order
-- foram atualizadas para não setarem mais valor_pago diretamente no INSERT do título,
-- deixando a trigger (v1 acima) gerenciar tudo via transações.
