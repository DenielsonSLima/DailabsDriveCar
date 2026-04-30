# Histórico de Alterações do Projeto

## [2026-04-30] - Fix: Sincronização entre Outros Débitos/Créditos e Módulo Caixa
**O que foi feito:**
- **Bug de Sincronização**: Ao excluir ou lançar registros nos módulos "Outros Débitos" e "Outros Créditos", o dashboard do "Módulo Caixa" não atualizava automaticamente (exigia F5). Isso ocorria porque as deleções em tempo real do Supabase às vezes são filtradas por RLS se a replica identity não for FULL, e o frontend não invalidava manualmente as queries globais.
- **Fix Frontend**: Adicionado `useQueryClient` aos módulos de Outros Débitos e Outros Créditos. Agora, qualquer operação bem-sucedida (Lançar, Editar, Excluir, Baixar) dispara um `queryClient.invalidateQueries({ queryKey: ['caixa_dashboard'] })`, garantindo que o dashboard financeiro reflita os dados atualizados instantaneamente.
- **Fix Backend (DB)**: Criada migração `20260430_fix_realtime_delete.sql` que define `REPLICA IDENTITY FULL` nas tabelas `fin_titulos`, `fin_transacoes` e `fin_contas_bancarias`. Isso garante que o Supabase Realtime envie todos os campos nas deleções, permitindo que o RLS processe os eventos corretamente no lado do cliente.
- **Estabilidade**: Otimizada a experiência do usuário eliminando a necessidade de recarregar a página para ver o saldo e passivos atualizados no Caixa.

**Arquivos afetados:**
- `modules/financeiro/submodules/outros-debitos/OutrosDebitos.page.tsx` [FIX]
- `modules/financeiro/submodules/outros-creditos/OutrosCreditos.page.tsx` [FIX]
- `supabase/migrations/20260430_fix_realtime_delete.sql` [NEW]

## [2026-04-29] - Fix: Cards KPIs em Branco + Integração OUTRO_DEBITO nos Cálculos
**O que foi feito:**
- **Bug KPIs em Branco (Root Cause)**: Os cards de KPIs nos módulos Outros Débitos e Outros Créditos mostravam skeleton loading infinito (barras cinza pulsando) ao invés de exibir `R$ 0,00`. A causa era dupla:
  1. `Promise.all` fazia com que um erro em qualquer chamada (getAll ou getKpis) derrubasse ambas, e o `catch` não fazia `setKpis(null)`, deixando o estado como `null` (inicial).
  2. O componente usava `!== undefined` para decidir entre mostrar o valor ou o skeleton — quando kpis era `null`, `null?.campo` retorna `undefined`, mostrando o skeleton indefinidamente.
- **Fix Frontend**: Substituído `Promise.all` por `Promise.allSettled` para isolar erros. Componentes KPIs agora usam `?? 0` (fallback para zero) e prop `loading` para controlar skeleton.
- **Fix Backend (RPCs)**: Atualizado `rpc_kpi_dashboard_financeiro` e `get_caixa_metrics` para incluir métrica `outros_debitos` nos cálculos de lucro mensal, lucro gerado e margem.
- **Types**: Adicionado `total_outros_debitos` ao `ICaixaDashboardData` e `CaixaDashboardSchema` (Zod) + `outros_debitos` ao `IFinanceiroKpis`.
- **Dashboard Financeiro**: Adicionado card "Outros Débitos" na segunda linha de KPIs (agora 4 colunas: Variáveis, Receitas, Débitos, Retiradas).
- **Fix Preventivo**: Aplicada mesma correção no módulo Outros Créditos (CreditosKpis + OutrosCreditos.page).

**Verificações realizadas (sem bugs):**
- ✅ `rpc_kpi_outros_debitos` — SQL e permissões OK, usa `get_my_org_id()` e retorna zeros corretamente.
- ✅ `lancar_debito` — RPC funcional, cria título PAGAR com origem OUTRO_DEBITO.
- ✅ Contas a Pagar — já inclui OUTRO_DEBITO (filtra só `tipo = 'PAGAR'`, sem restrição de `origem_tipo`).
- ✅ `rpc_kpi_contas_pagar` — já inclui OUTRO_DEBITO.
- ✅ `get_caixa_metrics` → `total_saidas` e `total_passivo_circulante` já incluíam OUTRO_DEBITO.
- ✅ Forecast financeiro — já inclui (busca todos títulos PAGAR).

