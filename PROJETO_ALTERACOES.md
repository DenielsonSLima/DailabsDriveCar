# Histórico de Alterações do Projeto

## [2026-04-16] - Otimização Módulo Fipe e Refino de UX/UI do Dashboard

**O que foi feito:**
- **Redesign Premium do FIPE**: Reformulação completa do `FipeConsultModal` para layout de alta densidade. Substituição de gráfico confuso por tabela histórica cronológica reversa com paginação.
- **Sistema de Cache FIPE**: Implementada tabela `fipe_api_cache` e lógica RPC para evitar cobranças duplicadas na API Brasil ao consultar a mesma placa repetidamente.
- **Gestão de Consumo**: Ajuste nas RPCs `rpc_record_fipe_usage` e `rpc_get_fipe_usage_stats` para contabilizar apenas consultas "frescas". Implementado reset de contador para empresas específicas.
- **Navegação de Marketing**: Adicionados botões de "Voltar" (Painel Início) nos geradores de Stories e Feed, melhorando o fluxo de retorno do usuário.
- **Equilíbrio do Dashboard**: Implementado `sticky sidebar` no `Inicio.page.tsx`. A coluna lateral agora acompanha a rolagem, eliminando o "vazio" visual quando o estoque tem poucos veículos.
- **Correções de Build**: Resolvidos erros de JSX de fechamento de tags em `FeedGenerator.page.tsx` e `ModelosList.tsx` que impediam o deploy no Vercel.

**Por quê:**
O módulo Fipe estava gerando custos desnecessários por falta de cache. O dashboard apresentava problemas estéticos de proporção e os módulos de marketing "prendiam" o usuário sem uma rota clara de saída.

**Arquivos afetados:**
- `modules/inicio/components/FipeConsultModal.tsx`
- `modules/inicio/components/FipeUsageCard.tsx`
- `modules/inicio/Inicio.page.tsx`
- `modules/marketing/StoryGenerator.page.tsx`
- `modules/marketing/FeedGenerator.page.tsx`
- `modules/cadastros/modelos/components/ModelosList.tsx`
- Banco de Dados (RPCs de Usage e Cache)

## [2026-04-15] - Correção Bug: Typo "valor_negociated" em confirmar_pedido_compra

**O que foi feito:**
- Corrigido typo crítico na função PostgreSQL `confirmar_pedido_compra`: campo `valor_negociated` (inexistente, inglês) → `valor_negociado` (correto, português).
- O erro ocorria ao tentar confirmar um pedido de compra com qualquer forma de pagamento não-consignação (PIX, Dinheiro, Caixa, etc.), lançando: `record "v_pedido" has no field "valor_negociado"`.

**Por quê:**
O branch `ELSE` do cálculo de `v_custo_final` usava `v_pedido.valor_negociated` (typo com sufixo em inglês), campo que não existe na tabela `cmp_pedidos`. O branch `IF` (consignação) usava o nome correto `valor_negociado`, por isso consignação funcionava mas compras normais quebravam.

**Arquivos afetados:**
- Banco de Dados: Função `confirmar_pedido_compra` (migration `fix_confirmar_pedido_compra_typo_valor_negociated`)

**Erros comuns — não repita:**
- Nunca usar nomes de campos em inglês misturados com português em funções PL/pgSQL. Usar sempre o nome exato da coluna da tabela.

## [2026-04-15] - Reestruturação de Catálogos: Global vs. Por Empresa + Cópia Souza Veículos

**O que foi feito:**
- **Catálogos Globais**: Migrados 8 catálogos de veículo para serem compartilhados entre todas as empresas (`organization_id = NULL`): `cad_montadoras` (13), `cad_modelos` (27), `cad_versoes` (29), `cad_tipos_veiculos` (5), `cad_combustivel` (6), `cad_transmissao` (3), `cad_motorizacao` (17), `cad_cores` (16).
- **RLS Atualizada**: Policies das tabelas globais atualizadas para padrão híbrido — SELECT livre para registros globais (`organization_id IS NULL`) ou da própria empresa, INSERT/UPDATE/DELETE apenas para registros da empresa (`is_member_of`).
- **Cópia Souza Veículos**: Copiados todos os catálogos por empresa da Hidrocar para a Souza Veículos com novos UUIDs e mapeamento correto de FKs:
  - `cad_caracteristicas`: 7 registros
  - `cad_opcionais`: 18 registros
  - `cad_formas_pagamento`: 4 registros (FK origin para condições)
  - `cad_condicoes_pagamento`: 6 registros (com mapeamento de forma_pagamento_id)
  - `cad_condicoes_recebimento`: 6 registros (com mapeamento de forma_pagamento_id)
  - `fin_despesas_grupos`: 6 registros
  - `fin_despesas_categorias`: 14 registros (com mapeamento de grupo_id)
- **Limpeza**: Removidos 2 registros órfãos (`condicoes_pagamento` e `condicoes_recebimento` com `organization_id = NULL`).

