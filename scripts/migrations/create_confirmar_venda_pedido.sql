
-- Função para confirmar a venda, baixar o estoque e gerar o financeiro
CREATE OR REPLACE FUNCTION public.confirmar_venda_pedido(p_pedido_id UUID)
RETURNS VOID AS $$
DECLARE
    v_veiculo_id UUID;
    v_valor_venda NUMERIC;
    v_soma_pagamentos NUMERIC;
    v_cliente_id UUID;
    v_user_id UUID;
    v_pagamento RECORD;
BEGIN
    -- 1. Obter dados do pedido
    SELECT veiculo_id, valor_venda, cliente_id, user_id 
    INTO v_veiculo_id, v_valor_venda, v_cliente_id, v_user_id
    FROM public.venda_pedidos 
    WHERE id = p_pedido_id;

    IF v_veiculo_id IS NULL THEN
        RAISE EXCEPTION 'Pedido não encontrado ou não possui um veículo vinculado.';
    END IF;

    -- 2. Validar se a soma dos pagamentos bate com o valor da venda
    SELECT COALESCE(SUM(valor), 0) INTO v_soma_pagamentos
    FROM public.venda_pedidos_pagamentos
    WHERE pedido_id = p_pedido_id;

    IF ABS(v_soma_pagamentos - v_valor_venda) > 0.01 THEN
        RAISE EXCEPTION 'A soma dos pagamentos (%) não coincide com o valor da venda (%).', 
            v_soma_pagamentos, v_valor_venda;
    END IF;

    -- 3. Gerar Títulos Financeiros (fin_titulos)
    -- Cada registro em venda_pedidos_pagamentos gera um título a receber
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
            'Recebimento de Venda - Pedido #' || p_pedido_id,
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

    -- 4. Atualizar o status do pedido para CONCLUIDO
    UPDATE public.venda_pedidos 
    SET status = 'CONCLUIDO',
        updated_at = NOW()
    WHERE id = p_pedido_id;

    -- 5. Atualizar o status do veículo para VENDIDO
    UPDATE public.est_veiculos 
    SET status = 'VENDIDO',
        updated_at = NOW()
    WHERE id = v_veiculo_id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
