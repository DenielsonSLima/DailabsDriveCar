-- 1. Insert 'Consignação' in cad_formas_pagamento if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.cad_formas_pagamento WHERE nome = 'Consignação') THEN
        INSERT INTO public.cad_formas_pagamento (nome, ativo, tipo) VALUES ('Consignação', true, 'AMBOS');
    END IF;
END $$;

-- 2. Insert 'Consignação' in cad_condicoes_pagamento if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.cad_condicoes_pagamento WHERE nome = 'Consignação') THEN
        INSERT INTO public.cad_condicoes_pagamento (nome, quantidade_parcelas, intervalo_padrao, ativo) VALUES ('Consignação', 1, 0, true);
    END IF;
END $$;

-- 3. Adicionar flag de Consignação nos Pedidos de Venda
ALTER TABLE public.venda_pedidos ADD COLUMN IF NOT EXISTS is_consignado BOOLEAN DEFAULT FALSE;

-- 4. Re-criar a function de confirmar_venda_pedido com suporte à Consignação
CREATE OR REPLACE FUNCTION public.confirmar_venda_pedido(p_pedido_id UUID)
RETURNS VOID AS $func$
DECLARE
    v_veiculo_id UUID;
    v_valor_venda NUMERIC;
    v_soma_pagamentos NUMERIC;
    v_cliente_id UUID;
    v_user_id UUID;
    v_is_consignado BOOLEAN;
    v_pagamento RECORD;
BEGIN
    -- 1. Obter dados do pedido
    SELECT veiculo_id, valor_venda, cliente_id, user_id, is_consignado
    INTO v_veiculo_id, v_valor_venda, v_cliente_id, v_user_id, v_is_consignado
    FROM public.venda_pedidos 
    WHERE id = p_pedido_id;

    IF v_veiculo_id IS NULL THEN
        RAISE EXCEPTION 'Pedido não encontrado ou não possui um veículo vinculado.';
    END IF;

    -- 2. Obter a soma dos pagamentos (Se consignado, bate com a comissão; se não, bate com v_valor_venda)
    SELECT COALESCE(SUM(valor), 0) INTO v_soma_pagamentos
    FROM public.venda_pedidos_pagamentos
    WHERE pedido_id = p_pedido_id;

    -- 3. Validar valores
    IF COALESCE(v_is_consignado, FALSE) = FALSE THEN
        -- REGRA PADRÃO DA LOJA: A soma dos pagamentos tem que bater com o total da Venda
        IF ABS(v_soma_pagamentos - v_valor_venda) > 0.01 THEN
            RAISE EXCEPTION 'A soma dos pagamentos (%) não coincide com o valor da venda (%).', 
                v_soma_pagamentos, v_valor_venda;
        END IF;
    ELSE
        -- REGRA DE CONSIGNAÇÃO: A soma dos pagamentos é apenas a comissão da loja
        -- (No Frontend já garantimos que o usuário digitou apenas a comissão que ele quer receber)
        IF v_soma_pagamentos <= 0 THEN
             RAISE EXCEPTION 'Em vendas consignadas, registre o valor do seu Lucro/Comissão no pagamento.';
        END IF;
    END IF;

    -- 4. Gerar Títulos Financeiros
    -- Se for consignação, a tabela venda_pedidos_pagamentos só terá o valor da comissão.
    FOR v_pagamento IN 
        SELECT * FROM public.venda_pedidos_pagamentos WHERE pedido_id = p_pedido_id
    LOOP
        INSERT INTO public.fin_titulos (
            user_id,
            parceiro_id,
            pedido_id,
            descricao,
            tipo,
            status,
            valor_total,
            valor_pago,
            data_emissao,
            data_vencimento,
            forma_pagamento_id,
            origem_tipo,
            origem_id
        ) VALUES (
            v_user_id,
            v_cliente_id,
            p_pedido_id,
            CASE 
                WHEN COALESCE(v_is_consignado, FALSE) = TRUE THEN 'Comissão de Consignação - Pedido #' || p_pedido_id
                ELSE 'Recebimento de Venda - Pedido #' || p_pedido_id
            END,
            'RECEBER',
            'PENDENTE',
            v_pagamento.valor,
            0,
            CURRENT_DATE,
            v_pagamento.data_recebimento,
            v_pagamento.forma_pagamento_id,
            'PEDIDO_VENDA',
            p_pedido_id
        );
    END LOOP;

    -- 5. Atualizar o status do pedido para CONCLUIDO
    UPDATE public.venda_pedidos 
    SET status = 'CONCLUIDO',
        updated_at = NOW()
    WHERE id = p_pedido_id;

    -- 6. Atualizar o status do veículo para VENDIDO
    UPDATE public.est_veiculos 
    SET status = 'VENDIDO',
        updated_at = NOW()
    WHERE id = v_veiculo_id;

END;
$func$ LANGUAGE plpgsql SECURITY DEFINER;
