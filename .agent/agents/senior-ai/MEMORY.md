# 🧠 Memória: Visão Estratégica Senior (NEXUS ERP)

## 🏛️ Decisões de Arquitetura

### [2026-03-29] - Multitenancy RAG
- **Decisão**: A memória RAG deve ser isolada por `organization_id` no nível do banco (RLS) e da busca (RPC).
- **Racional**: Segurança de dados entre empresas é inegociável.
- **Implementação**: `match_rag_memory` com filtro `p_organization_id`.

### [2026-03-29] - Ecossistema Multi-Agente
- **Decisão**: Dividir as tarefas em personas especializadas (`Frontend`, `Supabase`, `Quality`, `Senior`).
- **Racional**: Aumentar a precisão das entregas e evitar que o "cérebro" da IA se sobrecarregue com contextos irrelevantes para a subtarefa atual.
- **Estrutura**: Localizado em `.agent/agents/`.

### [2026-03-29] - Inteligência Nexus AI
- **Decisão**: Usar Gemini 1.5 Flash para velocidade na interface de chat do ERP.
- **Racional**: O usuário final do ERP precisa de agilidade na resposta (sub 2 segundos).
- **Modelo de Embedding**: `text-embedding-004` (768 dimensões) para máxima fidelidade semântica.
