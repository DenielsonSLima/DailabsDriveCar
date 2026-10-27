# Ajustes de gestão de lotes por etapas

## 1. Rastreabilidade da operação — implementada e validada localmente

- Seleção explícita de unidades físicas na venda, com código, placa e chassi. A RPC valida lote, organização, disponibilidade e duplicação, sem baixar automaticamente outra unidade.
- Lista de unidades pesquisável por código/placa/chassi, filtro de situação e vínculo com venda/cliente.
- Parcela identificada por cliente, venda e vencimento na tabela, na baixa e no estorno.
- Formas independentes para sinal e saldo; custo, resultado e margem antes de confirmar a venda.

## 2. Correções financeiras — implementadas e testadas em PostgreSQL isolado

- Correção e cancelamento de despesa com motivo obrigatório e snapshots antes/depois. Uma despesa cancelada permanece no histórico, fora do custo ativo.
- Despesa paga exige estorno prévio das baixas antes de correção/cancelamento.
- Estorno conserva a transação original e cria compensação inversa única, com mesma conta e valor. As triggers financeiras existentes recalculam banco e título; não há exclusão silenciosa nem atualização manual de saldo.
- Devolução integral cancela parcelas, devolve somente o efetivamente recebido nas contas originais e retorna todas as unidades da venda ao estoque. Operação atômica e idempotente, com motivo e data.
- Histórico de movimentos em cada aba e de correções no Resumo.
- Fluxos de caixa preservam recebimentos e devoluções reais mesmo quando a venda/título é cancelado.

Limites: lote aberto, devolução integral, contas originais, respeito à configuração de saldo negativo. Ajustes financeiros legados de desconto/juros exigem conferência específica; não são tratados como dinheiro recebido nem reembolsados automaticamente.

## 3. Leitura gerencial — implementada e validada localmente

- Investimento total em destaque, separado em compra e despesas.
- Estoque, vendas, lucro atualizado e médias por unidade preservados; caixa continua separado do lucro.
- Retorno aos lotes preserva a aba na URL.

## Validação

Build passou. TypeScript mantém os erros anteriores fora dos arquivos alterados.

```sh
node scripts/test-lotes-management-ui.mjs
node scripts/test-lotes-ui.mjs --preview
node scripts/test-lotes-service.mjs
node scripts/test-lotes-values.mjs
node scripts/test-venda-lote-integration.mjs
node scripts/test-receivables.mjs
node scripts/test-estoque-search.mjs
PGLITE_MODULE_PATH=/tmp/drivecar-lotes-pglite/node_modules/@electric-sql/pglite/dist/index.js node scripts/test-lotes-correcoes-sql.mjs
```

Os testes SQL cobrem seleção específica e custo, centavos, correção, saldo, título, estorno original/compensação, devolução, participação dos sócios, repetição de requisição, rollback, organização, acesso anônimo e proteção contra ponteiro de estorno forjado. A prévia do navegador usa somente dados em memória e bloqueia importação do cliente Supabase real.

## Publicação pendente de autorização

O retorno de detalhes inclui gestao_versao: 2 após a migration. A interface mantém os novos lançamentos e correções desabilitados quando esse contrato ainda não está disponível, protegendo também a prévia da branch contra a seleção automática da RPC anterior.

A revisão automática rejeitou o deploy da migration `20261027014706_lotes_operacao_unidades_correcoes_financeiras.sql`, exigindo aprovação explícita para alterar tabelas, triggers e RPCs financeiras em produção. Foi confirmado que a tabela de histórico e a coluna de estorno ainda não existem no projeto remoto `hlmhlltmgwxlibklyrzc`.

Ordem necessária: autorizar e aplicar a migration, verificar esquema/permissões, então integrar esta branch à `main`. A interface nova depende do contrato de unidades explícitas; não publicar a interface contra a RPC antiga, que escolhe unidades automaticamente.
