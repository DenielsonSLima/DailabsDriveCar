-- ==============================================================================
-- ROLLBACK: desfaz a correção do Newton, se necessário.
-- Ajuste os valores de UUID abaixo conforme o estado anterior registrado antes do fix.
-- ==============================================================================

-- ATENÇÃO:
-- 1) Preencha v_prev_organization_id com o organization_id anterior (ou null para remover).
-- 2) Preencha v_newton_user_id com o id de perfil do Newton.
-- 3) Rode no SQL Editor.

DO $$
DECLARE
  v_newton_user_id UUID := '00000000-0000-0000-0000-000000000000';
  v_prev_organization_id UUID := NULL;
BEGIN
  IF v_newton_user_id = '00000000-0000-0000-0000-000000000000' THEN
    RAISE EXCEPTION 'Preencha v_newton_user_id antes de executar o rollback.';
  END IF;

  UPDATE profiles
  SET organization_id = v_prev_organization_id
  WHERE id = v_newton_user_id;

  UPDATE auth.users
  SET raw_app_meta_data = jsonb_set(
    coalesce(raw_app_meta_data, '{}'::jsonb),
    '{organization_id}',
    to_jsonb(v_prev_organization_id::text),
    true
  )
  WHERE id = v_newton_user_id;

  UPDATE organization_members
  SET organization_id = COALESCE(v_prev_organization_id, organization_id)
  WHERE user_id = v_newton_user_id
    AND COALESCE(v_prev_organization_id, organization_id) IS NOT NULL;

  RAISE NOTICE 'Rollback de organization_id do usuário % para % concluído.', v_newton_user_id, v_prev_organization_id;
END $$;
