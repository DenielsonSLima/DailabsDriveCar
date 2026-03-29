# Hidrocar Veículos ERP — Contexto do Sistema

## O que é este projeto
Um ERP completo para gestão de revenda de veículos (seminovos), focado em controle de estoque, fluxo financeiro por sócio e pedidos de compra/venda.

## Stack tecnológica
- **Frontend**: React (Vite) + TypeScript
- **Backend/DB**: Supabase (Postgres, Edge Functions, RLS)
- **UI**: Tailwind CSS (ou Vanilla CSS com componentes customizados)
- **Estado**: TanStack Query / Zustand
- **IA/RAG**: Google Gemini (text-embedding-004 e gemini-1.5-flash) + Supabase Vector (`pgvector`).

## Arquitetura e estrutura de pastas
- `/modules`: Contém a lógica de negócio separada por módulos (estoque, pedidos-venda, financeiro, etc).
- `/components`: Componentes globais de UI (incluindo o assistente `AIAssistant.tsx`).
- `/services`: Serviços de integração (Supabase e `rag.service.ts`).
- `/scripts`: Scripts de manutenção e indexação de dados (`index-data.ts`).
- `/lib`: Configurações de bibliotecas (supabase client, storage).

## Memória RAG (Retrieval-Augmented Generation)
- **Tabela**: `public.rag_memory` com suporte a multitenancy (`organization_id`).
- **Busca**: Utiliza a função RPC `match_rag_memory` para busca por similaridade de cosseno.
- **Processamento**: O assistente Nexus AI contextualiza os dados recuperados usando o modelo Gemini 1.5 Flash.

## Governança de IA: Ecossistema Multi-Agente
Para garantir a máxima qualidade e produtividade, o projeto utiliza um sistema de 4 agentes especializados localizados em `.agent/agents/`:

1.  **Frontend Agent (`frontend-ai`)**: Especialista em React, Tailwind e UX. Mantém o design premium.
2.  **Supabase Agent (`supabase-ai`)**: Mestre em Postgres, SQL, RLS e Backend. Garante a integridade dos dados.
3.  **Quality Agent (`quality-ai`)**: Guardião da robustez. Focado em testes, QA e zero regressão.
4.  **Senior Agent (`senior-ai`)**: Arquiteto e orquestrador. Dá a palavra final e mantém a visão estratégica.

Cada agente possui um arquivo `MEMORY.md` onde registra aprendizados e evita a repetição de erros passados.

## Padrões e convenções adotadas
- **Nomenclatura**: PascalCase para componentes, camelCase para funções/variáveis, snake_case para campos do banco.
- **Financeiro**: Lógica crítica sendo movida para o banco via RPCs e Triggers para garantir atomicidade.

## Decisões técnicas importantes
- **Sincronização Versão -> Veículo**: Implementada trigger `trg_auto_populate_vehicle_version_data` para garantir que o veículo sempre tenha os dados técnicos da sua versão.

## Erros comuns — não repita
- **Dados Técnicos Vazios**: Nunca assumir que os campos `motorizacao`, `combustivel`, etc. no veículo estão preenchidos; sempre usar o fallback da `versao` se necessário.
