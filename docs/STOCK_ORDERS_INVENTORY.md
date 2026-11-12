# Inventário visual: Entradas e Saídas

> Registro da etapa estática inicial. Pedidos posteriores de Home, login, Financeiro e remoção de Marketing substituem os trechos correspondentes. Resultado integrado e limites em STOCK_QA_COVERAGE.md e FINAL_REVIEW_2026-11-12.md.

Base: HEAD de fix/stock-standard-system (produção 36bc9b4). Sem publicação, commits ou escrita em dados reais.

## Cobertura
76 TSX modificados; páginas, listas/cartões, filtros/abas, KPIs, detalhes de pedidos/veículos, formulários, composição societária e modais. Contextos, Print, services, hooks, types e utils excluídos.

## Verificações executadas
- Parser TypeScript: zero erros nos 76 arquivos.
- AST sem JSX: lógica idêntica ao HEAD em todos os arquivos.
- Atributos on*, disabled, required, readOnly, value e checked: idênticos.
- Expressões exibidas JSX: apenas remoção de strokeWidth 2/3 de SVGs decorativos e avatar inicial do sócio. Todas cifras/contagens/margens/progressos conservados.
- git diff --check: limpo.
- Build/tsc/browser não executados por este agente; QA central pendente.

## Cenas sintéticas recomendadas para QA central
- Principal: PedidosKpis e PedidosVendaKpis com valores de sete dígitos, 3 sócios de nomes longos, 4 cards por linha desktop; 1 mobile; lista vazia.
- Compras detalhe: HeaderPedido, OrderCostKpis (consignação/normal), InfoNegociacaoHeader/Sidebar, CardPaymentData, PurchasePartnersResultKpis, VeiculosPedidoList.
- Vendas detalhe: HeaderVenda (rascunho/concluído/cancelado/lote), VendaAnalyticsKpis (lucro positivo/negativo), FinancialCard, VendaPartnersResultKpis, VeiculosVendaList.
- Formulários: FormCardGeneral/Supplier/Partner/Finance/FinanceSummary/Address/Notes; FormVendaClient/Address/Finance/Notes e FormCardVehicleSelection. Campos data/select/numéricos e inputs com ícones.
- Modais: ModalPaymentForm/ModalVendaPaymentForm com parcelas longas e rodapé alcançável; ModalConfirmacaoFinanceira/ModalConfirmacaoVenda com conta obrigatória, sem executar confirmação; QuickPreviewModal aberto com conteúdo sintético (não alterar impressão).
- Detalhe veículo: VehicleDataColumn/VehicleDataSaleColumn e MediaColumn com nome longo, imagem ausente e valores longos.
- Dimensões: 390px, 768px, 1440px. Verificar overflow horizontal, 40/44px controles, título20/28 modal, foco/escape herdados intactos.

