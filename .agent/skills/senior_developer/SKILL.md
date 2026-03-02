---
name: senior_developer
description: Manual de Boas Práticas: O Guia Definitivo do Desenvolvedor Sênior - Autor Manus AI
---

# Manual de Boas Práticas: O Guia Definitivo do Desenvolvedor Sênior

**Autor:** Manus AI

## Prefácio

Este manual transcende a mera coleção de boas práticas; ele é um compêndio de princípios arquiteturais e diretrizes operacionais forjadas na experiência de construção de sistemas complexos e de missão crítica. Destinado a desenvolvedores seniores, líderes técnicos e arquitetos de software, este guia estabelece um padrão de excelência para a concepção, desenvolvimento e manutenção de aplicações robustas, escaláveis e seguras, com foco em ecossistemas modernos como React, TypeScript e Supabase.

Em um cenário onde a velocidade de entrega é crucial, mas a integridade e a segurança são inegociáveis, a adoção de uma arquitetura bem definida e de processos rigorosos torna-se a espinha dorsal do sucesso. Este documento detalha não apenas o que fazer, mas por que certas abordagens são preferíveis, fornecendo exemplos práticos, complementos técnicos e perguntas de revisão que estimulam o pensamento crítico e a autoavaliação contínua.

O objetivo final é capacitar o desenvolvedor sênior a atuar como um verdadeiro arquiteto de soluções, capaz de construir sistemas que não apenas atendam aos requisitos funcionais, mas que também sejam resilientes, seguros e eficientes a longo prazo.

---

## 1. Arquitetura de Frontend e Componentização: A Arte da Separação de Responsabilidades

A construção de interfaces de usuário modernas exige uma abordagem meticulosa para a organização do código. A arquitetura de frontend deve ser projetada para garantir que cada parte do sistema tenha uma responsabilidade clara e única, promovendo a manutenibilidade, a testabilidade e a escalabilidade. Este princípio, conhecido como Separação de Responsabilidades, é a pedra angular de qualquer sistema frontend robusto.

### 1.1. As Três Camadas Fundamentais do Frontend

Conforme as diretrizes estabelecidas, o frontend deve ser segmentado em três camadas distintas, cada uma com um propósito bem definido. Esta divisão não é meramente estética, mas funcional, prevenindo o acoplamento indesejado e facilitando a evolução do sistema.

| Camada | Localização Padrão | Responsabilidade Primária | Características Chave | Exemplos | Perguntas de Revisão |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Páginas (Pages)** | `src/modules/{modulo}/*.page.tsx` | Orquestrar o fluxo da aplicação, gerenciar o estado global e local da página, e coordenar a interação entre os componentes. São os "controladores" da interface. | Montam a tela, buscam dados via services e hooks, e passam as informações para os componentes filhos. Devem ser o mais "finas" possível em termos de lógica de apresentação. | `ClientesPage.tsx`, `DashboardPage.tsx` | 1. Esta página está gerenciando apenas o estado e o fluxo, ou está contendo lógica de apresentação complexa? 2. A lógica de busca de dados está desacoplada dos componentes visuais? 3. A página está agindo como um orquestrador ou está se tornando um "componente gigante"? 4. O estado da rota está sendo gerenciado de forma eficiente e sem acoplamento? 5. Há alguma lógica de negócio diretamente na página que deveria estar em um serviço ou hook? |
| **Componentes de Módulo** | `src/modules/{modulo}/components/` | Encapsular a lógica de negócio e a apresentação de uma funcionalidade específica dentro de um módulo. Interagem com o usuário e disparam eventos. | São componentes "inteligentes" que podem ter estado interno e lógica de interação. Devem ser reutilizáveis dentro do contexto do seu módulo. | `ClienteFormAdd.tsx`, `ProdutoCard.tsx`, `PedidoList.tsx` | 1. Este componente está focado em uma única funcionalidade? 2. Ele poderia ser reutilizado em outro lugar dentro do mesmo módulo? 3. A lógica de interação do usuário está bem encapsulada? 4. O componente está recebendo dados via props ou está buscando-os diretamente? 5. Ele está emitindo eventos de forma clara para a página orquestradora? |
| **Componentes de UI (Dumb Components)** | `src/lib/ui/` | Fornecer blocos de construção visuais reutilizáveis, sem qualquer lógica de negócio ou estado interno. São puramente apresentacionais. | Recebem todas as suas propriedades via props e emitem eventos. São os "átomos" da interface, garantindo consistência visual e facilidade de estilização. | `Botao.tsx`, `Input.tsx`, `Modal.tsx`, `Spinner.tsx` | 1. Este componente é realmente "burro"? 2. Ele possui alguma dependência de estado global ou lógica de negócio? 3. Seu estilo é facilmente sobrescrevível via props ou classes CSS? 4. Ele é genérico o suficiente para ser usado em qualquer parte da aplicação? 5. Há alguma lógica de apresentação complexa que deveria ser movida para um componente de módulo? |

