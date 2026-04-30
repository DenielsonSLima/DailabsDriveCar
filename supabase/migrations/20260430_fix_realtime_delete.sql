-- =============================================
-- MIGRAÇÃO: Ajuste de Identidade de Réplica para Realtime
-- Data: 2026-04-30
-- Descrição: Define REPLICA IDENTITY FULL para garantir que eventos de DELETE
--            no Realtime contenham todos os dados necessários para o RLS.
-- =============================================

ALTER TABLE public.fin_titulos REPLICA IDENTITY FULL;
ALTER TABLE public.fin_transacoes REPLICA IDENTITY FULL;
ALTER TABLE public.fin_contas_bancarias REPLICA IDENTITY FULL;
