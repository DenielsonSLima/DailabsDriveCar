-- =============================================
-- MIGRAÇÃO: Submódulo "Outros Débitos"
-- Data: 2026-04-29
-- Descrição: Cria as RPCs lancar_debito e rpc_kpi_outros_debitos
--            Adiciona 'OUTRO_DEBITO' ao enum origem_tipo de fin_titulos
-- =============================================

-- 1. Adicionar o valor 'OUTRO_DEBITO' na constraint/check do campo origem_tipo (se aplicável)
-- Como o campo origem_tipo é TEXT (não enum postgres), basta usar no código.
-- Verificação: o Zod no frontend já será atualizado.

-- 2. Criar a RPC lancar_debito (simétrica a lancar_credito)
CREATE OR REPLACE FUNCTION public.lancar_debito(
  p_descricao TEXT,
  p_valor NUMERIC,
  p_data_vencimento DATE,
  p_conta_id UUID DEFAULT NULL,
  p_documento_ref TEXT DEFAULT NULL,
  p_socios JSONB DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_org_id UUID;
  v_titulo_id UUID;
  v_user_id UUID;
  v_result JSON;
BEGIN
  -- Capturar organization_id e user_id do contexto de auth
  v_org_id := (auth.jwt() -> 'app_metadata' ->> 'organization_id')::UUID;
  v_user_id := auth.uid();

  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'organization_id não encontrado no JWT';
  END IF;

  -- Criar o título como PAGAR (débito) com origem OUTRO_DEBITO
  INSERT INTO fin_titulos (
    organization_id,
    user_id,
    descricao,
    tipo,
    status,
    valor_total,
    valor_pago,
    valor_liquidado,
    valor_pendente,
    data_emissao,
    data_vencimento,
    parcela_numero,
    parcela_total,
    documento_ref,
    origem_tipo,
    socios
  ) VALUES (
    v_org_id,
    v_user_id,
    p_descricao,
    'PAGAR',
    'PENDENTE',
    p_valor,
    0,
    0,
    p_valor,
    CURRENT_DATE,
    p_data_vencimento,
    1,
    1,
    p_documento_ref,
    'OUTRO_DEBITO',
    p_socios
  )
  RETURNING id INTO v_titulo_id;

  -- Retornar o ID do título criado
  v_result := json_build_object('id', v_titulo_id);
  RETURN v_result;
END;
$$;

-- 3. Criar a RPC de KPIs para Outros Débitos
CREATE OR REPLACE FUNCTION public.rpc_kpi_outros_debitos()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_org_id UUID;
  v_total_debitado NUMERIC;
  v_total_pendente NUMERIC;
  v_total_atrasado NUMERIC;
BEGIN
  v_org_id := (auth.jwt() -> 'app_metadata' ->> 'organization_id')::UUID;

  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'organization_id não encontrado no JWT';
  END IF;

  -- Total de todos os débitos extraordinários (pagos)
  SELECT COALESCE(SUM(valor_liquidado), 0)
  INTO v_total_debitado
  FROM fin_titulos
  WHERE organization_id = v_org_id
    AND tipo = 'PAGAR'
    AND origem_tipo = 'OUTRO_DEBITO';

  -- Total pendente (em aberto)
  SELECT COALESCE(SUM(valor_pendente), 0)
  INTO v_total_pendente
  FROM fin_titulos
  WHERE organization_id = v_org_id
    AND tipo = 'PAGAR'
    AND origem_tipo = 'OUTRO_DEBITO'
    AND status != 'PAGO';

  -- Total em atraso
  SELECT COALESCE(SUM(valor_pendente), 0)
  INTO v_total_atrasado
  FROM fin_titulos
  WHERE organization_id = v_org_id
    AND tipo = 'PAGAR'
    AND origem_tipo = 'OUTRO_DEBITO'
    AND status != 'PAGO'
    AND data_vencimento < CURRENT_DATE;

  RETURN json_build_object(
    'total_debitado', v_total_debitado,
    'total_pendente', v_total_pendente,
    'total_atrasado', v_total_atrasado
  );
END;
$$;

-- Conceder acesso às funções para o role authenticated
GRANT EXECUTE ON FUNCTION public.lancar_debito TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_kpi_outros_debitos TO authenticated;
