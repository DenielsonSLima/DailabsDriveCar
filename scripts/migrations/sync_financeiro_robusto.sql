-- ============================================================
-- 🚀 SINCRONIZAÇÃO ROBUSTA: TRANSAÇÕES -> TÍTULOS
-- ============================================================
-- Garante que o valor_pago e o status do título estejam sempre
-- em sincronia absoluta com a soma das transações reais no extrato.
-- Elimina discrepâncias causadas por deleções ou edições manuais.

-- 1. Função de Recálculo Atômico
CREATE OR REPLACE FUNCTION public.fn_sync_valor_pago_titulo()
RETURNS TRIGGER AS $$
DECLARE
    v_titulo_id UUID;
    v_total_pago NUMERIC;
    v_valor_total NUMERIC;
    v_status_atualizado public.fin_titulo_status;
BEGIN
    -- Identifica o título afetado (Funciona para INSERT, UPDATE e DELETE)
    v_titulo_id := COALESCE(NEW.titulo_id, OLD.titulo_id);
    
    IF v_titulo_id IS NULL THEN
        RETURN NULL;
    END IF;

    -- Soma todas as transações vinculadas a este título no extrato real
    SELECT COALESCE(SUM(valor), 0)
    INTO v_total_pago
    FROM public.fin_transacoes
    WHERE titulo_id = v_titulo_id;

    -- Busca o valor total planejado do título para definir o status de quitação
    SELECT valor_total INTO v_valor_total
    FROM public.fin_titulos
    WHERE id = v_titulo_id;

    -- Se o título não existe mais (ex: foi deletado em cascata), sai
    IF v_valor_total IS NULL THEN
        RETURN NULL;
    END IF;

    -- Define o novo status baseado no progresso do pagamento
    IF v_total_pago >= v_valor_total THEN
        v_status_atualizado := 'PAGO';
    ELSIF v_total_pago > 0 THEN
        v_status_atualizado := 'PARCIAL';
    ELSE
        v_status_atualizado := 'PENDENTE';
    END IF;

    -- Atualiza o título com os valores consolidados
    UPDATE public.fin_titulos
    SET 
        valor_pago = v_total_pago,
        status = v_status_atualizado,
        updated_at = NOW()
    WHERE id = v_titulo_id;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Criação do Trigger de Sincronização
-- Executa após qualquer mudança no extrato (fin_transacoes)
DROP TRIGGER IF EXISTS tr_sync_valor_pago_titulo ON public.fin_transacoes;
CREATE TRIGGER tr_sync_valor_pago_titulo
AFTER INSERT OR UPDATE OR DELETE ON public.fin_transacoes
FOR EACH ROW EXECUTE FUNCTION public.fn_sync_valor_pago_titulo();

-- 3. Correção Retroativa (Fix Global)
-- Aplica a lógica a todos os títulos existentes para limpar inconsistências passadas
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT id FROM public.fin_titulos) LOOP
        -- O trigger não dispara em updates em massa de tabelas diferentes, 
        -- então forçamos o recálculo chamando a lógica para cada título.
        UPDATE public.fin_titulos t
        SET 
            valor_pago = (SELECT COALESCE(SUM(valor), 0) FROM public.fin_transacoes tr WHERE tr.titulo_id = t.id),
            status = CASE 
                WHEN (SELECT COALESCE(SUM(valor), 0) FROM public.fin_transacoes tr WHERE tr.titulo_id = t.id) >= t.valor_total THEN 'PAGO'::public.fin_titulo_status
                WHEN (SELECT COALESCE(SUM(valor), 0) FROM public.fin_transacoes tr WHERE tr.titulo_id = t.id) > 0 THEN 'PARCIAL'::public.fin_titulo_status
                ELSE 'PENDENTE'::public.fin_titulo_status
            END,
            updated_at = NOW()
        WHERE id = r.id;
    END LOOP;
END;
$$;

-- Log de Auditoria
COMMENT ON TRIGGER tr_sync_valor_pago_titulo ON public.fin_transacoes IS 'Garante integridade entre extrato e títulos (Nexus ERP Sync)';
