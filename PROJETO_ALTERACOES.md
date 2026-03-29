# Histórico de Alterações do Projeto

## [2026-03-29—Tarde] - Migração Global: Arquitetura 'Frontend Burro'
**O que foi feito:**
- [X] Correção do KPI "Compra (Vendidos)" no Módulo Caixa (Campo missing na RPC `get_caixa_metrics`).
- [X] Centralização total da lógica de lucro no banco de dados (Arquitetura Frontend Burro).
- [X] Auditoria de segurança e isolamento multi-tenant em todas as RPCs de Dashboard.
- [x] Corrigir bug de R$ 0,00 no KPI "Compra (Vendidos)" do Módulo Caixa.
- [x] Auditar `get_caixa_metrics` para garantir precisão absoluta.
- [x] Sincronizar lucro entre Caixa e Início.
- **Centralização de Cálculos**: Toda a aritmética financeira foi movida do React/TypeScript para o Supabase (SQL/Triggers/RPCs).
- **Módulo Estoque**: Adicionadas colunas geradas (`valor_total_investido`, `valor_lucro_estimado`, `valor_margem_estimada`) em `est_veiculos`.
- **Módulo Vendas**: Criada trigger `trg_sync_venda_pedidos_finance` para calcular lucro e custo real no momento do pedido.
- **Módulo Caixa**: Refatoradas RPCs `get_caixa_metrics` e `get_caixa_patrimonio_socios` para realizar rateio de lucros no banco.
- **Correção Crítica**: Corrigido bug de 'Lucro do Mês' que exibia 0 ou valores inconsistentes devido a mismatch de campos entre RPC e Frontend. Padronizado Lucro Líquido = (Grosso - Operacional).
- **Módulo Performance**: Refatorado `PerformanceService` para usar dados pré-calculados, eliminando `.reduce()` e lógica complexa de listas.
- **Relatórios**: Atualizado `RelatoriosService` para que os PDFs consumam colunas financeiras consolidadas.

**Por quê:**
Para eliminar inconsistências de arredondamento, acabar com o "flickering" visual durante o carregamento e garantir que o banco de dados seja a Única Fonte da Verdade (SSOT). O frontend agora apenas exibe o que o servidor processou.

**Arquivos afetados:**
- Banco de Dados (Novas colunas, triggers e RPCs atualizadas)
- `modules/estoque/estoque.service.ts` / `estoque.types.ts`
- `modules/caixa/caixa.service.ts` / `caixa.types.ts`
- `modules/pedidos-venda/pedidos-venda.service.ts` / `VendaKpis.tsx`
- `modules/performance/performance.service.ts` / `PerformanceContent.tsx`
- `modules/relatorios/relatorios.service.ts`
- `modules/inicio/inicio.service.ts`


## [2026-03-29] - Implementação de Memória RAG e Assistente Nexus AI
**O que foi feito:**
- **Infraestrutura Vetorial**: Habilitação do `pgvector` no Supabase e criação da tabela `rag_memory` com suporte a multitenancy via `organization_id`.
- **Motor de Busca**: Criada a função RPC `match_rag_memory` no Postgres para busca por similaridade de cosseno.
- **Serviços de IA**: Implementado `RagService` integrado ao Google Gemini (Embeddings para indexação e IA Generativa para respostas).
- **Indexação de Dados**: Criado script `index-data.ts` para converter registros de Veículos, Parceiros e Financeiro em memórias vetoriais.
- **Interface do Assistente**: Desenvolvido o componente `AIAssistant.tsx` (Floating Glassmorphism UI) injetado globalmente no layout.
- **Dependências**: Adicionados `lucide-react` e `react-markdown`.

**Por quê:**
Para permitir que o usuário consulte o ERP usando linguagem natural e obtenha respostas inteligentes baseadas nos dados reais do sistema, reduzindo a necessidade de navegação manual em múltiplos relatórios.

**Arquivos afetados:**
- `supabase/migrations/enable_rag_memory.sql` (Criação da estrutura)
- `services/rag.service.ts` (Core da inteligência)
- `scripts/index-data.ts` (Popular as memórias)
- `components/AIAssistant.tsx` (UI do chat)
- `components/Layout.tsx` (Injeção global)
- `.agent/skills/rag-agent/SKILL.md` (Protocolo do agente)
- `PROJETO_CONTEXTO.md` (Atualização de arquitetura)


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
