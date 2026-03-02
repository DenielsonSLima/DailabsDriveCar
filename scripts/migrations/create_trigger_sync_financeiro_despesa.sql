
-- 1. Nova Função de Gatilho para Sincronização Automática com o Financeiro
CREATE OR REPLACE FUNCTION public.fn_sync_despesa_financeiro()
RETURNS TRIGGER AS $$
DECLARE
    v_titulo_id UUID;
BEGIN
    -- Obter o ID do título se já existir
    SELECT id INTO v_titulo_id 
    FROM public.fin_titulos 
    WHERE origem_tipo = 'DESPESA_VEICULO' AND origem_id = COALESCE(NEW.id, OLD.id);

    IF (TG_OP = 'DELETE') THEN
        -- Se deletar a despesa, deleta o título se estiver pendente
        DELETE FROM public.fin_titulos 
        WHERE id = v_titulo_id AND status = 'PENDENTE';
        RETURN OLD;
    ELSIF (TG_OP = 'INSERT') THEN
        -- Cria novo título se não existir
        IF v_titulo_id IS NULL THEN
            INSERT INTO public.fin_titulos (
                user_id,
                organization_id,
                parceiro_id, -- Pode ser nulo para despesas gerais
                veiculo_id,
                despesa_veiculo_id,
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
                NEW.user_id,
                NEW.organization_id,
                NULL,
                NEW.veiculo_id,
                NEW.id,
                'DESPESA VEÍCULO (' || NEW.descricao || ')',
                'PAGAR',
                'PENDENTE',
                NEW.valor_total,
                0,
                CURRENT_DATE,
                COALESCE(NEW.data_vencimento, CURRENT_DATE),
                NEW.forma_pagamento_id,
                'DESPESA_VEICULO',
                NEW.id
            );
        END IF;
        RETURN NEW;
    ELSIF (TG_OP = 'UPDATE') THEN
        -- Sincroniza dados básicos se o título existir e estiver pendente
        IF v_titulo_id IS NOT NULL THEN
            UPDATE public.fin_titulos SET
                valor_total = NEW.valor_total,
                descricao = 'DESPESA VEÍCULO (' || NEW.descricao || ')',
                data_vencimento = COALESCE(NEW.data_vencimento, CURRENT_DATE),
                forma_pagamento_id = NEW.forma_pagamento_id,
                updated_at = NOW()
            WHERE id = v_titulo_id AND status = 'PENDENTE';
        END IF;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Ativar o Gatilho
DROP TRIGGER IF EXISTS tr_sync_despesa_financeiro ON public.est_veiculos_despesas;
CREATE TRIGGER tr_sync_despesa_financeiro
AFTER INSERT OR UPDATE OR DELETE ON public.est_veiculos_despesas
FOR EACH ROW EXECUTE FUNCTION public.fn_sync_despesa_financeiro();

-- 3. Simplificar o RPC salvar_despesa_veiculo (Remover lógica agora redundante)
CREATE OR REPLACE FUNCTION public.salvar_despesa_veiculo(
    p_id uuid, p_veiculo_id uuid, p_tipo text, p_categoria_id uuid, 
    p_descricao text, p_quantidade integer, p_valor_unitario numeric, 
    p_valor_total numeric, p_forma_pagamento_id uuid DEFAULT NULL::uuid, 
    p_conta_bancaria_id uuid DEFAULT NULL::uuid, 
    p_data_vencimento timestamp with time zone DEFAULT NULL::timestamp with time zone, 
    p_status_pagamento text DEFAULT 'PENDENTE'::text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_despesa_id UUID;
    v_result JSONB;
BEGIN
    -- 1. Upsert the expense (Os triggers cuidam do custo do veículo e do financeiro!)
    INSERT INTO public.est_veiculos_despesas (
        id, veiculo_id, tipo, categoria_id, descricao, 
        quantidade, valor_unitario, valor_total, 
        forma_pagamento_id, conta_bancaria_id, data_vencimento, status_pagamento,
        data
    ) VALUES (
        COALESCE(p_id, gen_random_uuid()), p_veiculo_id, p_tipo, p_categoria_id, p_descricao,
        p_quantidade, p_valor_unitario, p_valor_total,
        p_forma_pagamento_id, p_conta_bancaria_id, p_data_vencimento, p_status_pagamento,
        now()
    )
    ON CONFLICT (id) DO UPDATE SET
        tipo = EXCLUDED.tipo,
        categoria_id = EXCLUDED.categoria_id,
        descricao = EXCLUDED.descricao,
        quantidade = EXCLUDED.quantidade,
        valor_unitario = EXCLUDED.valor_unitario,
        valor_total = EXCLUDED.valor_total,
        forma_pagamento_id = EXCLUDED.forma_pagamento_id,
        conta_bancaria_id = EXCLUDED.conta_bancaria_id,
        data_vencimento = EXCLUDED.data_vencimento,
        status_pagamento = EXCLUDED.status_pagamento,
        updated_at = now()
    RETURNING id INTO v_despesa_id;

    -- 2. Pagamento imediato (Se necessário)
    IF p_status_pagamento = 'PAGO' AND p_conta_bancaria_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM public.est_veiculos_despesas_pagamentos WHERE despesa_id = v_despesa_id) THEN
            PERFORM public.registrar_pagamento_despesa(
                v_despesa_id, 
                p_conta_bancaria_id, 
                p_forma_pagamento_id, 
                p_valor_total,
                now(),
                'Baixa automática via salvamento individual'
            );
        END IF;
    END IF;

    -- Retorna o registro salvo
    SELECT to_jsonb(d) INTO v_result FROM public.est_veiculos_despesas d WHERE id = v_despesa_id;
    RETURN v_result;
END;
$$;
