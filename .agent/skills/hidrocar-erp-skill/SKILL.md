---
name: hidrocar-erp
description: >
  Skill especializada para desenvolvimento, debug e manutenção do ERP Hidrocar Veículos (Dailabs).
  Use esta skill SEMPRE que o usuário mencionar: bug no financeiro, pedido de compra, pedido de venda,
  fluxo de caixa, comissões, estoque de veículos, patrimônio por sócio, espelho financeiro, caixa PDV,
  contas a pagar/receber, despesas, relatórios do sistema, ou qualquer módulo do ERP Hidrocar.
  Também use quando o usuário falar "quebrou o financeiro", "tá errado o saldo", "bug na venda",
  "não bate o patrimônio", "corretor errado", "comissão incorreta", ou qualquer correção de lógica
  de negócio do sistema de gestão de veículos.
---

# Skill: Hidrocar ERP — Debug & Desenvolvimento

## Visão Geral do Sistema

**Produto**: ERP para revenda de veículos  
**Stack**: Next.js / React, Vercel (deploy), Supabase (banco de dados PostgreSQL)  
**Empresa cliente**: Hidrocar Veículos  
**Desenvolvedor**: Dailabs — Creative AI & Softwares  
**URL**: `hidrocar-veiculos-erp.vercel.app`

---

## Arquitetura de Módulos

```
ERP HIDROCAR
├── Início (Dashboard KPI)
├── Parceiros (Clientes, Fornecedores, Corretores)
├── Cadastros (Marcas, Modelos, Configurações)
├── Estoque (Inventário de veículos no pátio)
├── Pedidos Compra (Aquisição de veículos)
├── Pedidos Venda (Saída de veículos)
├── Caixa PDV → Fluxo de Caixa & Patrimônio
├── Financeiro (Dashboard financeiro completo)
├── Performance (Visão gerencial do mês)
├── Relatórios (Central de extração)
├── Editor Site
└── Ajustes
```

---

## ❤️ O Coração do Sistema: Fluxo Financeiro

> **REGRA DE OURO**: Qualquer alteração no financeiro pode impactar múltiplos módulos em cascata. Sempre rastrear o fluxo completo antes de corrigir.

### Fluxo Principal de Dados

```
PEDIDO DE COMPRA
    ↓ efetivado
ESTOQUE (veículo entra no pátio)
    ↓ custo registrado por sócio
PATRIMÔNIO POR SÓCIO (exposição de capital)
    ↓ venda realizada
PEDIDO DE VENDA
    ↓ gera
CONTAS A RECEBER + LUCRO BRUTO
    ↓ baixa financeira
FINANCEIRO (entradas/saídas/saldo)
    ↓ consolidado em
CAIXA PDV / FLUXO DE CAIXA & PATRIMÔNIO
    ↓ reflete em
PERFORMANCE + RELATÓRIOS
```

### Espelhos Críticos (onde costumam aparecer bugs)

| Origem | Espelha em | Campo crítico |
|--------|-----------|---------------|
| Pedido Compra | Estoque | custo_total, serviços adicionados |
| Pedido Compra | Financeiro (saídas) | valor pago, contas a pagar |
| Pedido Venda | Financeiro (entradas) | valor recebido, contas a receber |
| Pedido Venda | Lucro Bruto | receita - custo - serviços |
| Ambos | Patrimônio por Sócio | divisão % entre sócios |
| Ambos | Performance | KPIs do mês atual |

---

## Sócios e Participação

O sistema possui **3 sócios** com participação igualitária:
- **Klecio Guimaraes** — 33.3% do estoque/lucro
- **Newton Porto Neto** — 33.3% do estoque/lucro  
- **Yuri Porto** — 33.3% do estoque/lucro

> ⚠️ Bugs comuns: Participação não sendo recalculada após nova compra/venda; sócio aparecer com % errado quando veículo tem múltiplos ativos.

---

## Módulos em Detalhe

### 📦 Estoque
- Veículos com status: `DISPONÍVEL`, `EM PREPARAÇÃO`, `VENDIDO`
- Cada veículo tem: custo de compra + serviços agregados = custo total do ativo
- Agrupamentos: por MARCA, TIPO, lista geral
- Participação por sócio é calculada sobre o total investido no estoque

