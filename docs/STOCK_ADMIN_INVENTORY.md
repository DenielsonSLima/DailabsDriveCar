# Inventário visual administrativo: padrão Estoque

> Registro da etapa estática inicial. Pedidos posteriores de Home, login, Financeiro e remoção de Marketing substituem os trechos correspondentes. Resultado integrado e limites em STOCK_QA_COVERAGE.md e FINAL_REVIEW_2026-11-12.md.

## Resultado e evidência

122 arquivos TSX ajustados somente em atributos `className`. Comparação via parser TypeScript e impressão AST, removendo atributos `className`, mostrou zero divergências de código/JSX e zero erros de sintaxe. A única diferença textual adicional é a identidade `Dailabs DriveCar` → `Arkhen Drive Car`, aplicada pelo responsável da identidade no WelcomeHeader; normalizada apenas para esta comparação. Nenhum handler, campo, condição, cálculo, API, formulário ou permissão foi removido.

Não executado nesta etapa: build, tsc, navegador ou escrita em dados. QA integrado deve validar desktop/tablet/mobile antes da entrega. Não houve publicação nem commit desta etapa.

## Papéis aplicados

- Cabeçalhos: dc-page-title/subtitle; páginas: dc-page; painéis claros: dc-panel.
- KPIs Início, Parceiros, Cidades, Montadoras, Caixa, Performance e Marketing: grade/cartão/label/value/hint comuns. Caixa deixa os destaques coloridos e valores truncados, mantendo todos os dez indicadores.
- Performance e Marketing: tabs slate/ativo branco, condições e ações preservadas.
- Formulários: inputs dc-input e títulos dc-modal-title; caixas explícitas de dialog dc-modal (nunca overlay). Espaçamento reduzido sem remover seções.
- Caixa: valores financeiros 20/28, cartões e resumos compactos; estados positivos/negativos existentes mantidos quando presentes em expressões de classe.
- Marketing Feed/Story: somente títulos e wrapper administrativo, sem tocar composição/exportação da arte.

## Exclusões e revisão de contexto

Templates de Relatórios, CaixaPrint, PerformancePrint e WatermarkPreview intocados. Tooltips escuros e áreas de pré-impressão não receberam dc-panel nem dc-kpi-card. Site público, auth/login, serviços, hooks, types, utils e SQL fora do escopo. Não existe pasta modules/showroom neste checkout. A página Ajustes renderiza ModulePlaceholder com cartões de submódulos; não é um redirecionamento. O componente compartilhado é responsabilidade do integrador.

## Cenas recomendadas para QA integrado (dados sintéticos apenas)

1. Início: WelcomeHeader + GeneralKpis (valor monetário longo, zero e positivo), SiteAnalyticsSection loading/vazio/preenchido.
2. Parceiros: quatro KPIs, filtros, lista vazia/preenchida e ParceiroForm com abas e validação.
3. Cadastros: hub + CidadesKpis + MontadorasKpis; CidadeForm e FormasPagamentoForm abertos em celular.
4. Ajustes: usuários/sócios/contas, ContaForm aberto, Logs com detalhe e filtro; não executar reset/backup nem salvar registros.
5. Caixa: dez KPIs com números extensos, resumo por sócio e tabelas; QuickPreviewModal aberto, comparar documento sem alteração.
6. Performance: MesAtual/OutrosMeses; tabs e seções expandidas/recolhidas, zero e saldo negativo; impressão sem alteração.
7. Relatórios: hub, filtros das oito páginas e prévia fechada/aberta; não disparar consultas reais no harness.
8. Marketing: KPIs e quatro tabs; modal com campos e loading; Feed/Story administrativo sem alterar canvas.

## Inventário por arquivo

### ajustes (14)

- `modules/ajustes/contas-bancarias/ContasBancarias.page.tsx`
- `modules/ajustes/contas-bancarias/components/ContaForm.tsx`
- `modules/ajustes/empresa/Empresa.page.tsx`
- `modules/ajustes/empresa/components/FormEmpresa.tsx`
- `modules/ajustes/logs/Logs.page.tsx`
- `modules/ajustes/logs/components/LogDetailsModal.tsx`
- `modules/ajustes/marca-dagua/MarcaDagua.page.tsx`
- `modules/ajustes/marca-dagua/components/WatermarkForm.tsx`
- `modules/ajustes/saldo-inicial/SaldoInicial.page.tsx`
- `modules/ajustes/socios/Socios.page.tsx`
- `modules/ajustes/socios/components/FormSocio.tsx`
- `modules/ajustes/socios/components/ListSocios.tsx`
- `modules/ajustes/usuarios/Usuarios.page.tsx`
- `modules/ajustes/usuarios/components/FormUsuario.tsx`

### cadastros (43)