### 1.2. Regras de Ouro para Componentização Granular

Para garantir a manutenibilidade e a escalabilidade, a modularização deve ser levada ao extremo, especialmente em módulos complexos como "Pedido de Compra" ou "Parceiro". Cada funcionalidade específica dentro de um módulo deve residir em seu próprio arquivo, mesmo que pareça pequena inicialmente. Isso facilita a leitura, o teste e a colaboração.

1.  **Componentes não fazem chamadas de API:** Esta é uma regra fundamental. Componentes visuais devem ser consumidores de dados, não provedores. Eles devem receber todas as informações necessárias via props ou através de hooks customizados que abstraem a camada de acesso a dados. Isso garante que o componente seja independente da fonte de dados, facilitando testes e a reutilização. Por exemplo, um UserCard deve receber um objeto user como prop, e não ser responsável por buscar os dados do usuário do servidor.
    *   **Perguntas de Revisão:**
        1. Este componente está buscando dados diretamente do servidor ou via um serviço/hook abstrato?
        2. Ele poderia ser mais genérico se recebesse os dados via props?
        3. A dependência da fonte de dados está clara e isolada?
        4. Se a API mudar, este componente precisará ser alterado?
        5. A lógica de apresentação está misturada com a lógica de acesso a dados?

2.  **Separação Clara entre Páginas e Componentes:** As Páginas (.page.tsx) atuam como orquestradores. Elas são responsáveis por montar a tela, gerenciar o estado da rota, buscar os dados necessários (utilizando os services e hooks apropriados) e passar esses dados para os Componentes de Módulo que compõem a interface. Os Componentes de Módulo, por sua vez, focam na lógica de interação e apresentação de uma funcionalidade específica, sem se preocupar com a orquestração da página inteira.
    *   **Perguntas de Revisão:**
        1. A página está apenas orquestrando ou contém lógica de apresentação complexa?
        2. Os componentes de módulo estão focados em sua funcionalidade específica, sem se preocupar com a orquestração da página?
        3. A comunicação entre página e componentes está clara (props down, events up)?
        4. A página está delegando responsabilidades de forma eficaz?
        5. É fácil entender o fluxo de dados e interações entre a página e seus componentes?

3.  **Componentes de UI "Burros" (/ui):** A pasta src/lib/ui deve conter apenas componentes puramente visuais, sem qualquer lógica de negócio. Estes são os blocos de construção básicos, como botões, inputs, modais, tipografia, etc. Eles devem ser altamente reutilizáveis e configuráveis via props, garantindo a consistência do design system e facilitando a manutenção visual. A lógica de negócio ou o estado da aplicação não devem residir nesses componentes.
    *   **Perguntas de Revisão:**
        1. Este componente de UI é realmente "burro" (sem lógica de negócio ou estado interno)?
        2. Ele é genérico o suficiente para ser reutilizado em qualquer parte da aplicação?
        3. Todas as suas propriedades são configuráveis via props?
        4. Ele está aderindo ao design system da aplicação?
        5. Há alguma lógica de negócio que precisa ser extraída para um componente de módulo ou hook?