## Arquivos alterados
- `modules/pedidos-compra/PedidoCompra.page.tsx`
- `modules/pedidos-compra/PedidoCompraDetalhes.page.tsx`
- `modules/pedidos-compra/PedidoCompraForm.page.tsx`
- `modules/pedidos-compra/PedidoCompraVeiculoDetalhes.page.tsx`
- `modules/pedidos-compra/components/FormCardAddress.tsx`
- `modules/pedidos-compra/components/FormCardFinance.tsx`
- `modules/pedidos-compra/components/FormCardFinanceSummary.tsx`
- `modules/pedidos-compra/components/FormCardGeneral.tsx`
- `modules/pedidos-compra/components/FormCardHeader.tsx`
- `modules/pedidos-compra/components/FormCardNotes.tsx`
- `modules/pedidos-compra/components/FormCardPartner.tsx`
- `modules/pedidos-compra/components/FormCardSupplier.tsx`
- `modules/pedidos-compra/components/PedidoCompraCard.tsx`
- `modules/pedidos-compra/components/PedidosFilters.tsx`
- `modules/pedidos-compra/components/PedidosKpis.tsx`
- `modules/pedidos-compra/components/PedidosList.tsx`
- `modules/pedidos-compra/components/details/CardAnnotations.tsx`
- `modules/pedidos-compra/components/details/CardPaymentData.tsx`
- `modules/pedidos-compra/components/details/HeaderPedido.tsx`
- `modules/pedidos-compra/components/details/InfoNegociacao.tsx`
- `modules/pedidos-compra/components/details/InfoNegociacaoHeader.tsx`
- `modules/pedidos-compra/components/details/InfoNegociacaoSidebar.tsx`
- `modules/pedidos-compra/components/details/InfoVeiculo.tsx`
- `modules/pedidos-compra/components/details/ModalConfirmacaoFinanceira.tsx`
- `modules/pedidos-compra/components/details/ModalPaymentForm.tsx`
- `modules/pedidos-compra/components/details/OrderCostKpis.tsx`
- `modules/pedidos-compra/components/details/PedidoSocios.tsx`
- `modules/pedidos-compra/components/details/PedidoStats.tsx`
- `modules/pedidos-compra/components/details/PurchasePartnersResultKpis.tsx`
- `modules/pedidos-compra/components/details/QuickPreviewModal.tsx`
- `modules/pedidos-compra/components/details/ResumoFinanceiro.tsx`
- `modules/pedidos-compra/components/details/VeiculosPedidoList.tsx`
- `modules/pedidos-compra/components/details/vehicle-card/VehicleInOrderCard.tsx`
- `modules/pedidos-compra/components/details/vehicle-card/sub/VehicleDataColumn.tsx`
- `modules/pedidos-compra/components/details/vehicle-card/sub/VehicleMediaColumn.tsx`
- `modules/pedidos-compra/components/form/CardGeneral.tsx`
- `modules/pedidos-venda/PedidoVenda.page.tsx`
- `modules/pedidos-venda/PedidoVendaDetalhes.page.tsx`
- `modules/pedidos-venda/VendaForm.page.tsx`
- `modules/pedidos-venda/VendaVeiculoDetalhes.page.tsx`
- `modules/pedidos-venda/components/FormCardClient.tsx`
- `modules/pedidos-venda/components/FormCardFinanceVenda.tsx`
- `modules/pedidos-venda/components/FormCardVehicleSelection.tsx`
- `modules/pedidos-venda/components/FormHeaderVenda.tsx`
- `modules/pedidos-venda/components/FormVendaAddress.tsx`
- `modules/pedidos-venda/components/FormVendaClient.tsx`
- `modules/pedidos-venda/components/FormVendaFinance.tsx`
- `modules/pedidos-venda/components/FormVendaHeader.tsx`
- `modules/pedidos-venda/components/FormVendaNotes.tsx`
- `modules/pedidos-venda/components/PedidoVendaCard.tsx`
- `modules/pedidos-venda/components/PedidosVendaFilters.tsx`
- `modules/pedidos-venda/components/PedidosVendaKpis.tsx`
- `modules/pedidos-venda/components/VendaCard.tsx`
- `modules/pedidos-venda/components/VendaFilters.tsx`
- `modules/pedidos-venda/components/VendaKpis.tsx`
- `modules/pedidos-venda/components/VendaRankingSociosCard.tsx`
- `modules/pedidos-venda/components/VendaSocioResultCard.tsx`
- `modules/pedidos-venda/components/VendaSocioShareCard.tsx`
- `modules/pedidos-venda/components/details/FinancialCard.tsx`
- `modules/pedidos-venda/components/details/HeaderVenda.tsx`
- `modules/pedidos-venda/components/details/InfoComercial.tsx`
- `modules/pedidos-venda/components/details/InfoComprador.tsx`
- `modules/pedidos-venda/components/details/InfoVeiculoVendido.tsx`
- `modules/pedidos-venda/components/details/InfoVendaCompradorHeader.tsx`
- `modules/pedidos-venda/components/details/ModalConfirmacaoVenda.tsx`
- `modules/pedidos-venda/components/details/ModalVendaPaymentForm.tsx`
- `modules/pedidos-venda/components/details/ObservationsCard.tsx`
- `modules/pedidos-venda/components/details/VehicleCard.tsx`
- `modules/pedidos-venda/components/details/VeiculosVendaList.tsx`
- `modules/pedidos-venda/components/details/VendaAnalyticsKpis.tsx`
- `modules/pedidos-venda/components/details/VendaKpis.tsx`
- `modules/pedidos-venda/components/details/VendaPartnersResultKpis.tsx`
- `modules/pedidos-venda/components/details/VendaSocios.tsx`
- `modules/pedidos-venda/components/details/VendaStats.tsx`
- `modules/pedidos-venda/components/details/vehicle-card/sub/VehicleDataSaleColumn.tsx`
- `modules/pedidos-venda/components/details/vehicle-card/sub/VehicleMediaSaleColumn.tsx`
