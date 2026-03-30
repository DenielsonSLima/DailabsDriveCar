---
name: rag-agent
description: >
  Habilita o agente a usar a Memória RAG (Retrieval-Augmented Generation) do sistema.
  Use esta skill sempre que precisar buscar informações contextuais sobre veículos, parceiros, 
  lançamentos financeiros ou histórico de negócios que não sejam triviais de encontrar via SQL comum.
  Esta skill permite buscas semânticas (linguagem natural) no banco de dados vetorial do Supabase.
---

# RAG Agent — Sistema de Memória Semântica Inteligente

Esta skill estende as capacidades do agente, permitindo que ele consulte a "memória de longo prazo" do NEXUS ERP. Em vez de apenas ler tabelas, o agente pode buscar por conceitos e contextos.

---

## PROTOCOLO DE BUSCA (Quando usar)

Sempre que o usuário fizer perguntas que exijam "lembrança" ou "contexto cruzado", siga este fluxo:

1. **Identifique a intenção**: O usuário quer saber algo sobre o passado, sobre um veículo específico ou um padrão de negócio?
2. **Gere o Termo de Busca**: Pense na frase que melhor descreve o que você procura.
3. **Execute a Busca Vetorial**: Utilize o MCP do Supabase para chamar a função RPC `match_rag_memory`.
4. **Sintetize a Resposta**: Use os fragmentos retornados para compor uma resposta rica e contextualizada.

---

## FERRAMENTA PRINCIPAL: `match_rag_memory` (RPC)

Para realizar a busca, você deve chamar a função RPC no Supabase com os seguintes parâmetros:

- `query_embedding`: O vetor gerado para a sua pergunta (Nota: se você não puder gerar o vetor diretamente, descreva a necessidade).
- `match_threshold`: Nível de similaridade (recomendado: 0.5 a 0.7).
- `match_count`: Quantidade de resultados (recomendado: 5 a 10).
- `p_organization_id`: O ID da organização atual (OBRIGATÓRIO para multitenancy).

### Exemplo de Chamada via MCP Supabase:
```sql
SELECT * FROM match_rag_memory(
  query_embedding := '[...vector...]', 
  match_threshold := 0.5, 
  match_count := 5,
  p_organization_id := 'id-da-org'
);
```

---

## ESTRUTURA DA MEMÓRIA (`rag_memory`)

Os dados estão indexados com os seguintes metadados:
- `source_table`: De onde veio o dado (`est_veiculos`, `parceiros`, `fin_titulos`).
- `source_id`: ID original do registro.
- `type`: Categoria (`vehicle`, `partner`, `transaction`).

---

## QUANDO ATUALIZAR A MEMÓRIA

Sempre que você, como agente, realizar uma alteração crítica (ex: vender um veículo de 1 milhão de reais, ou cadastrar um parceiro VIP), você deve sugerir ou executar a atualização da memória RAG usando o script `scripts/index-data.ts` ou o serviço `rag.service.ts`.

---

## REGRAS DE OURO

- **Privacidade**: Nunca busque ou exiba dados de uma `organization_id` diferente da atual.
- **Precisão**: A similaridade vetorial pode trazer resultados irrelevantes. Sempre valide os dados retornados antes de apresentá-los como verdade.
- **Contexto**: Use a memória RAG como complemento ao SQL tradicional, não como substituto para consultas exatas (IDs, valores exatos).