**Por quê:**
Montadoras, modelos, versões, combustível, transmissão, motorização, cores e tipos de veículo são dados universais do Brasil — não faz sentido cada empresa manter separado. Características, opcionais, formas de pagamento, condições financeiras e categorias de despesas têm lógica específica por empresa. A Souza Veículos foi iniciada sem catálogos; os dados da Hidrocar foram copiados como ponto de partida.

**Arquivos afetados:**
- Banco de Dados: Migrations `make_vehicle_catalogs_global`, `copy_hidrocar_to_souza_simple_tables`, `copy_hidrocar_to_souza_formas_pagamento`, `copy_hidrocar_to_souza_despesas_v2`, `cleanup_orphan_catalog_records`

## [2026-04-13—Noite] - Ativação do Nexus AI (Gemini 1.5 Flash) e Modo Tutor
**O que foi feito:**
- **Ativação da API**: Configurada a chave real da API do Gemini no `.env.local` e refatorado o `rag.service.ts` para carregar via `import.meta.env`.
- **Implementação do Modo Tutor**: O System Prompt do Nexus AI foi atualizado para assumir o papel de instrutor oficial do ERP. Agora o assistente é capaz de explicar "como fazer" tarefas no sistema (ex: cadastrar veículos, baixar títulos) além de apenas consultar dados.
- **Melhoria de UI/UX**: O assistente agora utiliza formatação rica (Markdown, tabelas e listas) para guiar o usuário de forma didática.

**Por quê:**
O usuário solicitou que a IA fosse capaz de ensinar a usar o sistema, transformando o assistente de dados em um guia interativo para facilitar o onboarding e suporte.

**Arquivos afetados:**
- `.env.local`
- `services/rag.service.ts`
- `PROJETO_ALTERACOES.md`


## [2026-04-13] - Estabilização SaaS, Correção de RLS e Ajustes de UI
**O que foi feito:**
- **Correção Crítica de RLS (Recursão Infinita)**: Identificado e corrigido loop infinito nas políticas de segurança das tabelas `organization_members` e `profiles`. Implementada função `is_member_of` com `SECURITY DEFINER` e `search_path` fixo para garantir isolamento total e performance.
- **Modo Stealth (Privacidade)**: Implementada regra de invisibilidade para o perfil da Bruna (`18aa5764...`). O perfil permanece ativo e funcional para ela, mas não aparece em listagens para nenhum outro usuário, garantindo sigilo de acesso.
- **Correção de Layout (React Portals)**: Resolvido o erro de "buraco no topo" em modais e sidebars. Os componentes `ContaForm` e `ReceberQuickView` agora utilizam `ReactDOM.createPortal`, garantindo que cubram 100% do viewport e sobreponham corretamente o Header fixo.
- **Hardening de RPCs**: Atualizadas as funções `get_inicio_dashboard_stats`, `get_kpi_saldo_bancario` e `rpc_kpi_dashboard_financeiro` com práticas de segurança recomendadas pelo Supabase (set search_path).
- **Triggers de Autenticação**: Ajustada a função `handle_new_user` para operar com `SECURITY DEFINER`, permitindo a criação de perfis sem conflitos de RLS.

**Por quê:**
O sistema apresentava erros de recursão que impediam o carregamento do módulo de usuários e tinha falhas visuais onde os modais ficavam "presos" sob o cabeçalho. Além disso, foi solicitada a ocultação estratégica de um usuário administrativo.

**Arquivos afetados:**
- Banco de Dados (SQL: RLS, Functions e Triggers)
- `modules/ajustes/contas-bancarias/components/ContaForm.tsx`
- `modules/financeiro/submodules/contas-receber/components/ReceberQuickView.tsx`
- `PROJETO_ALTERACOES.md`


## [2026-04-01] - Correção: Detalhamento do Estoque e Histórico Patrimonial (Módulo Caixa)
**O que foi feito:**
- **Correção de Chaves JSONB e Dados Técnicos**: Corrigido o RPC `get_caixa_patrimonio_socios` que utilizava chaves incorretas (`id` e `percentual`) e não retornava os detalhes técnicos do veículo. Agora os campos Marca, Modelo, Versão e especificações (Câmbio, Motor, Combustível, Anos) são retornados corretamente, eliminando o erro "N/A" no card de estoque.
- **Implementação de Estoque Histórico**: Refatoradas as RPCs `get_caixa_metrics` e `get_caixa_patrimonio_socios` para suportar visualização retroativa do estoque.
    - Se a data final do filtro for anterior à data atual, o sistema agora reconstrói o estado do estoque naquele dia (considerando veículos comprados até a data e não vendidos até a mesma).
    - Garante que ao mudar de mês (ex: de Abril para Março), o patrimônio em estoque exibido seja o real do fechamento do mês selecionado.
- **Isolamento de Tenant**: Reforçado o uso de `v_org_id` em todas as subqueries de estoque histórico para garantir segurança multitenancy.

**Por quê:**
Ao mudar de mês, o card de detalhamento do estoque mostrava 0 veículos ou apenas o estoque atual, impedindo a conferência financeira de meses passados. A inconsistência nas chaves do JSONB também impedia que os veículos aparecessem mesmo no mês atual.

**Arquivos afetados:**
- Banco de Dados: RPCs `get_caixa_metrics` e `get_caixa_patrimonio_socios`.


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
