# Separação de recebíveis dos lotes

## Escopo

Correção funcional independente do redesign visual. A lista **Financeiro → Contas a Receber** deve mostrar somente títulos sem vínculo a lote. Contas de vendas de motos em lote continuam em **Lotes → lote → Saída**.

O critério é `fin_titulos.lote_id IS NULL`, não o tipo/modelo do veículo. Assim, uma moto vendida individualmente continua no Financeiro normal. O filtro acontece antes da contagem e paginação e vale nas abas Em Aberto, Pagos e Todos, inclusive com busca e demais filtros.

Os três KPIs da tela usam o mesmo recorte sem lotes. A fórmula anterior, os estados considerados, o tratamento de descontos/nulos e a restrição por empresa permanecem iguais. Não foram alterados Contas a Pagar, extrato, caixa, patrimônio, outros créditos ou indicadores gerais.

## Dados preservados

- Nenhum título, transação, pagamento, saldo ou histórico é apagado ou recalculado.
- A migration substitui somente a consulta da RPC `rpc_kpi_contas_receber` e mantém suas permissões e modo de execução.
- `get_lote_detalhes`, os totais de cada lote e as ações de baixa do lote não mudam.

Diagnóstico remoto somente de leitura confirmou que os recebíveis vinculados a lotes estão identificados por `lote_id`. O filtro retira esses títulos da lista financeira normal e os preserva integralmente nos controles dos lotes. Contagens operacionais reais não fazem parte deste relatório público.

## Publicação

Publicar o frontend e aplicar `supabase/migrations/20261111180509_separar_recebiveis_lotes.sql` na mesma janela para evitar divergência temporária entre lista e KPIs. A migration foi gerada pelo CLI em modo local. A implementação e os testes não aplicaram mudanças ao banco remoto.

Antes de aplicar, conferir se a RPC não sofreu mudança concorrente. MD5 de `pg_get_functiondef('public.rpc_kpi_contas_receber()'::regprocedure)` no diagnóstico: `3e79f8d6c85ec7785c916c0ce2683ed5`. Após aplicar, verificar a definição com `lote_id IS NULL`, o funcionamento da lista e a permanência das contas dentro do lote. Recuo consiste em retirar apenas esse predicado da lista e da RPC, sem qualquer reversão de dados.

## Testes

- `node scripts/test-receivables-lotes.mjs`: cliente PostgREST real com respostas locais; dados mistos normais/lotes, 3 abas, 2 páginas, busca, categoria, status, datas, filtros combinados, resultado vazio, moto avulsa, rota de detalhes de lote e ausência de escritas.
- `PGLITE_MODULE_PATH=... node --max-old-space-size=256 scripts/test-receivables-lotes-sql.mjs`: PostgreSQL/WASM isolado com dados sintéticos; aplica a migration, verifica os três KPIs, estados, descontos/nulos, empresa diferente/ausente, preservação de permissões/dados e reaplicação.
- Regressões existentes aprovadas: `test-receivables`, `test-lotes-values`, `test-lotes-ui`, `test-lotes-service` e `test-venda-lote-integration`.
- Build aprovado com `NODE_OPTIONS=--max-old-space-size=512 npm run build`.
- Comparação TypeScript com configs temporárias idênticas excluindo apenas `node_modules`, `scratch` e `dist`: 36 diagnósticos preexistentes, iguais à base `82d5ffd`, sem diferença após normalizar os caminhos. Não é um typecheck verde. O comando global, incluindo os bundles gerados, esgotou a memória; a exclusão reduz em um diagnóstico o conjunto histórico de 37 erros.

Tentativas iniciais de execução concorrente/sem limite de heap foram encerradas por memória e repetidas serialmente. Os testes de SQL não acessam produção. Não foi feita baixa, exclusão, faturamento ou alteração financeira real para validar esta correção.

O teste de paridade visual continua referente ao commit do redesign anterior a esta correção. Sua regra não foi ampliada para ocultar a mudança funcional autorizada do filtro.