### 🛒 Pedidos de Compra — Dossiê de Aquisição
- Status: `RASCUNHO` → `EFETIVADO` (botão "CONCLUÍDO")
- Campos: Fornecedor (Parceiro), Intermediação (corretor), data contrato
- **Composição Societária do Investimento**: mostra os 3 sócios com Aporte individual (valor_total / 3), Lucro Est. e Margem Ref.
- **Composição do Pagamento** (seção crítica):
  - `Custo do Veículo` — valor base
  - `Total Lançado (Negociado)` — valor acordado
  - `Total Pago (Real)` — soma das baixas efetivas
  - `Quitação Confirmada` — valor confirmado manualmente
  - Barra de progresso: `Cobertura do Contrato (Programado)` e `Quitação Financeira Real`
  - Tabela de parcelas: Data | Vencimento | Forma/Condição (PIX, PRAZO, etc.) | Conta (ex: CAIXA) | Valor
- **⭐ Espelho Financeiro (Títulos & Baixas)**: painel em tempo real do Contas a Pagar
  - Mostra o título gerado: ex. "PAGAMENTO DE COMPRA - PEDIDO #60"
  - Exibe `Valor Total` vs `Valor Pago`
  - `Histórico de Baixas`: data, conta, valor de cada pagamento realizado
- Ao efetivar: veículo entra no estoque + gera título em **Contas a Pagar** no Financeiro

### 💰 Pedidos de Venda — Detalhe
- Status: `RASCUNHO` → `FATURADA` → `VENDA CONCLUÍDA`
- Campos: Destino/Comprador, Responsável Venda (executivo de negócios)
- **Divisão de Capital e Retorno por Investidor** (3 sócios):
  - `Capital Investido` por sócio (custo proporcional do veículo)
  - `Lucro Proporcional (Bolso)` por sócio
  - `Margem Real %` por sócio
  - Cota de participação: 33.33% cada
- **Composição do Recebimento** (seção crítica):
  - `Data da Venda`, `Forma Principal` (PIX, PRAZO, etc.), `Valor Total Negociado`
  - `Progresso da Quitação`: barra mostrando total recebido vs total negociado
  - Tabela de parcelas: Data | Vencimento | Condição de Recebimento | Conta de Destino | Valor
  - Parcelas podem ter: vencimento imediato (PIX) + vencimento futuro (PRAZO, "Não Vinculada")
- KPIs gerados: Faturamento Bruto (VGV), Custo Total dos Ativos, Lucro Bruto, Margem %
- **Participação por sócio**: divisão real do lucro bruto no período
- Ao concluir: gera título em **Contas a Receber** no Financeiro

### 🏦 Financeiro — Abas Detalhadas

**Dashboard** — Saldo disponível, Compra de Veículos, Despesas Fixas, Despesas Variáveis, Outras Receitas, Retiradas. Seções: Disponibilidade por Carteira, Atenção Prioritária (contas atrasadas/vencendo hoje).

**Contas a Pagar** — `Agenda de Compromissos Financeiros e Liquidação de Pedidos`
- KPIs: Total a Liquidar, Vencendo Hoje, Total em Atraso
- Filtros: Período de Vencimento, Plano de Contas, Situação
- Cards: status (PENDENTE/PAGO), Vencimento, Veículo vinculado, Favorecido/Descrição, Ref. Pedido (ex: "Ref: PED #57"), Valor do Título
- ⚠️ **Origem**: gerado automaticamente ao efetivar Pedido de Compra

**Contas a Receber** — `Gestão de Fluxo de Caixa e Entradas de Faturamento`
- KPIs: Total a Receber, Recebendo Hoje, Total em Atraso
- Filtros: Período de Vencimento, Categoria
- Cards: status (PENDENTE), Vencimento, Veículo vinculado, Cliente
- ⚠️ **Origem**: gerado automaticamente ao concluir Pedido de Venda (cada parcela = 1 título)

**Despesas Variáveis** — `Gestão de Gastos Operacionais e Eventuais`
- KPIs: Total a Pagar, Vencendo Hoje, Total em Atraso
- Filtros: Categoria, Agrupar por (Lista/Mês/Categoria)
- Ação: "+ Lançar Despesa"