**Arquivos afetados:**
- `modules/financeiro/submodules/outros-debitos/components/DebitosKpis.tsx` [FIX]
- `modules/financeiro/submodules/outros-debitos/OutrosDebitos.page.tsx` [FIX]
- `modules/financeiro/submodules/outros-creditos/components/CreditosKpis.tsx` [FIX PREVENTIVO]
- `modules/financeiro/submodules/outros-creditos/OutrosCreditos.page.tsx` [FIX PREVENTIVO]
- `modules/financeiro/Financeiro.page.tsx` [MODIFY - novo card]
- `modules/financeiro/financeiro.types.ts` [MODIFY - novo campo]
- `modules/caixa/caixa.types.ts` [MODIFY - novo campo]
- Supabase RPCs: `rpc_kpi_dashboard_financeiro`, `get_caixa_metrics` [MIGRATE]

---

## [2026-04-29] - Novo Submódulo "Outros Débitos" no Financeiro
**O que foi feito:**
- **Novo Submódulo Completo**: Criado o submódulo `outros-debitos` espelhando a estrutura de `outros-creditos`, mantendo simetria perfeita no sistema financeiro.
- **Frontend (9 arquivos)**: Page, Service, Types + 6 componentes (DebitoCard, DebitoForm, DebitosFilters, DebitosKpis, DebitosList, ModalDetalhesDebito).
- **Banco de Dados (RPCs)**: Criados `lancar_debito` (cria título PAGAR com origem OUTRO_DEBITO) e `rpc_kpi_outros_debitos` (KPIs: total debitado, pendente, atrasado). Migração em `supabase/migrations/20260429_outros_debitos.sql`.
- **Tipos**: Adicionado `OUTRO_DEBITO` ao enum `origem_tipo` em `financeiro.types.ts` (Zod + ITitulo + OrigemHistorico).
- **Navegação**: Registrado no menu do `Financeiro.page.tsx` entre "Outros Créditos" e "Retiradas" com ícone e cor rose.
- **Funcionalidades**: Divisão entre sócios (split), pagamento à vista opcional, descrição livre, documento de referência, filtros, paginação, ordenação, visualização card/lista, histórico de baixas, edição e estorno de pagamentos.

**Por quê:**
Necessidade de registrar débitos extraordinários de valores altos (ex: 400 mil) com divisão de responsabilidade entre sócios, separando-os das despesas operacionais (contas a pagar comuns).

**Arquivos afetados:**
- `modules/financeiro/submodules/outros-debitos/` (9 arquivos novos)
- `modules/financeiro/Financeiro.page.tsx` [MODIFY]
- `modules/financeiro/financeiro.types.ts` [MODIFY]
- `supabase/migrations/20260429_outros_debitos.sql` [NEW]

**Observações:**
- ⚠️ A migração SQL precisa ser executada no Supabase (RPCs `lancar_debito` e `rpc_kpi_outros_debitos`). A rede externa não estava disponível durante a criação — executar via SQL Editor do Supabase Dashboard.
- O ModalBaixa compartilhado é reutilizado para baixas de débitos, já que ele detecta automaticamente o tipo do título (PAGAR/RECEBER).
- Design visual usa esquema de cores **rose/vermelho** para distinguir dos créditos (teal/verde).

---

## [2026-04-28] - Criação do Schema Base para Integração Meta Ads (Marketing)
**O que foi feito:**
- **Tabelas Criadas**: Criadas as tabelas `mkt_meta_integrations` e `mkt_campanhas` via Supabase MCP para suportar o novo módulo de integração com Facebook/Instagram.
- **Isolamento de Dados**: Implementadas políticas RLS (`org_private_access`) em ambas as tabelas utilizando a função padrão `is_member_of(organization_id)` para garantir segurança multi-tenant.
- **Relacionamentos**: Campanhas atreladas a `est_veiculos` para permitir métricas de impulsionamento por carro.

**Por quê:**
Preparar o banco de dados (fundação backend) para o novo ecossistema de marketing, permitindo salvar tokens da Meta Graph/Marketing API de forma segura e orquestrar campanhas pagas criadas de dentro do ERP.

**Arquivos afetados:**
- Banco de Dados (Supabase: `mkt_meta_integrations`, `mkt_campanhas`)

## [2026-04-22] - Correção do Fluxo de Login e Timer de Inatividade
**O que foi feito:**
- **Inatividade e Login**: Resolvido o bug onde o sistema realizava um logout forçado (reload) imediatamente após o primeiro login. A causa era o timer de inatividade utilizando um timestamp obsoleto de sessões anteriores.
- **Sincronização de Estado**: Implementado o reset automático do timer de inatividade nos eventos `SIGNED_IN` e no carregamento inicial da sessão.
- **Redirecionamento Robusto**: Refatorada a `AuthPage` para utilizar o estado global da sessão (`useAuthStore`) como gatilho de navegação, eliminando race conditions entre o login e a atualização do estado do App.

