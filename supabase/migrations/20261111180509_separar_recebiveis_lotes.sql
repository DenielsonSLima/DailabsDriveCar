-- A lista Contas a Receber e seus KPIs não incluem contas administradas em Lotes.
-- Mantém a fórmula, estados, empresa e permissões da RPC existente.
-- Não altera títulos, pagamentos, transações, saldos nem o histórico dos lotes.
CREATE OR REPLACE FUNCTION public.rpc_kpi_contas_receber()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_org_id uuid := public.get_my_org_id();
    v_valor_total DECIMAL(15,2);
    v_total_recebido DECIMAL(15,2);
    v_total_em_aberto DECIMAL(15,2);
BEGIN
    SELECT
        COALESCE(SUM(valor_total), 0),
        COALESCE(SUM(valor_pago), 0),
        COALESCE(SUM(valor_total - COALESCE(valor_pago, 0) - COALESCE(valor_desconto, 0)), 0)
    INTO
        v_valor_total,
        v_total_recebido,
        v_total_em_aberto
    FROM public.fin_titulos
    WHERE organization_id = v_org_id
      AND tipo = 'RECEBER'
      AND lote_id IS NULL
      AND status IN ('PENDENTE', 'ABERTO', 'PARCIAL', 'ATRASADO')
      AND (origem_tipo IS NULL OR origem_tipo != 'OUTRO_CREDITO');

    RETURN json_build_object(
        'valor_total', v_valor_total,
        'total_recebido', v_total_recebido,
        'total_em_aberto', v_total_em_aberto
    );
END;
$function$;
