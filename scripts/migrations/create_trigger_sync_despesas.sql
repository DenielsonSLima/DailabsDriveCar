
-- Função para sincronizar o valor total de despesas no cadastro do veículo
CREATE OR REPLACE FUNCTION public.fn_sync_veiculo_despesas()
RETURNS TRIGGER AS $$
DECLARE
    v_veiculo_id UUID;
    v_total_despesas NUMERIC;
BEGIN
    -- Determina o ID do veículo afetado
    IF (TG_OP = 'DELETE') THEN
        v_veiculo_id := OLD.veiculo_id;
    ELSE
        v_veiculo_id := NEW.veiculo_id;
    END IF;

    -- Calcula o novo total de despesas para este veículo
    SELECT COALESCE(SUM(valor_total), 0)
    INTO v_total_despesas
    FROM public.est_veiculos_despesas
    WHERE veiculo_id = v_veiculo_id;

    -- Atualiza a tabela de veículos
    UPDATE public.est_veiculos
    SET valor_custo_servicos = v_total_despesas,
        updated_at = NOW()
    WHERE id = v_veiculo_id;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para Insert, Update e Delete
DROP TRIGGER IF EXISTS tr_sync_veiculo_despesas ON public.est_veiculos_despesas;
CREATE TRIGGER tr_sync_veiculo_despesas
AFTER INSERT OR UPDATE OR DELETE ON public.est_veiculos_despesas
FOR EACH ROW EXECUTE FUNCTION public.fn_sync_veiculo_despesas();

-- Inicialização: Sincronizar dados existentes
UPDATE public.est_veiculos v
SET valor_custo_servicos = (
    SELECT COALESCE(SUM(valor_total), 0)
    FROM public.est_veiculos_despesas d
    WHERE d.veiculo_id = v.id
);
