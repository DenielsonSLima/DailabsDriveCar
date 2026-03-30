# 🧠 Memória: Aprendizados de Frontend (NEXUS ERP)

## 🚀 Lições Aprendidas

### [2026-03-29] - Erro de Variável Inexistente no Layout
- **Erro**: Uso de `isMenuOpen` em vez de `isMobileMenuOpen` no componente `Layout.tsx`.
- **Causa**: Distração ao referenciar as props do `MobileBottomNav`.
- **Correção**: Sincronizado o estado do layout com o componente de navegação mobile.
- **Prevenção**: Sempre verificar a aba de `props` do componente de destino antes de passar o estado do pai.

### [2026-03-29] - Estilos de Vidro (Glassmorphism)
- O padrão do NEXUS usa `backdrop-blur-xl` e `bg-white/90` para componentes flutuantes premium (ex: `AIAssistant`).
- O z-index do assistente deve ser `z-[100]` para ficar acima do sidebar e header.
