# 🧠 Memória: Aprendizados de Qualidade / QA (NEXUS ERP)

## 🚀 Lições Aprendidas (Bugs Detectados)

### [2026-03-29] - Inconsistência de State no Layout
- **Bug**: Erro `undefined` ao tentar abrir menu mobile por referência a variável errada.
- **Detecção**: Durante a injeção do `AIAssistant`, notou-se o typo no componente adjacente.
- **Validação**: Todo componente injetado no `Layout.tsx` deve ser testado em modo desktop e mobile.

### [2026-03-29] - Erro de Runtime no RagService
- **Bug**: Sintaxe inválida de classe (presença de vírgulas entre métodos).
- **Detecção**: Ocorreu ao tentar chamar o método `chatResponse` no frontend.
- **Validação**: Ao converter objetos literais para classes ES6, garantir que o transpilador não acuse erro de sintaxe.

### [2026-03-29] - Verificação de Dependências
- **Bug**: Módulo `react-markdown` e `lucide-react` não estavam no `package.json` original.
- **Ação**: Instalação obrigatória para evitar erros de import.
- **Prevenção**: Sempre rodar `npm list <pacote>` antes de codar uma nova UI.