- `modules/cadastros/Cadastros.page.tsx`
- `modules/cadastros/caracteristicas/Caracteristicas.page.tsx`
- `modules/cadastros/caracteristicas/components/CaracteristicaForm.tsx`
- `modules/cadastros/cidades/Cidades.page.tsx`
- `modules/cadastros/cidades/components/CidadeForm.tsx`
- `modules/cadastros/cidades/components/CidadesKpis.tsx`
- `modules/cadastros/combustivel/Combustivel.page.tsx`
- `modules/cadastros/combustivel/components/CombustivelForm.tsx`
- `modules/cadastros/condicoes-pagamento/CondicoesPagamento.page.tsx`
- `modules/cadastros/condicoes-pagamento/components/ConditionManager.tsx`
- `modules/cadastros/condicoes-recebimento/CondicoesRecebimento.page.tsx`
- `modules/cadastros/condicoes-recebimento/components/CondicaoRecebimentoForm.tsx`
- `modules/cadastros/condicoes-recebimento/components/ReceiptConditionManager.tsx`
- `modules/cadastros/cores/Cores.page.tsx`
- `modules/cadastros/cores/components/CoresForm.tsx`
- `modules/cadastros/corretores/Corretores.page.tsx`
- `modules/cadastros/corretores/components/CorretorForm.tsx`
- `modules/cadastros/formas-pagamento/FormasPagamento.page.tsx`
- `modules/cadastros/formas-pagamento/components/FormasPagamentoForm.tsx`
- `modules/cadastros/formas-pagamento/components/FormasPagamentoList.tsx`
- `modules/cadastros/modelos/Modelos.page.tsx`
- `modules/cadastros/modelos/components/ModeloForm.tsx`
- `modules/cadastros/modelos/components/ModelosList.tsx`
- `modules/cadastros/montadoras/Montadoras.page.tsx`
- `modules/cadastros/montadoras/components/FormMontadora.tsx`
- `modules/cadastros/montadoras/components/MontadorasKpis.tsx`
- `modules/cadastros/motorizacao/Motorizacao.page.tsx`
- `modules/cadastros/motorizacao/components/MotorizacaoForm.tsx`
- `modules/cadastros/opcionais/Opcionais.page.tsx`
- `modules/cadastros/opcionais/components/OpcionaisForm.tsx`
- `modules/cadastros/produtos/Produtos.page.tsx`
- `modules/cadastros/recebimentos/Recebimentos.page.tsx`
- `modules/cadastros/recebimentos/components/RecebimentoForm.tsx`
- `modules/cadastros/tipos-despesas/TiposDespesas.page.tsx`
- `modules/cadastros/tipos-despesas/components/CategoryForm.tsx`
- `modules/cadastros/tipos-despesas/components/ExpenseManager.tsx`
- `modules/cadastros/tipos-despesas/components/GroupForm.tsx`
- `modules/cadastros/tipos-veiculos/TiposVeiculos.page.tsx`
- `modules/cadastros/transmissao/Transmissao.page.tsx`
- `modules/cadastros/transmissao/components/TransmissaoForm.tsx`
- `modules/cadastros/versoes/Versoes.page.tsx`
- `modules/cadastros/versoes/components/VersionForm.tsx`
- `modules/cadastros/versoes/components/VersionManager.tsx`

### caixa (15)

- `modules/caixa/Caixa.page.tsx`
- `modules/caixa/components/AccountBalances.tsx`
- `modules/caixa/components/AccountsOverview.tsx`
- `modules/caixa/components/CaixaKpis.tsx`
- `modules/caixa/components/ComparativoMensalChart.tsx`
- `modules/caixa/components/ForecastChart.tsx`
- `modules/caixa/components/MonthlyPerformance.tsx`
- `modules/caixa/components/PendingAccountsCards.tsx`
- `modules/caixa/components/PerformanceChart.tsx`
- `modules/caixa/components/QuickPreviewModal.tsx`
- `modules/caixa/components/SocioInvestimentoCards.tsx`
- `modules/caixa/components/SocioPatrimonioCards.tsx`
- `modules/caixa/components/SocioStockOverview.tsx`
- `modules/caixa/components/SocioStockTable.tsx`
- `modules/caixa/components/SocioSummary.tsx`

### inicio (15)

