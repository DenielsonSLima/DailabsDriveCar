# Recebimento do lote na própria tela

## Entrega

- Financeiro do lote: card do cliente abre detalhe com Voltar ao financeiro e ação superior verde **Baixar título**.
- Baixa na página, sem sobreposição: reutiliza ModalBaixa com `presentation="inline"`; os demais módulos continuam no modo modal padrão.
- Histórico visível no detalhe, somente leitura, incluindo data, tipo, valor, banco, agência e conta. Referência e documento do cliente ficam em Dados do título expansível quando disponíveis.
- Seleção e abertura da baixa ficam nos parâmetros `recebimento`/`acao`. Voltar/Avançar, cancelamento e reload não registram operações. Trocar a aba do lote limpa os parâmetros de recebimento.
- Nenhum serviço, RPC, SQL, cálculo de saldo ou regra financeira alterado. Datas UTC do formulário legado preservadas; a apresentação inline inicia e limita a seleção na data civil local, como os formulários de Lotes. Registros históricos não são convertidos. Baixa parcial, juros e desconto seguem o backend existente.

## Proteções

Trava síncrona contra submissão repetida, controles desabilitados durante envio, tratamento de erro ao carregar opções e retry. Validação adicional no modo inline impede valores negativos/não finitos ou superiores ao saldo ajustado; o backend permanece a autoridade. Após sucesso, saldo não atualizado impede nova baixa. Formulário só aparece com permissão `canCreate` e título pendente. Os identificadores são sempre resolvidos dentro dos recebíveis válidos do lote atual.

## Evidências locais

- Build Vite passou.
- `test-lotes-financeiro.mjs`: isolamento, saldo, navegação por URL/Voltar/Avançar, cancelamento e falha/recuperação de atualização do saldo.
- `test-lotes-financeiro-modal.mjs`: componente e serviço reais com transporte RPC fictício; juros-only, erro/retry com a mesma chave idempotente, um envio por vez, dados adicionais, histórico readonly e permissão.
- `test-modal-baixa-inline-compat.mjs`: RECEBER/PAGAR legados, data UTC e explícita, parcial, juros/desconto, desconto integral, cancelamento, erro, duplo submit no mesmo tick; erro/retry de opções e bloqueio de excesso no inline.
- `test-lotes-ui.mjs`: regressões de abas, formulários, bloqueios e cálculos existentes passaram.
- 18 capturas locais em 1440/1024/390 com Inter local e locale pt-BR: detalhe, dados, baixa, ações, histórico e lista. Zero erro JS, overflow de página, chamada de baixa ou requisição externa. Browser real verificou Voltar/Avançar/reload/cancelamento; capturas mobile e desktop inspecionadas.
- Typecheck restrito às fontes (`allowJs=false`, excluindo scratch/dist/node_modules): 36 diagnósticos preexistentes idênticos à base36bc9b4; zero diagnóstico novo. Não é typecheck verde.

## Limites

Dados inteiramente fictícios. Sem baixa real, escrita remota ou publicação. QA do componente foi isolado do shell, cuja integração deve ser revisada no pacote final. Browser não comprovou todos os valores monetários extremos ou permissões de todos perfis; testes de transporte não substituem validação autenticada de produção.

## Correção de concorrência após revisão

O estado pendente agora é por ID de título, fora da instância do formulário. Voltar, mudar de título/aba ou remontar não libera nova intenção de pagamento, mesmo que os valores sejam alterados. Um callback de uma seleção antiga apenas atualiza dados: não reabre aba nem título abandonado. Após sucesso, snapshot financeiro antigo permanece bloqueado até chegar um snapshot realmente diferente; trocar apenas a identidade do objeto não libera o formulário. Modal legado também reconhece o novo snapshot.

`test-lote-payment-remount.mjs` cobre RPC deferida, payload alterado em nova instância, troca de título e desmontagem completa da aba, resposta tardia sem redirecionamento, falha na atualização e recuperação posterior. A compatibilidade inclui fronteira de data: 12/11 01:30 UTC equivale a 11/11 22:30 no fuso de Maceió, mantendo 12/11 no legado e 11/11 no inline. Essa correção foi validada por DOM local e revisão estática. Na integração 20d55bc, o build e as 11 regressões passaram; as 18 capturas inline foram repetidas com zero erros/chamadas de escrita. A pendência de submissão foi exercitada no teste DOM deferido, não no navegador.