4.  **Modularização Exaustiva de Sub-funcionalidades:** Dentro de src/modules/{modulo}/components/, cada sub-funcionalidade deve ter seu próprio arquivo. Exemplos:
    *   **KPIs:** `src/modules/{modulo}/components/{Modulo}Kpis.tsx` (para exibir indicadores chave).
    *   **Filtros:** `src/modules/{modulo}/components/{Modulo}Filters.tsx` (para a lógica e UI de filtragem).
    *   **Listagens:** `src/modules/{modulo}/components/{Modulo}List.tsx` (para a tabela ou lista de itens).
    *   **Cards/Itens:** `src/modules/{modulo}/components/{Modulo}Card.tsx` (para a representação individual de um item).
    *   **Formulários de Adição:** `src/modules/{modulo}/components/{Modulo}FormAdd.tsx`.
    *   **Formulários de Edição:** `src/modules/{modulo}/components/{Modulo}FormEdit.tsx`.
    *   **Modais de Exclusão:** `src/modules/{modulo}/components/{Modulo}DeleteModal.tsx`.
    *   **Perguntas de Revisão:**
        1. Cada sub-funcionalidade dentro do módulo está em seu próprio arquivo?
        2. Há algum arquivo com múltiplas responsabilidades que poderia ser dividido?
        3. A granularidade atual facilita a leitura e o entendimento do código?
        4. A divisão em arquivos menores está promovendo a reutilização e a testabilidade?
        5. Esta estrutura modular está evitando arquivos gigantes e complexos?

### 1.3. Legibilidade e Acessibilidade da Interface

Um aspecto frequentemente negligenciado, mas crucial para a experiência do usuário e a conformidade com padrões de acessibilidade, é a legibilidade dos elementos da interface. Conforme a design_rules especificada:

