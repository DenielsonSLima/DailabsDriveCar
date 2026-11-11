# Estoque e Lotes: interface compacta e financeiro

## Entrega

- Estoque: quatro indicadores compactos e participação por sócio em uma faixa menor.
- Entradas e Saídas: quatro cards por linha a partir de 1280 px, duas colunas intermediárias e uma no celular.
- Lotes: abas Resumo, Entrada, Despesas e Saídas reorganizadas com indicadores menores.
- Resumo: lucro médio por moto, bruto, líquido gerencial, vendas, estoque e atalhos para entrada, despesas e saídas. Memória de cálculo e médias continuam disponíveis em painel expansível.
- Financeiro: somente recebíveis de vendas confirmadas deste lote, quatro linhas por card, filtros de aberto/quitado/todos, paginação, detalhes com caminho e voltar.
- Recebimento: modal existente de Contas a Receber, com pagamento parcial, acréscimo/juros e desconto. Histórico reaproveitado em modo somente leitura.

## Valores apresentados

As regras existentes de resultado foram preservadas. A nova apresentação explicita:

- Bruto = vendas confirmadas − aquisição das unidades vendidas.
- Líquido gerencial = bruto − todas as despesas registradas no lote, pagas ou pendentes.
- Médio por moto = líquido gerencial ÷ quantidade em vendas confirmadas. Sem vendas, exibe “—”.
- Compra não vendida permanece em estoque pelo custo de aquisição.
- Caixa = valores efetivamente recebidos − pagos, separado do lucro comercial.

Os números não representam uma apuração tributária ou contábil completa. Juros e descontos financeiros não mudam o valor comercial registrado nas vendas.

## Segurança e compatibilidade

A migration `20261111181906_juros_baixa_lote.sql` deve ser aplicada antes da publicação do frontend. Ela preserva a chamada de seis argumentos para clientes anteriores e acrescenta uma chamada explícita de oito argumentos, com os ajustes financeiros.

A baixa mantém verificação da organização, bloqueio do lote, controle de saldo e chave de idempotência. A mesma tentativa pode ser repetida após falha de rede sem duplicar o recebimento. Juros recebidos sem amortização não reduzem o principal. Desconto não gera entrada fictícia de caixa.

A consulta do histórico exige empresa, lote, título, origem de venda e tipo RECEBER. A nova aba não traz recebíveis de outros lotes nem da carteira normal. Não cria empréstimos avulsos nem expõe edição/estorno pelo histórico somente leitura.

## Verificação

Os testes usam dados fictícios e serviços simulados, sem baixas ou cadastros de produção:

- Build Vite.
- Regressões de valores, resultado, quantidade, filtros de estoque e integração de venda em lote.
- UI de todas as abas e bloqueios de encerramento/quantidade.
- Financeiro: isolamento, aberto/quitado, navegação/foco, histórico, atualização e falha de atualização.
- Modal de recebimento real com RPC simulada: juros-only, cancelamento, falha, repetição com mesma chave e envio em andamento.
- PostgreSQL/WASM isolado: migrations e baixas de lote, juros, parcial, desconto e replay.
- Chromium em 1440, 1024 e 390 px: 33 capturas, grade de quatro cards desktop, tela sem rolagem horizontal e navegação de ida/volta.

O TypeScript geral já contém erros anteriores nos cadastros, site público e funções Deno. A comparação de diagnósticos de fontes não encontrou novas ocorrências decorrentes desta alteração. O projeto não dispõe de script de lint.