- `modules/inicio/Inicio.page.tsx`
- `modules/inicio/components/FipeConsultModal.tsx`
- `modules/inicio/components/FipeUsageCard.tsx`
- `modules/inicio/components/GeneralKpis.tsx`
- `modules/inicio/components/HistoryChart.tsx`
- `modules/inicio/components/QuickShortcuts.tsx`
- `modules/inicio/components/RecentStockMini.tsx`
- `modules/inicio/components/SiteAnalyticsSection.tsx`
- `modules/inicio/components/WelcomeHeader.tsx`
- `modules/inicio/components/sub-components/AnalyticsKpiCard.tsx`
- `modules/inicio/components/sub-components/FipeAnalysisLoading.tsx`
- `modules/inicio/components/sub-components/FipeResultDetails.tsx`
- `modules/inicio/components/sub-components/FipeSearchForm.tsx`
- `modules/inicio/components/sub-components/TopViewedVehiclesCard.tsx`
- `modules/inicio/components/sub-components/VisitorLocationsCard.tsx`

### marketing (10)

- `modules/marketing/AnuncioHub.page.tsx`
- `modules/marketing/FeedGenerator.page.tsx`
- `modules/marketing/Marketing.page.tsx`
- `modules/marketing/NovoAnuncio.page.tsx`
- `modules/marketing/StoryGenerator.page.tsx`
- `modules/marketing/components/CampanhaCard.tsx`
- `modules/marketing/components/MarketingConnectModal.tsx`
- `modules/marketing/components/MarketingIntegrationHelp.tsx`
- `modules/marketing/components/MarketingVehicleSelection.tsx`
- `modules/marketing/components/PlataformaConnect.tsx`

### parceiros (9)

- `modules/parceiros/Parceiros.page.tsx`
- `modules/parceiros/components/ParceiroAddressForm.tsx`
- `modules/parceiros/components/ParceiroCard.tsx`
- `modules/parceiros/components/ParceiroContactForm.tsx`
- `modules/parceiros/components/ParceiroForm.tsx`
- `modules/parceiros/components/ParceiroIdentificationForm.tsx`
- `modules/parceiros/components/ParceirosKpis.tsx`
- `modules/parceiros/components/ParceirosList.tsx`
- `modules/parceiros/components/PartnerSelect.tsx`

### performance (6)

- `modules/performance/Performance.page.tsx`
- `modules/performance/components/MesAtual.tsx`
- `modules/performance/components/OutrosMeses.tsx`
- `modules/performance/components/PerformanceContent.tsx`
- `modules/performance/components/PerformanceUI.tsx`
- `modules/performance/components/tables/PerformanceTables.tsx`

### relatorios (10)

- `modules/relatorios/Relatorios.page.tsx`
- `modules/relatorios/components/RelatoriosQuickPreview.tsx`
- `modules/relatorios/pages/RelatorioAuditoria.page.tsx`
- `modules/relatorios/pages/RelatorioComissoes.page.tsx`
- `modules/relatorios/pages/RelatorioEstoque.page.tsx`
- `modules/relatorios/pages/RelatorioExtratoBancario.page.tsx`
- `modules/relatorios/pages/RelatorioFinanceiro.page.tsx`
- `modules/relatorios/pages/RelatorioPatrimonioConciliacao.page.tsx`
- `modules/relatorios/pages/RelatorioServicos.page.tsx`
- `modules/relatorios/pages/RelatorioVendas.page.tsx`

## Revisão adicional de contraste e composição

Varredura por árvore JSX dos 122 arquivos: nenhum dc-page-title/dc-section-title/dc-modal-title sob ancestral escuro não-overlay. Cabeçalhos Fipe e Logs refinados para fundo slate-50 e padding16; títulos de modais Fipe, Logs, Sócios, Usuários, Tipo de Veículo e Novo Anúncio usam dc-modal-title. O formulário de busca FIPE interno usa dc-section-title, não título de modal.

Inspeção dos dc-panel com filhos acolchoados encontrou apenas cartões internos de dados (ListSocios e MarketingVehicleSelection) e botão (VersionManager), não wrappers de modal/tabela com header/body duplicados. Mantidos, pois representam componentes internos distintos. Tooltips, canvas e documentos não foram alterados nesta revisão.

## Janela de integração seguinte

Incluído EditorSite administrativo (123 TSX no escopo acumulado), com painéis16, título de página30/24, seção14, tabs e inputs comuns. Corrigidos controles das oito páginas de Relatórios via AST, Logs sem cabeçalho80px/padding externo duplicado e chrome de Feed/Story com painéis16 e layout empilhado até lg. Canvas/arte permanecem idênticos.

QA apontou três destaques de Performance: Saldo Total Contas, Despesas Veículos e Retiradas Sócios agora usam cartões brancos e valor20. GeneralKpis do Início usa ícone24 alinhado no topo-direita, sem linha adicional ou altura artificial. Marketing recebeu header apresentacional com h1 e subtítulo. Esta adição é a única diferença estrutural de JSX; demais alterações desta janela são className. Sem alteração de handlers/cálculos/serviços. TypeScript parser sem erros e diff-check limpo; QA visual da nova revisão a cargo do integrador.
