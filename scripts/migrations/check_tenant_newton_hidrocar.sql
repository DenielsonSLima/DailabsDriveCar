-- ==============================================================================
-- AUDITORIA: organizações e usuário Newton
-- Objetivo: identificar se a empresa/logo do usuário Newton está vindo de outro
-- tenant antes de fazer qualquer alteração.
-- Execute este script no SQL Editor do Supabase antes de rodar o fix.
-- ==============================================================================

-- 1) Empresas que batem com Hydra/car ou variações no nome
SELECT
  'EMPRESAS_MATCH_HIDROCAR' AS tipo,
  id,
  organization_id,
  nome_fantasia,
  razao_social,
  logo_url
FROM config_empresa
WHERE
  lower(coalesce(nome_fantasia, '')) LIKE '%hidrocar%'
  OR lower(coalesce(razao_social, '')) LIKE '%hidrocar%';

-- 2) Usuário Newton e organização atual registrada no perfil/auth/app_metadata
SELECT
  'NEWTON_PERFIL' AS tipo,
  p.id AS profile_id,
  p.email,
  p.nome,
  p.sobrenome,
  p.organization_id AS profile_organization_id,
  ce.nome_fantasia AS empresa_nome_fantasia,
  ce.logo_url AS empresa_logo_url,
  cu.raw_user_meta_data ->> 'organization_id' AS user_metadata_org_id,
  cu.raw_app_meta_data ->> 'organization_id' AS app_metadata_org_id,
  om.organization_id AS organization_member_org_id
FROM profiles p
LEFT JOIN auth.users cu ON cu.id = p.id
LEFT JOIN config_empresa ce ON ce.organization_id = p.organization_id
LEFT JOIN LATERAL (
  SELECT organization_id
  FROM organization_members
  WHERE user_id = p.id
  LIMIT 1
) om ON TRUE
WHERE
  lower(p.nome || ' ' || p.sobrenome) LIKE '%newton%'
  OR lower(coalesce(p.email, '')) LIKE '%newton%';

-- 3) Usuários sem organização definida (risco de vazamento entre tenants)
SELECT
  'PERFIS_SEM_ORGANIZACAO' AS tipo,
  p.id,
  p.email,
  p.nome,
  p.sobrenome
FROM profiles p
WHERE p.organization_id IS NULL
ORDER BY p.nome NULLS LAST;
