# 🧠 Memória: Aprendizados de Supabase / Backend (NEXUS ERP)

## 🚀 Lições Aprendidas

### [2026-03-29] - Embedding Dimension do Gemini
- **Fato**: O modelo `text-embedding-004` (Google) gera vetores de **768 dimensões**.
- **Erro**: Criar a coluna vetorial no Postgres sem especificar a dimensão ou usar valor padrão errado.
- **Correção**: SQL `embedding vector(768)` no schema.
- **Prevenção**: Sempre validar a dimensão do modelo de embedding antes de aplicar a migração.

### [2026-03-29] - Multitenancy no RAG
- **Fato**: A busca semântica **DEVE** filtrar por `organization_id` mesmo em vetores semelhantes.
- **Implementação**: `match_rag_memory` com parâmetro `p_organization_id`.
- **Prevenção**: Vazamento de dados entre empresas é proibido por RLS e lógica de RPC.

### [2026-03-29] - Class Refactoring (RagService)
- **Erro**: Manter vírgulas entre métodos ao converter objeto para classe.
- **Correção**: Limpeza de sintaxe e exportação da instância da classe (`export const ragService = new RagService()`).
- **Prevenção**: Ao refatorar de objeto `{ ... }` para `class { ... }`, remover as vírgulas separators.
