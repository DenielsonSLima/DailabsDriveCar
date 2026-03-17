# Histórico de Alterações do Projeto

## [2026-03-17] - Refatoração e Modularização de KPIs Financeiros
- **Modularização de RPCs**: Criadas funções `rpc_kpi_outros_creditos`, `rpc_kpi_contas_receber`, `rpc_kpi_contas_pagar` e `rpc_kpi_dashboard_financeiro` para isolar lógicas de negócio.
- **Correção de Lógica de Desconto**: Ajustado o cálculo de saldo em aberto para considerar subtrações de `valor_desconto`.
- **Filtro de Estoque**: KPIs de Contas a Pagar/Receber agora refletem o estoque de títulos pendentes (Status: PENDENTE, ABERTO, PARCIAL, ATRASADO).
- **Interface Visual**: Atualizadas labels, cores (Azul/Verde/Vermelho) e lógica de cálculo no `ReceberQuickView`.

## [2026-03-16] - Refatoração do Fluxo de Caixa e Dashboards

## 2026-03-17 — Modularização de KPIs e Correção de Zeramento

**O que foi feito:**
- Individualização de KPIs em funções atômicas (`get_kpi_*`) para evitar que falhas isoladas zerem o dashboard.
- Correção de bug na RPC `get_financeiro_kpis` que tentava acessar uma view inexistente (`contas_bancarias_saldos`).
- Correção de filtros em `get_submodule_kpis` para incluir títulos de origem `OUTRO_CREDITO` no saldo de contas a receber.
- Refatoração dos orquestradores `get_caixa_metrics` e `get_submodule_kpis` para usar a nova infraestrutura modular.

**Por quê:**
O dashboard apresentava valores zerados devido a uma referência de banco quebrada e filtros muito restritivos que ignoravam a maioria dos títulos em aberto. A modularização torna o sistema mais robusto e fácil de manter.

**Arquivos afetados:**
- Banco de Dados (Novas funções modulares + Refatoração de RPCs existentes)
- `scripts/migrations/fix_final_unified_kpis.sql` (Documentação da migração V3)

## 2026-03-16 — Correção de Dados Técnicos e Vínculo Financeiro

**O que foi feito:**
- Correção de bug onde veículos em Pedidos de Venda e Estoque apareciam com motorização/combustível vazios.
- Correção na RPC `confirmar_venda_pedido` que não vinculava o veículo ao título de "Contas a Receber".
- Backfill de `veiculo_id` nos títulos de financeiro órfãos.
- Criação da trigger `trg_auto_populate_vehicle_version_data` no Postgres.
- Implementação de fallbacks no frontend (`SpecsCard.tsx` e `VehicleDataSaleColumn.tsx`).
- Atualização dos joins nos serviços de API para trazer dados da versão.

**Por quê:**
O sistema não copiava os dados da versão para o veículo durante a criação via pedido de compra, gerando registros incompletos no banco.

**Arquivos afetados:**
- `modules/estoque/estoque.service.ts`
- `modules/pedidos-venda/pedidos-venda.service.ts`
- `modules/pedidos-venda/components/details/vehicle-card/sub/VehicleDataSaleColumn.tsx`
- `modules/estoque/components/details/SpecsCard.tsx`
- Banco de Dados (Trigger + Backfill)
