# Regra de Negócio: Criação de Veículos no Estoque

## Objetivo
Padronizar a forma como os veículos dão entrada no sistema, garantindo rastreabilidade financeira e controle de compras.

## Regra
- **É estritamente proibido** adicionar veículos avulsos diretamente pelo módulo de Estoque.
- **Todo e qualquer veículo** deve obrigatoriamente ser originado através do fechamento de um **Pedido de Compra**.
- A rota direta de criação de novos veículos no estoque (`/estoque/novo`) e o respectivo botão de atalho estão desativados/ocultos.
- Veículos órfãos (sem vínculo com o pedido de compra através da chave estrangeira de pedido) não são suportados.

## Fluxo Adequado
1. Acesse o módulo de **Pedidos de Compra**.
2. Crie um Novo Pedido.
3. No pedido de compra em questão, insira os dados do veículo a ser adquirido.
4. Ao aprovar/efetivar o pedido de compra, o veículo será listado no módulo de Estoque automaticamente, já atrelado a este pedido (rastreabilidade).