**Por quê:**
Garantir que o primeiro acesso do usuário seja fluido e livre de recarregamentos inesperados, melhorando a confiabilidade do sistema de autenticação.

**Arquivos afetados:**
- `App.tsx`
- `modules/auth/Auth.page.tsx`

## [2026-04-17] - Modernização de Relatórios e Correções de Layout
**O que foi feito:**
- **Visualização de Relatórios**: Implementada a visualização inline automática ao carregar as páginas de relatórios, eliminando a dependência de PDF para visualização inicial.
- **Correção de PDFs**: Ajustes de padding e layout nos cabeçalhos e rodapés do PDF de Pedido de Compra para evitar sobreposição de texto.
- **Quick Preview Modals**: Refatoração dos modais de pré-visualização rápida nos módulos de `caixa` e `pedidos-compra` usando React Portals para garantir cobertura total da tela e evitar conflitos de layout pai.
- **Conciliação Patrimonial**: Implementação completa do relatório de Conciliação Patrimonial, incluindo serviços, tipos e template de impressão.
- **KPIs do Dashboard**: Correção na lógica de cálculo de lucro nos KPIs do dashboard.
- **Módulo de Estoque**: Correções pontuais no formulário de estoque e modais de cadastro de modelos/versões.
- **Correção de Build**: Resolvido erro de sintaxe em `RelatorioPatrimonioConciliacao.page.tsx` causado por código duplicado e um bloco `try` não encerrado.

**Por quê:**
Melhorar a experiência do usuário ao visualizar dados financeiros e corrigir imperfeições visuais críticas em documentos gerados pelo sistema.

**Arquivos afetados:**
- `modules/caixa/components/QuickPreviewModal.tsx`
- `modules/pedidos-compra/components/details/QuickPreviewModal.tsx`
- `modules/pedidos-compra/components/details/PurchaseOrderPrint.tsx`
- `modules/relatorios/...` (vários arquivos de páginas e serviços)
- `modules/inicio/components/GeneralKpis.tsx`
- `modules/estoque/EstoqueForm.page.tsx`


## [2026-04-17] - Refatoração Modular e Correção de Resiliência
- **Modularização do Sistema**: Refatoração completa do `SitePublicoService` para separar o carregamento de dados. Agora, erros em um componente (ex: dados da empresa) não impedem a exibição de outros (ex: catálogo de veículos/motos).
- **Correção de Detalhes do Veículo**: Aplicado `z.coerce.number()` em campos de KM e Anos no schema principal, resolvendo o crash ao abrir a página de detalhes do veículo no site público.
- **Melhoria de SEO**: Tornadas dinâmicas as metatags da página de detalhes, refletindo o nome real da loja.

## [2026-04-17] - Suporte a Motocicletas e Correção de Visibilidade Inicial
- **Visibilidade Site**: Correção do erro de parsing inicial no Zod para campos numéricos.
- **Suporte a Motos**: Expansão do catálogo para motocicletas (Biz, CG 160, BMW R 1250 GS, etc.) com montadoras oficiais.
- **Limpeza de UI**: Remoção definitiva do campo `portas`.

## [2026-04-17] - Povoamento de Catálogo Global: 30 Modelos Populares/Premium e Enriquecimento Visual
**O que foi feito:**
- **Povoamento de Dados**: Inserção de 30 modelos de veículos representativos do mercado brasileiro (20 Populares e 10 Premium) como dados globais (`organization_id IS NULL`).
- **Novas Montadoras**: Cadastramento de Toyota, BMW, Audi e Land Rover.
- **Padronização Técnica**: Para cada modelo, foram criadas de 2 a 3 versões com motorização e câmbio reais (ex: 1.0 MPI, 1.3 Turbo, Hybrid, Diesel 4x4).
- **Enriquecimento Visual**:
    - Logotipos oficiais em PNG transparente para as novas e principais montadoras.
    - Fotos de estúdio (padrão catálogo) vinculadas aos modelos de maior volume e destaque.
- **Correção de Ortografia**: Renomeada a montadora `VOLKSVAGEM` para `VOLKSWAGEN` em todo o banco de dados.
- **Hotfix Modelos**: Corrigido erro de "tela branca" em `Modelos.page.tsx` causado pela ausência da função `getModeloNameById`.

**Por quê:**
O sistema necessitava de uma base de dados inicial robusta para facilitar o uso por novos clientes e demonstrar a qualidade visual do ERP. A correção na página de modelos era crítica para a estabilidade do módulo de cadastros.

**Arquivos afetados:**
- Banco de Dados (SQL: Update e Seeds)
- `modules/cadastros/modelos/Modelos.page.tsx`

