-- Migration: Fix Realtime Delete for fin_retiradas and fin_transferencias
-- Date: 2026-07-09
-- Objetivo: Garantir que deleções em tempo real para retiradas e transferências
-- enviem todos os campos (incluindo organization_id), permitindo que filtros RLS
-- entreguem os eventos de DELETE no frontend de forma robusta e evitem a necessidade de F5.

ALTER TABLE public.fin_retiradas REPLICA IDENTITY FULL;
ALTER TABLE public.fin_transferencias REPLICA IDENTITY FULL;