**Despesas Fixas** — `Custos Recorrentes e Manutenção Estrutural`
- KPIs: Total a Pagar, Vencendo Hoje, Total em Atraso
- Filtros: Plano de Contas, Organizar por (Lista/Mês/Categoria)
- Ação: "+ Lançar Custo Fixo"

**Outros Créditos** — `Aportes, Rendimentos e Entradas Extraordinárias`
- KPIs: Total Creditado, Previsto (em aberto), Atrasados
- ⚠️ **Importante**: veículos com parcelas de venda a prazo "Não Vinculada" podem aparecer aqui como PENDENTE — ex: Comander, Cronos, Ford Ka, Onix com vencimento futuro e "Conta a Definir"
- Ação: "+ Lançar Crédito"

**Retiradas** — Pro-labore dos sócios

**Transferências entre Contas** — Movimentações internas entre carteiras bancárias

**Histórico Geral** — Todos os lançamentos consolidados

### 📊 Caixa PDV — Fluxo de Caixa & Patrimônio
Consolidação máxima do sistema:
- **Patrimônio Líquido** = Saldo + Ativos (Estoque) + Contas a Receber - Contas a Pagar
- **Vendas (valor recebido)** = Outras Receitas no financeiro
- **Exposição & Retorno por Sócio**: capital no pátio vs lucro realizado no mês
- **Saldos Individuais** por conta bancária

### 📈 Performance
- Visão do mês atual vs outros meses
- KPIs: Vendas, Compras, Lucro Bruto, Ticket Médio, Entradas, Saídas, A Receber, A Pagar
- Saldo Total Contas, Despesas Veículos, Retiradas Sócios
- Detalhamento: Vendas Realizadas, Compras Realizadas

### 📋 Relatórios
Categorias:
- **Comercial & Vendas**: Vendas Detalhadas, Relatório de Comissões
- **Operacional & Estoque**: Posição de Estoque, Gastos com Serviços

---

## ⭐ Espelho Financeiro — Como Funciona

Este é o mecanismo central que causa a maioria dos bugs. Entender este fluxo é essencial.

### Pedido de Compra → Financeiro

```
PEDIDO COMPRA efetivado
    ↓ cria automaticamente
TÍTULO em Contas a Pagar
    - Descrição: "PAGAMENTO DE COMPRA - PEDIDO #XX"
    - Valor: Total Lançado (Negociado)
    - Vencimento: conforme parcelas da Composição do Pagamento
    - Status inicial: PENDENTE
    ↓ ao baixar o título
HISTÓRICO DE BAIXAS no pedido
    - Data da baixa, conta bancária usada, valor
    - Atualiza "Total Pago (Real)" e "Quitação Confirmada"
    - Saldo da conta bancária é debitado
```

### Pedido de Venda → Financeiro

```
PEDIDO VENDA concluído (Venda Concluída)
    ↓ cada parcela da Composição do Recebimento cria
TÍTULO em Contas a Receber (se conta vinculada) 
    OU
TÍTULO em Outros Créditos (se "Não Vinculada" / conta a definir)
    - Valor: valor da parcela
    - Vencimento: data de vencimento da parcela
    - Status inicial: PENDENTE
    ↓ ao receber/baixar o título
Saldo da conta bancária é creditado
Progresso da Quitação é atualizado no pedido
```

### Problemas Críticos do Espelho

| Sintoma | Causa provável | Onde verificar |
|---------|---------------|----------------|
| Contas a Pagar zerada mas compras foram feitas | Títulos não gerados ao efetivar pedido | Trigger de criação de título no POST do pedido |
| Saldo conta não bate | Baixa registrada sem debitar/creditar conta | Função de baixa financeira |
| "Total Pago" diverge do Histórico de Baixas | Cálculo usando campo errado | Soma do histórico vs campo cached |
| Parcela PRAZO não aparece em Contas a Receber | Conta "Não Vinculada" indo para Outros Créditos | Lógica de roteamento por tipo de parcela |
| Quitação 100% mas Contas a Receber ainda mostra pendente | Título não sendo marcado como PAGO após baixa total | Trigger de atualização de status |
| Valor errado no Contas a Pagar | Usando custo do veículo em vez do valor negociado | Campo fonte do título gerado |

---

### Antes de qualquer correção:

