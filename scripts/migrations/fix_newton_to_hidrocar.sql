-- ==============================================================================
-- CORREÇÃO: vincular Newton à empresa Hydrocar (tenant)
-- Execute este script NO SQL EDITOR do Supabase APÓS rodar o check anterior.
-- ============================================================================== 

DO $$
DECLARE
  v_newton_id UUID;
  v_newton_org_id UUID;
  v_hidrocar_org_id UUID;
BEGIN
  -- 1) Resolve o usuário Newton por nome ou e-mail contendo "newton"
  SELECT p.id
  INTO v_newton_id
  FROM profiles p
  WHERE
    lower(p.nome || ' ' || p.sobrenome) LIKE '%newton%'
    OR lower(coalesce(p.email, '')) LIKE '%newton%'
  LIMIT 1;

  IF v_newton_id IS NULL THEN
    RAISE EXCEPTION 'Não foi encontrado perfil de Newton para corrigir (busca por nome/email com "newton").';
  END IF;

  -- 2) Resolve a organização Hydrocar por nome/razão social
  SELECT ce.organization_id
  INTO v_hidrocar_org_id
  FROM config_empresa ce
  WHERE
    lower(coalesce(ce.nome_fantasia, '')) LIKE '%hidrocar%'
    OR lower(coalesce(ce.razao_social, '')) LIKE '%hidrocar%'
  LIMIT 1;

  IF v_hidrocar_org_id IS NULL THEN
    RAISE EXCEPTION 'Não foi encontrada organização Hydrocar em config_empresa.';
  END IF;

  -- 3) Guarda org atual para comparação
  SELECT p.organization_id
  INTO v_newton_org_id
  FROM profiles p
  WHERE p.id = v_newton_id;

  -- 4) Corrige o vínculo no perfil (fonte principal do ERP)
  UPDATE profiles
  SET organization_id = v_hidrocar_org_id
  WHERE id = v_newton_id;

  -- 5) Corrige organização no auth metadata (evita fallback indevido no login)
  UPDATE auth.users
  SET raw_app_meta_data = jsonb_set(
    coalesce(raw_app_meta_data, '{}'::jsonb),
    '{organization_id}',
    to_jsonb(v_hidrocar_org_id::text),
    true
  )
  WHERE id = v_newton_id;

  -- 6) Corrige também o vínculo em organization_members (se existir)
  UPDATE organization_members
  SET organization_id = v_hidrocar_org_id
  WHERE user_id = v_newton_id;

  RAISE NOTICE 'Newton (%), org anterior: %, nova org: %',
    v_newton_id,
    v_newton_org_id,
    v_hidrocar_org_id;
END $$;
