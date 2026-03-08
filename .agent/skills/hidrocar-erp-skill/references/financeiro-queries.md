# Padrões de Query — Módulo Financeiro Hidrocar

## Regras Gerais de Filtragem

Toda query financeira deve sempre verificar:
1. `status != 'RASCUNHO'` — nunca incluir rascunhos em cálculos
2. Filtro de período (mês/ano de referência)
3. Identificador da empresa/tenant se aplicável

## Cálculos Críticos

### Lucro Bruto de uma Venda
```
lucro_bruto = valor_venda - (custo_compra + soma_servicos)
margem_percentual = (lucro_bruto / valor_venda) * 100
```

### Patrimônio Líquido
```
patrimonio_liquido = saldo_contas + ativos_estoque + contas_a_receber - contas_a_pagar
ativos_estoque = soma(custo_compra + servicos) de veículos com status != 'VENDIDO'
```

### Participação por Sócio (Estoque)
```
total_investido = soma de todos os ativos no estoque
participacao_socio = (veiculos_do_socio / total_veiculos) * total_investido
// ou conforme regra de negócio definida (% fixo de 33.3% entre 3 sócios)
```

### Ticket Médio
```
ticket_medio_venda = faturamento_bruto / quantidade_vendas
ticket_medio_compra = total_compras / quantidade_compras
```

### Saldo Disponível
```
saldo_disponivel = soma(saldo) de todas as contas bancárias ativas
```

## Armadilhas de Query

### ❌ Errado — Dupla contagem
```sql
-- Não somar compras pagas E contas a pagar quitadas separadamente
-- pode contar o mesmo pagamento duas vezes
```

### ✅ Correto — Usar flag de baixa
```sql
-- Usar campo de status do título: 'PENDENTE' | 'PAGO' | 'CANCELADO'
-- Saídas efetivas = contas_a_pagar WHERE status = 'PAGO'
-- Saídas pendentes = contas_a_pagar WHERE status = 'PENDENTE'
```

### Filtro de Período — Atenção à coluna de data
```
Para Performance do mês: usar data_venda ou data_compra
Para Contas a Pagar/Receber vencidas: usar data_vencimento
Para Histórico: usar data_lancamento ou data_criacao
```

## Relacionamentos Principais (inferidos)

```
veiculos
  ├── id, modelo, marca, placa, status
  ├── pedido_compra_id → pedidos_compra
  └── servicos[] → servicos_veiculo

pedidos_compra
  ├── id, status, valor_negociado, data
  ├── fornecedor_id → parceiros
  ├── socio_id → socios
  └── corretor_id → parceiros (corretores)

pedidos_venda
  ├── id, status, valor_venda, data
  ├── veiculo_id → veiculos
  ├── cliente_id → parceiros
  ├── socio_id → socios
  └── corretor_id → parceiros (corretores)

lancamentos_financeiros
  ├── tipo: ENTRADA | SAIDA | TRANSFERENCIA
  ├── categoria: VENDA | COMPRA | DESPESA_FIXA | DESPESA_VAR | RETIRADA | CREDITO
  ├── conta_id → contas_bancarias
  └── pedido_ref_id (opcional, liga ao pedido origem)

contas_bancarias
  └── id, nome, agencia, conta, saldo_atual, ativa
```
