# Hidrocar Veículos ERP — Contexto do Sistema

## O que é este projeto
Um ERP completo para gestão de revenda de veículos (seminovos), focado em controle de estoque, fluxo financeiro por sócio e pedidos de compra/venda.

## Stack tecnológica
- **Frontend**: React (Vite) + TypeScript
- **Backend/DB**: Supabase (Postgres, Edge Functions, RLS)
- **UI**: Tailwind CSS (ou Vanilla CSS com componentes customizados)
- **Estado**: TanStack Query

## Arquitetura e estrutura de pastas
- `/modules`: Contém a lógica de negócio separada por módulos (estoque, pedidos-venda, financeiro, etc).
- `/components`: Componentes globais de UI.
- `/services`: Serviços de integração (Supabase).
- `/lib`: Configurações de bibliotecas (supabase client, storage).

## Padrões e convenções adotadas
- **Nomenclatura**: PascalCase para componentes, camelCase para funções/variáveis, snake_case para campos do banco.
- **Financeiro**: Lógica crítica sendo movida para o banco via RPCs e Triggers para garantir atomicidade.

## Decisões técnicas importantes
- **Sincronização Versão -> Veículo**: Implementada trigger `trg_auto_populate_vehicle_version_data` para garantir que o veículo sempre tenha os dados técnicos da sua versão.

## Erros comuns — não repita
- **Dados Técnicos Vazios**: Nunca assumir que os campos `motorizacao`, `combustivel`, etc. no veículo estão preenchidos; sempre usar o fallback da `versao` se necessário.
