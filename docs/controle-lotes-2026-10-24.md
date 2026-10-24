# Controle de lotes

O pedido de compra continua sendo a origem financeira. O usuário cadastra um registro representando o conjunto, confirma a compra e usa **Controlar como lote** nos detalhes do pedido para informar descrição e quantidade. A conversão exige uma compra concluída, um único veículo disponível e ausência de despesas ou vendas anteriores desse veículo. Não atende consignação.

O lote gera unidades internas automaticamente. O custo total de aquisição é repartido em centavos entre elas; o registro original se torna a primeira unidade. Os títulos e pagamentos da compra são preservados. Não há nova dívida, novo desembolso nem ativo pai duplicado. O cadastro original fica registrado em um snapshot. Os preços de anúncio são zerados e as unidades ficam fora do site público.

No estoque, o lote aparece agrupado. Nos detalhes estão quantidades, custos, pagamentos, vendas, recebimentos e contas em aberto. A lista de unidades fica recolhida; placa/chassi podem ser informados depois. Identificações repetidas na empresa são rejeitadas.

## Despesas, vendas e recebimentos

- Uma despesa comum é rateada entre todas as unidades, incluindo as já vendidas. Uma despesa específica afeta apenas a unidade selecionada. O título financeiro é único e pode receber baixas parciais. O link do comprovante é opcional.
- A venda informa cliente, quantidade, preço e cronograma. Seleciona somente unidades disponíveis e cria um pedido com múltiplos itens e um único conjunto de cobranças.
- Entrada com conta e data não futura representa recebimento efetivo. Parcelas sem baixa permanecem a receber, inclusive se uma conta estiver indicada para data futura. Programação não equivale a dinheiro recebido.
- As baixas passam pelo financeiro existente com validação de conta, organização, saldo e data. A intenção da operação é preservada nos retries para evitar duplicação.
- O resultado gerencial usa custos atuais. Despesas posteriores atualizam o custo das unidades vendidas e o custo do estoque restante; os indicadores gerais também acompanham esses custos. Cada item de venda preserva o custo conhecido na confirmação, exibido como referência histórica. Enquanto o lote estiver aberto, o resultado é provisório.
- Participação dos sócios é herdada da compra e aplicada ao investimento rateado; pagar uma conta não altera automaticamente esses percentuais.

Venda sem movimentação financeira pode ser cancelada e devolve todas as unidades. Estorno, reembolso e devolução parcial de venda recebida não estão disponíveis neste fluxo; o sistema bloqueia esse cancelamento. O encerramento exige todas as unidades vendidas e todos os títulos quitados. Após encerrar, despesas e vendas ficam bloqueadas; identificação permanece permitida.

Os fluxos legados de edição, exclusão e faturamento de veículos ou títulos pertencentes ao lote são protegidos também no banco. As ações devem ser feitas pelo controle do lote; baixas no Financeiro são encaminhadas à RPC específica.

## Validação

Suítes sem rede:

```sh
node scripts/test-lotes-values.mjs
node scripts/test-lotes-service.mjs
node scripts/test-lotes-ui.mjs
node scripts/test-venda-lote-integration.mjs
node scripts/test-receivables.mjs
node scripts/test-estoque-search.mjs
```

O teste SQL usa PostgreSQL/WASM isolado, com schema e registros sintéticos. Dependência opcional, sem alterar package.json ou lockfile:

```sh
npm install --prefix /tmp/drivecar-lotes-pglite @electric-sql/pglite@0.5.11 --no-audit --no-fund
PGLITE_MODULE_PATH=/tmp/drivecar-lotes-pglite/node_modules/@electric-sql/pglite/dist/index.js node scripts/test-lotes-sql.mjs
```

Ele cobre conversão, centavos, três sócios, referências de outras organizações, dados legados, excesso de quantidade, repetição, oito relatórios, despesa tardia, cancelamento e encerramento. `supabase/tests/lotes_rollback.sql` contém cenários transacionais: exige configurar usuário de teste e termina com rollback. Sequências podem manter lacunas de numeração.

O fluxo foi conferido no Safari com dados em memória: compra de 50 motos/R$304 mil, frete de R$10 mil, mecânica de R$6 mil, venda de três/R$27 mil, entrada de R$12 mil, saldo a receber de R$15 mil e 47 disponíveis. Essa prévia bloqueia importação do cliente Supabase, não entra no build do produto e não grava dados de exemplo no banco.

As migrations `20261024163146_lotes_veiculos_custos_vendas.sql` e `20261024163638_index_lotes_foreign_keys.sql` foram aplicadas no projeto Supabase autorizado. O teste remoto autenticado usou parceiro, categoria, forma e conta sintéticos dentro de uma transação desfeita. Após o teste, não restaram fixtures e o pedido original conservou um veículo de R$304 mil e um título de R$304 mil pago. A conversão desse pedido e a publicação do aplicativo são operações separadas.

Build de produção validado. A checagem TypeScript completa mantém os erros preexistentes em cadastros, site público, scripts antigos e funções Deno; não foram introduzidos erros nos domínios modificados. Concorrência entre conexões reais não foi exercitada: o controle foi implementado com locks transacionais e revisado por código.
