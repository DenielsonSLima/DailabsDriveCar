# Correção de recebíveis — 16/09/2026

A lista carregava dez registros, agrupava parte deles por venda e recalculava o número de páginas apenas com essa primeira página, tornando os demais títulos inacessíveis. O pedido também confundia composição de pagamento com dinheiro recebido e o parcelamento podia acrescentar um centavo ao total.

Registros de diagnóstico e reparos específicos de dados ficam fora do versionamento, em `scratch/`.

## Correções de aplicação

- Paginação utiliza a contagem total do banco, com ordenação estável. Cada título conserva seu próprio valor, vencimento e ação de baixa, inclusive cobranças adicionais.
- Quitação do pedido utiliza os títulos financeiros ativos da venda. Valores programados, títulos cancelados e empréstimos avulsos não contam como recebimento da venda.
- A confirmação mostra exatamente os lançamentos que a RPC irá faturar. Removido o seletor de condição que só alterava a prévia e era ignorado na gravação.
- Parcelas geradas em centavos, distribuindo o resto sem aumentar o total, a partir da data da venda.
- Datas civis são exibidas sem deslocamento de fuso. Atualizações financeiras notificam os detalhes da venda e invalidam os indicadores.

## Validação

`node scripts/test-receivables.mjs` verifica cálculos e renderização dos componentes com serviços simulados: divisão de R$ 20.000 em três parcelas, cobrança única em 60 dias, datas no fuso America/Maceio, quitação em 50%, descontos, exclusão de cancelados/empréstimos da quitação, confirmação e navegação de 14 títulos em duas páginas.

`npm run build` gera a aplicação. A verificação TypeScript completa contém erros preexistentes em outros módulos; deve-se comparar os diagnósticos com HEAD para detectar regressões.

A conferência visual em navegador autenticado não foi concluída. Os componentes financeiros foram validados por renderização automatizada com serviços simulados.

## Barra lateral

Menu reduzido de 256 para 240 px, texto principal de 16 para 14 px e ícones de 24 para 20 px. Itens de 40 px no desktop e 44 px no mobile, rodapé compacto, foco por teclado e fechamento do menu mobile após navegação. A transformação persistente foi removida no desktop; estilos tipográficos permanecem restritos à barra lateral.
