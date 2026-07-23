-- Migration: 20260723_fin_anotacoes
-- Cria tabela de anotações livres do módulo financeiro
-- Sem movimentação financeira — apenas registro de notas com data, descrição e valor opcional
-- Aparece no PDF do Caixa como seção informativa

CREATE TABLE IF NOT EXISTS public.fin_anotacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  descricao TEXT NOT NULL,
  valor NUMERIC(15, 2) NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.fin_anotacoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "org_private_access" ON public.fin_anotacoes;
CREATE POLICY "org_private_access" ON public.fin_anotacoes
  USING (is_member_of(organization_id))
  WITH CHECK (is_member_of(organization_id));

COMMENT ON TABLE public.fin_anotacoes IS 'Anotações livres do módulo financeiro — sem movimentação financeira. Aparecem no PDF do Caixa.';