## [2026-04-24] - Correção de Multi-tenancy no Lançamento de Despesas
**O que foi feito:**
- **Integridade Multi-tenant em Despesas**: Lançamentos de despesas vinculadas a veículos devem herdar o `organization_id` do veículo, nunca do usuário logado, para evitar vazamento de dados entre empresas.
- **Isolamento de Sites Públicos**: O site público deve SEMPRE utilizar a variável `VITE_ORGANIZATION_ID` para filtrar veículos, montadoras e configurações. Consultas sem este filtro causarão vazamento de estoque entre empresas.
- **Pagamentos Blindados**: Atualizado o RPC `registrar_pagamento_despesa` para herdar a organização da despesa pai, garantindo que transações financeiras e registros de caixa sejam vinculados à empresa correta.
- **Consistência de Dados**: Garantida a rastreabilidade do `user_id` e a manutenção automática do saldo bancário e custo do veículo dentro das fronteiras da organização correta.

**Por quê:**
Evitar o "vazamento" de registros financeiros entre empresas em ambientes multi-tenant, garantindo que despesas e pagamentos fiquem restritos à organização dona do patrimônio (veículo).

**Arquivos afetados:**
- Funções SQL (RPCs): `salvar_despesa_veiculo`, `registrar_pagamento_despesa`.

## [2026-04-24] - Correção de Vazamento de Dados no Site Público
**O que foi feito:**
- **Isolamento de Site**: Implementada a obrigatoriedade do filtro `organization_id` em todas as consultas do `SitePublicoService`.
- **Configuração Dinâmica**: Adicionado suporte à variável de ambiente `VITE_ORGANIZATION_ID` para que cada site (Hidrocar, Souza, etc.) exiba apenas seu próprio estoque e conteúdo.
- **Correção de Conteúdo**: Refatorada a busca de `site_conteudo` para suportar fallback de conteúdo padrão (`null`) ou conteúdo específico por organização, garantindo que o cabeçalho e informações de contato sejam os corretos.

**Por quê:**
Evitar que veículos publicados por uma empresa apareçam no site de outra empresa em um ambiente multi-tenant que compartilha o mesmo banco de dados.

**Arquivos afetados:**
- `modules/site-publico/site-publico.service.ts` [MODIFY]

## [2026-04-24] - Correção de Ambiguidade em Funções de Retirada
**O que foi feito:**
- **Eliminação de Duplicidade**: Removidas as versões redundantes das funções `registrar_retirada` e `atualizar_retirada` que causavam erro de ambiguidade no Postgres devido a tipos de dados conflitantes (`date` vs `timestamptz`).
- **Padronização de Tipos**: Padronizado o uso do tipo `date` para os argumentos de data nestas funções, alinhando com a estrutura da tabela `fin_retiradas`.
- **Melhoria na Descrição**: Aprimorada a lógica de geração de descrição automática nas transações de retirada, incluindo o link direto com o registro de retirada (`retirada_id`).

**Por quê:**
Resolver o erro "Could not choose the best candidate function" que impedia o lançamento de retiradas de sócios no módulo financeiro.

**Arquivos afetados:**

## [2026-04-26] - Correção de Crash em Listas Financeiras e Estabilidade de UI
**O que foi feito:**
- **Crash "h.map is not a function"**: Identificado e corrigido um bug de sincronização de estado nos módulos de **Despesas Variáveis** e **Despesas Fixas**. A falha ocorria devido à ausência da dependência `activeTab` no `useMemo` dos dados processados, o que causava um descasamento entre o formato dos dados (Array vs Object) e o modo de exibição (Agrupado vs Lista), resultando em falha ao tentar iterar (.map) sobre um objeto.
- **Resiliência de Estado**: Sincronizadas as dependências de memoização para garantir que a transição entre abas (Em Aberto, Pagos, Todos) e agrupamentos (Mês, Categoria) ocorra de forma atômica e segura.
- **Auditoria de SVG**: Verificados os paths de ícones na `Sidebar` e `MobileBottomNav`. Identificado que erros de parsing reportados (`M3 12i2-2`) são provavelmente causados por ferramentas de tradução automática do navegador que corrompem strings de atributos SVG.

**Por quê:**
Estabilizar a plataforma em produção, eliminando o crash de "Tela Branca" ao navegar pelos módulos financeiros e garantindo a integridade visual da interface.

**Arquivos afetados:**
- `modules/financeiro/submodules/despesas-variaveis/DespesasVariaveis.page.tsx` [MODIFY]
- `modules/financeiro/submodules/despesas-fixas/DespesasFixas.page.tsx` [MODIFY]

