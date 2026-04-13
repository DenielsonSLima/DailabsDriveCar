# Guia de Operação NEXUS ERP - Hidrocar Veículos

Este guia descreve os processos fundamentais do sistema para orientação do usuário.

## 1. Cadastros de Parceiros e Sócios
- **Onde**: Menu Lateral > Cadastros > Parceiros.
*   **Como fazer**: Clique em "Novo Parceiro". Preencha o Nome/Razão Social, Documento (CPF/CNPJ) e o Tipo (Cliente, Fornecedor ou Sócio).
*   **Importante**: Sócios devem ser cadastrados como parceiros com a marcação correta para que apareçam nos rateios de lucro.

## 2. Contas Bancárias e Caixa
- **Onde**: Ajustes > Contas Bancárias.
*   **Como fazer**: Clique em "Nova Conta". Selecione o banco (ou "Dinheiro/Cofre" para caixa físico), defina o titular e se a conta permite saldo negativo.
*   **Uso**: Estas contas serão usadas para pagar despesas de veículos e receber valores de vendas.

## 3. Cadastro de Veículos e Pedidos de Compra (FLUXO OBRIGATÓRIO)
O sistema segue uma lógica rígida para garantir a integridade financeira:
1.  **Criação do Pedido**: Vá em "Pedidos de Compra" > "Novo Pedido". Selecione o Fornecedor.
2.  **Adicionar Veículo**: Dentro do pedido de compra, adicione os veículos que estão sendo adquiridos.
3.  **Financeiro da Compra**: Defina como a compra será paga (à vista, financiado, etc).
4.  **Ativação no Estoque**: O veículo só aparece oficialmente no estoque após a **Confirmação do Pedido de Compra**. Antes disso, ele fica em estado de rascunho.
*   **Resumo**: Para cadastrar um veículo, você deve obrigatoriamente criar o pedido de compra primeiro.

## 4. Gestão de Estoque
- **Onde**: Menu Lateral > Estoque.
*   **Ações**: Aqui você pode adicionar fotos, gerenciar opcionais e, principalmente, **lançar despesas** (lavagem, mecânica, etc).
*   **Despesas**: Cada despesa lançada num veículo abate o lucro final da venda daquele veículo.

## 5. Pedidos de Venda e Lucro
- **Onde**: Menu Lateral > Pedidos de Venda.
*   **Como fazer**: Clique em "Novo Pedido". Selecione o Cliente e o Veículo do estoque.
*   **Negociação**: Informe o valor de venda e os sócios participantes.
*   **Resultado**: O sistema calcula o lucro líquido subtraindo: (Valor da Venda - Valor da Compra - Despesas do Veículo - Comissões).

## 6. Financeiro (Contas a Pagar/Receber)
- **Onde**: Menu Lateral > Financeiro.
*   **Contas a Pagar**: Geradas automaticamente por compras e despesas de veículos.
*   **Contas a Receber**: Geradas automaticamente por vendas.
*   **Baixa**: Ao realizar um pagamento ou recebimento, dê a "Baixa" informando qual Conta Bancária foi utilizada.