> **INPUT_LEGIBILITY:** TODOS os campos de entrada de texto (inputs, textareas, etc.) DEVEM, por padrão, ter um fundo claro (ex: #FFFFFF) e cor de fonte escura (ex: #111827) para garantir a máxima legibilidade. Esta regra só pode ser quebrada se o usuário pedir explicitamente uma cor diferente.

### 1.4. Exemplo Prático de Componentização Granular

Considere um módulo de Pedidos de Compra:
- `src/modules/pedidos-compra/pedidos-compra.page.tsx`: Orquestrador.
- `src/modules/pedidos-compra/components/PedidoCompraKpis.tsx`: Métricas.
- `src/modules/pedidos-compra/components/PedidoCompraFilters.tsx`: Filtros.
- `src/modules/pedidos-compra/components/PedidoCompraList.tsx`: Lista.
- `src/modules/pedidos-compra/components/PedidoCompraCard.tsx`: Item individual.
- `src/modules/pedidos-compra/components/PedidoCompraFormAdd.tsx`: Formulário de adição.
- `src/lib/ui/Input.tsx`: Componente genérico.

---

## 2. Experiência do Usuário (UX) e Design de Interface (UI): Modernidade e Imersão

### 2.1. Princípios de UI Moderna e Abas Imersivas
- **Intuitivo:** Ações e resultados claros.
- **Imersivo:** Experiência de "aplicativo desktop" com transições suaves e layout limpo.
- **Feedback Visual Instantâneo:** Respostas rápidas a cada interação.

### 2.2. Gestão de Documentos: Preview e Download de PDFs
1. **Modelo de PDF Separado:** Cada tipo de documento tem seu modelo independente.
2. **Preview com Botão de Fechar/Baixar:** Abrir preview em modal com opções claras.
3. **Componente Reutilizável:** `PdfViewer.tsx` em `src/lib/ui/`.

---

## 3. A Camada de Serviço e Segurança: O Guardião do Backend (Edge Functions do Supabase)

### 3.1. Regras de Ouro para a Camada de Serviço
1. **Privilégios Mínimos:** `service_role` key NUNCA deve ser exposta no frontend.
2. **Abstração por Funcionalidade de Negócio:** Endpoints baseados em intenção de negócio (ex: `processar-pagamento`), não apenas CRUD.
3. **Validação Agressiva:** Uso de Zod para validar todas as entradas.

### 3.2. Exemplo Prático: Processamento de Pagamento
Uma Edge Function para `processar-pagamento` deve validar dados, verificar permissões, e executar múltiplas operações atômicas em uma transação SQL.

---

## 4. Banco de Dados: A Fonte da Verdade e o Guardião da Integridade (PostgreSQL)

### 4.1. O Princípio Mestre: A Separação dos Poderes Financeiros
- **O Futuro (As Promessas):** `financial_entries`.
- **O Presente (A Realidade):** `accounts`.
- **O Passado (A Verdade Imutável):** `financial_transactions`.

### 4.2. Tabelas Atômicas e o Livro-Razão Imutável
- `contas`: Armazena o saldo atual.
- `lancamentos`: Registro histórico imutável.

### 4.3. A Função de Negócio (Stored Procedures/RPC)
Encapsular lógica crítica em funções SQL com `SECURITY DEFINER` e validação interna de `auth.uid()`.

### 4.4. Regras de Ouro do Banco de Dados
1. **Saldo Sagrado:** Atualizado apenas via SQL/RPC.
2. **Histórico Imutável:** Nunca apague, apenas estorne.
3. **Atomicidade:** Sempre usar blocos `BEGIN...COMMIT`.

---

## 5. Multitenancy e Isolamento: A Regra de Ouro do SaaS

### 5.1. A Regra de Ouro: `organization_id`
Toda tabela que contém dados de um cliente DEVE ter uma coluna `organization_id`.

### 5.2. Row Level Security (RLS)
Uso obrigatório de RLS em todas as tabelas, com funções auxiliares como `is_member_of(p_org_id)`.

---

## 6. Performance, Cache e Realtime: Otimizando a Experiência do Usuário

### 6.1. O Modelo Correto: Cache + Revalidação (SWR)
Uso de TanStack Query para gerenciar cache e background refetch.

### 6.2. Realtime Seletivo
Assinar mudanças via WebSockets apenas em tabelas críticas, respeitando o RLS e filtrando por `organization_id`.

### 6.3. Otimização de Consultas
Índices adequados (especialmente compostos para multitenancy) e paginação em todas as listagens.

---

## 7. Tópicos Avançados para Produção: Robustez e Confiabilidade

### 7.1. Testes Automatizados
Unitários, integração, API e banco de dados.

### 7.2. Tratamento de Erros e Resiliência
Mensagens amigáveis no front, validação rigorosa no backend e exceções explícitas no banco.

---

## 8. Arquitetura Recomendada (PRO): O Modelo de um ERP Sério

### 8.1. Os Três Pilares Claras
- **Camada 1 - Banco de Dados:** Cérebro e fonte da verdade.
- **Camada 2 - Data Layer:** TanStack Query + Realtime.
- **Camada 3 - Estado Global (UI State):** Zustand para estado de interface leve.

---

## 9. Canonico: Regras de Comportamento e Arquitetura do Desenvolvedor Sênior

### 9.1. Role Definition
Especialista em React, TypeScript, Supabase e Clean Architecture. Executor preciso de tarefas literais.

### 9.2. Absolute Rules
1. **MINIMAL_SCOPE_MODIFICATION:** NUNCA modifique código fora do escopo explícito.
2. **NO_INTERPRETATION:** Execute apenas instruções explícitas.
3. **NO_ASSUMPTIONS:** Se não está no contexto, pergunte.
4. **IMMUTABLE_ARCHITECTURE:** A estrutura de pastas é sagrada.

### 9.3. Design Rules
- **INPUT_LEGIBILITY:** Fundo claro (#FFFFFF) e fonte escura (#111827) para inputs.

### 9.4. Architecture Definition
```
src/
 ├─ lib/
 │   └─ supabase.ts
 ├─ modules/
 │   ├─ {modulo}/
 │   │   ├─ components/
 │   │   ├─ {modulo}.page.tsx
 │   │   ├─ {modulo}.service.ts
 │   │   └─ {modulo}.types.ts
```

### 9.5. Supabase Rules
- Único cliente em `src/lib/supabase.ts`.
- Proibido acesso direto em `.tsx`.
- RLS OBRIGATÓRIO em todas as tabelas.

### 9.6. Regras de Governança de Código
1. **Limite de Linhas:** Máximo de 800 linhas por arquivo.
2. **Service por Módulo:** Cada módulo deve ter seu próprio `.service.ts`.

---

## 10. Otimizações Avançadas de Inicialização e Fluxo de Dados

### 10.1. Estratégia de Bootstrapping
Consolidação de dados essenciais em um único payload (RPC `bootstrap-data`).

### 10.2. Otimização de Payload Realtime
Filtros de coluna no PostgreSQL para trafegar apenas o necessário.

### 10.3. Resiliência de Conexão Realtime
Lidar com desconexões invalidando caches e usando sincronização otimista.

---

## 11. Boas Práticas Universais de Otimização e Arquitetura de Sistemas

1.  **Separação de Responsabilidades**
    *   Divida o sistema em camadas bem definidas (ex: apresentação, lógica de negócio, acesso a dados).
    *   Cada módulo, classe ou função deve ter uma única responsabilidade clara.
2.  **Evite Duplicidade de Lógica e Recursos**
    *   Não repita código (DRY: Don't Repeat Yourself).
    *   Centralize regras de negócio e utilitários comuns.
3.  **Gerenciamento Eficiente de Estado e Cache**
    *   Use ferramentas de cache centralizadas (ex: TanStack Query, Redux, SWR) para evitar múltiplas fontes de verdade.
    *   Defina políticas de atualização (staleTime, revalidação) de acordo com a frequência de mudança dos dados.
4.  **Reduza Recursos Desnecessários**
    *   Evite conexões, listeners ou subscrições duplicadas (ex: WebSocket, eventos).
    *   Compartilhe recursos entre módulos sempre que possível.
5.  **Invalidação e Atualização Inteligente**
    *   Invalide apenas o que realmente precisa ser atualizado.
    *   Evite cascatas de atualizações que podem gerar “tempestades” de requisições.
6.  **Debounce, Throttle e Rate Limit**
    *   Use debounce/throttle em eventos de alta frequência (ex: digitação, scroll, tab-switch) para evitar sobrecarga.
    *   Implemente rate limit em APIs para proteger o backend.
7.  **Padronização e Consistência**
    *   Centralize constantes, configurações e enums.
    *   Siga padrões de nomenclatura e estrutura de pastas.
8.  **Observabilidade e Monitoramento**
    *   Implemente logs, métricas e alertas para identificar gargalos e falhas rapidamente.
    *   Use ferramentas de APM (Application Performance Monitoring) quando possível.
9.  **Testabilidade e Manutenibilidade**
    *   Escreva testes automatizados (unitários, integração, e2e).
    *   Prefira código simples, modular e fácil de entender.
10. **Documentação e Checklist**
    *   Documente decisões arquiteturais e padrões adotados.
    *   Mantenha checklists de revisão para novos módulos/features.

---

## 12. Checklist Final do Desenvolvedor Sênior
- [ ] Estrutura correta?
- [ ] RLS testado?
- [ ] Lógica crítica no banco?
- [ ] Realtime limpo (`removeChannel`)?
- [ ] Cobertura de testes?
- [ ] Performance e paginação?


### 6. The Three Pillars of Finance Architecture
All financial movements (Payments, Receipts, Transfers) MUST atomically update three distinct data layers to ensure conciliation and auditability.

#### PILLAR 1: The Source Record / Intent (`fin_titulos`)
Every financial movement starts with an intent or a contract. 
- **Purpose**: Tracks what *should* happen or what *is scheduled* to happen.
- **Rules**: Must contain `status` (PENDENTE, PAGO, CANCELADO), `valor_total`, and `valor_pago`.

#### PILLAR 2: The Ledger / History (`fin_transacoes`)
The immutable record of money actually moving.
- **Purpose**: Audit trail and historical extracts.
- **Rules**: Once inserted, should NEVER be modified (only reversed via a counter-transaction). Must link to the Source Record (e.g., `titulo_id`) and the Wallet.

#### PILLAR 3: The Wallet / Balance (`fin_contas_bancarias`)
The current liquidity of the system.
- **Purpose**: Real-time balance checking.
- **Rules**: Must be updated ONLY via specialized SQL functions (RPC) or Triggers that simultaneously record the Ledger entry.

> [!IMPORTANT]
> **Data Integrity Rule**: Never update a bank balance without a corresponding entry in `fin_transacoes`. These operations must be wrapped in a single database transaction (PostgreSQL RPC).