1. **Identificar o ponto de origem** do dado incorreto (qual tabela/função cria o valor?)
2. **Mapear todos os consumidores** desse dado (quais componentes/páginas o leem?)
3. **Verificar se há cache** ou estado local que pode estar desatualizado
4. **Testar isoladamente** antes de integrar

### Checklist de impacto por módulo:

```
Alterou lógica de Pedido Compra?
  ✓ Verificar Estoque (custo do ativo)
  ✓ Verificar Financeiro (saídas/contas a pagar)
  ✓ Verificar Patrimônio por Sócio
  ✓ Verificar Performance (compras do mês)
  ✓ Verificar Caixa PDV (patrimônio líquido)

Alterou lógica de Pedido Venda?
  ✓ Verificar Financeiro (entradas/contas a receber)
  ✓ Verificar Lucro Bruto e Margem
  ✓ Verificar Participação por Sócio
  ✓ Verificar Performance (vendas do mês)
  ✓ Verificar Relatório de Comissões
  ✓ Verificar Caixa PDV (vendas realizadas)

Alterou lógica de Saldo/Contas?
  ✓ Verificar Dashboard Financeiro
  ✓ Verificar Caixa PDV (saldo disponível)
  ✓ Verificar Performance (entradas/saídas)
  ✓ Verificar Atenção Prioritária (vencidos/hoje)
```

### Armadilhas conhecidas

1. **Dupla contabilização**: Um pagamento pode ser registrado tanto como "baixa de conta a pagar" quanto como "saída direta" — verificar se existe deduplicação
2. **Status de pedido**: Rascunhos NÃO devem entrar nos cálculos financeiros — sempre filtrar por status = `EFETIVADO` / `CONCLUÍDO` / `FATURADA`
3. **Data de referência**: Verificar se filtros de mês usam data de criação vs data de vencimento vs data de baixa
4. **Participação societária**: Capital investido por sócio = `valor_total_ativo / 3` — recalcular após qualquer CRUD
5. **Serviços adicionados**: Custo do ativo = compra + soma de serviços — nunca usar só o valor de compra
6. **Corretor vs Responsável Venda**: Corretor = intermediário externo (campo "Intermediação"); Responsável Venda = executivo/funcionário interno
7. **Parcelas "Não Vinculada"**: Venda a prazo sem conta destino definida vai para "Outros Créditos" com status PENDENTE — não some em Contas a Receber padrão
8. **Quitação Confirmada ≠ Total Pago**: São campos distintos — um é confirmação manual, outro é soma do histórico de baixas
9. **Espelho não atualiza**: Quando o título é criado mas o pedido não reflete a baixa, verificar se o update é bidirecional (título → pedido)
10. **"Outros Créditos" inflado**: Veículos com parcelas futuras aparecem como créditos previstos — não devem ser somados ao saldo disponível atual

---

## Padrão de Resposta para Bugs

Ao receber um relato de bug, sempre:

1. **Perguntar**: Em qual módulo aparece o sintoma? Qual o valor esperado vs o que está aparecendo?
2. **Rastrear**: Seguir o fluxo financeiro de ponta a ponta para o caso
3. **Propor**: A correção mais cirúrgica possível (menor surface area de mudança)
4. **Alertar**: Quais outros pontos podem ser afetados pela correção
5. **Sugerir teste**: Como validar que a correção funcionou sem quebrar o restante

---

## Contexto Técnico

- **Framework**: Next.js (App Router ou Pages — confirmar com o dev)
- **Deploy**: Vercel (produção em `hidrocar-veiculos-erp.vercel.app`)
- **Banco**: Supabase (PostgreSQL) — consultas via Supabase client
- **UI**: Componentes customizados com tema dark/light, ícones Lucide
- **Autenticação**: Sistema de acesso com roles (ADMIN, GESTOR, etc.)
- **Moeda**: BRL (Real Brasileiro), formato `R$ X.XXX,XX`

> 💡 Quando o usuário enviar código, sempre verificar se as queries ao banco estão filtrando corretamente por: empresa/tenant, status do pedido, período de referência, e se joins estão trazendo dados de serviços agregados.

---

## Referências Adicionais

- `references/financeiro-queries.md` — Padrões de query para módulo financeiro
- `references/fluxo-dados.md` — Diagrama detalhado de relacionamento entre tabelas
