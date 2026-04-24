# Histórico de Alterações do Projeto

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
