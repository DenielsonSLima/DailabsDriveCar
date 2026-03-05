# Instruções para Criação de Tabelas no Supabase

Este documento serve como guia e referência para a criação de novas tabelas no banco de dados Supabase do projeto NEXUS ERP (HidrocarVeiculosERP).

## Como Criar Novas Tabelas no Supabase

As tabelas devem ser criadas utilizando migrations (arquivos SQL) para garantir o controle de versão e a reprodutibilidade do banco de dados. Evite criar tabelas diretamente pela interface web (Studio) em ambientes de produção.

### Padrões e Boas Práticas

1. **Nomenclatura**:
   - Utilize nomes no plural e em minúsculas (ex: `veiculos`, `clientes`).
   - Use `snake_case` para separar palavras (ex: `cad_modelos`, `fin_titulos`).
   - Prefixos indicam o módulo/domínio da tabela (ex: `cad_` para cadastros gerais, `fin_` para financeiro, `est_` para estoque, `cmp_` para compras, `venda_` para vendas).

2. **Colunas Padrão Obrigatórias**:
   Toda nova tabela deve conter as seguintes colunas de controle:
   - `id`: Tipo `UUID`, chave primária (`PRIMARY KEY`), valor padrão `gen_random_uuid()`.
   - `created_at`: Tipo `TIMESTAMP WITH TIME ZONE` (`timestamptz`), valor padrão `now()` ou `timezone('utc', now())`.
   - `updated_at`: Tipo `TIMESTAMP WITH TIME ZONE` (`timestamptz`), valor padrão `now()`.
   - `organization_id`: Tipo `UUID`, chave estrangeira para `organizations.id`, permitindo NULL mas obrigatório em consultas para isolamento de tenants (onde aplicável).
   - `user_id`: Tipo `UUID`, chave estrangeira para `auth.users.id`, permitindo auditoria de quem criou o registro, valor padrão `auth.uid()`.

3. **Row Level Security (RLS)**:
   - **Toda** tabela nova deve ter RLS habilitado: `ALTER TABLE sua_tabela ENABLE ROW LEVEL SECURITY;`.
   - Crie políticas (Policies) para controlar `SELECT`, `INSERT`, `UPDATE` e `DELETE` baseadas em `organization_id` ou `user_id` e nos perfis/roles (roles definidas na tabela `profiles`).

4. **Foreign Keys (Fks)**:
   - Sempre defina relacionamentos adequados e regras de exclusão/atualização se necessário (ex: `ON DELETE CASCADE` ou `ON DELETE RESTRICT`).

### Exemplo de Criação em SQL

```sql
CREATE TABLE public.minha_nova_tabela (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id),
    user_id UUID DEFAULT auth.uid() REFERENCES auth.users(id),
    nome TEXT NOT NULL,
    descricao TEXT,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- Ativar RLS
ALTER TABLE public.minha_nova_tabela ENABLE ROW LEVEL SECURITY;

-- Exemplo de Política RLS (Leitura)
CREATE POLICY "Permitir leitura membros da organizacao" 
ON public.minha_nova_tabela FOR SELECT 
USING (organization_id IN (
  SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
));
```

---

## 📋 Lista de Tabelas Existentes no Supabase

Abaixo está o registro atual (março de 2026) das tabelas existentes para referência:

**Administração e Usuários**
- `profiles`: Perfis de usuários.
- `organizations`: Inquilinos (Tenant) do sistema.
- `organization_members`: Vínculos de usuários a organizações.
- `audit_logs`: Logs de auditoria de alterações.

**Cadastros Básicos (`cad_`)**
- `parceiros`: Clientes e Fornecedores.
- `cad_corretores`: Corretores externos/parceiros.
- `cad_cidades`: Cidades e UFs.
- `config_empresa`: Dados fiscais/configuração da empresa base.
- `config_socios`: Sócios da empresa.
- `config_marca_dagua`: Configuração de marca d'água das fotos.
- `site_conteudo`: Dados para website/vitrine.

**Veículos Base (Domínios de Veículos)**
- `cad_montadoras`: Marcas/Montadoras (Fiat, Ford, etc).
- `cad_tipos_veiculos`: Tipos de carroceria (SUV, Hatch, etc).
- `cad_modelos`: Modelos genéricos vinculados a montadoras.
- `cad_versoes`: Versões específicas de um modelo.
- `cad_motorizacao`: Especificação de motores.
- `cad_transmissao`: Câmbio.
- `cad_combustivel`: Tipos de combustível.
- `cad_cores`: Catálogo de cores automotivas.
- `cad_caracteristicas`: Tags especiais como Único Dono.
- `cad_opcionais`: Acessórios do veículo.

**Estoque (`est_`)**
- `est_veiculos`: A frota real, os veículos no estoque e disponíveis.
- `est_veiculos_despesas`: Gastos inerentes a um veículo do estoque.
- `est_veiculos_despesas_pagamentos`: Quitações geradas pelas despesas.

**Compras e Vendas (`cmp_`, `venda_`)**
- `cmp_pedidos`: Ordens de compra de veículos.
- `cmp_pedidos_pagamentos`: Pagamentos das compras.
- `venda_pedidos`: Ordens de venda formalizadas.
- `venda_pedidos_pagamentos`: Recebimentos das vendas.

**Financeiro Cadastros Base**
- `fin_contas_bancarias`: Contas bancárias e caixas do ERP.
- `cad_formas_pagamento`: Cartão, PIX, Dinheiro, etc.
- `cad_condicoes_pagamento`: Modalidades de parcelamento/prazos (compras).
- `cad_condicoes_recebimento`: Modalidades de parcelamento/prazos (vendas).
- `fin_despesas_grupos`: Grupo macro de classificação.
- `fin_despesas_categorias`: Categoria filha das despesas.
- `fin_categorias`: Categorias contábeis em geral.

**Financeiro Movimentações (`fin_`)**
- `fin_titulos`: Contas a Pagar e a Receber e pendências em aberto.
- `fin_transacoes`: Lançamentos financeiros realizados (fluxo do caixa).
- `fin_transferencias`: Envios de dinheiro entre contas bancárias internas.
- `fin_retiradas`: Retiradas por sócios/distribuição.
