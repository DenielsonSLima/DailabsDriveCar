-- ==============================================================================
-- SCRIPT DE LIMPEZA NUCLEAR: NEXUS ERP
-- Objetivo: ZERAR COMPLETAMENTE o estoque e os pedidos (Venda/Compra).
-- Motivo: Bypassar políticas de RLS que impedem exclusão via API.
-- Execução: COPIE E COLE NO "SQL EDITOR" DO DASHBOARD DO SUPABASE.
-- ==============================================================================

BEGIN;

-- Remove todos os registros e dependências (fotos, sócios, despesas, transações vinculadas)
TRUNCATE TABLE 
    est_veiculos, 
    venda_pedidos, 
    cmp_pedidos,
    venda_pedidos_pagamentos,
    cmp_pedidos_pagamentos,
    est_veiculos_despesas,
    est_veiculos_despesas_pagamentos,
    fin_transacoes,
    fin_titulos
RESTART IDENTITY CASCADE;

COMMIT;

-- VERIFICAÇÃO FINAL (Deve retornar tudo ZERO)
SELECT 'Veículos' as Tabela, COUNT(*) FROM est_veiculos
UNION ALL
SELECT 'Vendas', COUNT(*) FROM venda_pedidos
UNION ALL
SELECT 'Compras', COUNT(*) FROM cmp_pedidos
UNION ALL
SELECT 'Títulos Financeiros', COUNT(*) FROM fin_titulos;
