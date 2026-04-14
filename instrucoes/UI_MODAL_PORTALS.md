# Solução para Modais e Overlays (React Portals)

Este documento explica como resolver o problema de modais ou overlays ("vidro") que não cobrem 100% da tela ou permitem cliques no fundo do sistema.

## O Problema
Em aplicações complexas, um elemento com `position: fixed` e `inset-0` pode não cobrir toda a tela se um de seus pais possuir propriedades CSS que criam um novo **contexto de empilhamento** (stacking context). 

Propriedades que causam isso:
- `transform` (ex: animações, transições)
- `filter` (ex: blur, brightness)
- `perspective`
- `clip-path`
- `opacity` (menor que 1)

Quando isso acontece, o elemento `fixed` torna-se relativo ao **pai** que criou o contexto, e não à janela do navegador (viewport), deixando vãos ou "buracos" onde o usuário pode interagir com o sistema por trás.

## A Solução: React Portals
A solução definitiva é renderizar o modal fora da hierarquia da página, anexando-o diretamente ao `document.body`. No React, isso é feito através de **Portals**.

### Implementação Passo a Passo

1. **Importação**:
   ```tsx
   import ReactDOM from 'react-dom';
   ```

2. **Estrutura do Componente**:
   O componente deve retornar o JSX envolvido por `createPortal`.

   ```tsx
   const MeuModal = ({ onClose }) => {
     // Evitar erro de SSR (Hydration) garantindo que está montado
     const [isMounted, setIsMounted] = React.useState(false);

     React.useEffect(() => {
       setIsMounted(true);
       // Travar o scroll do body para melhor UX
       document.body.style.overflow = 'hidden';
       return () => {
         document.body.style.overflow = 'unset';
       };
     }, []);

     if (!isMounted) return null;

     return ReactDOM.createPortal(
       <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center">
         <div 
           className="bg-white rounded-3xl p-8 shadow-2xl"
           onClick={(e) => e.stopPropagation()} // Evita fechar ao clicar no formulário
         >
           {/* Conteúdo do Formulário */}
         </div>
       </div>,
       document.body // Alvo do Portal
     );
   };
   ```

### Benefícios
- **Isolamento Total**: O overlay cobrirá 100% do navegador sem vãos.
- **Z-Index Seguro**: Como está no final do body, ele naturalmente fica acima de quase tudo, e um `z-[9999]` garante que nada o sobreponha.
- **Interação Bloqueada**: O usuário não consegue clicar em nada no fundo até fechar o modal.

## Exemplos no Projeto
- `ParceiroForm.tsx`: Implementado para resolver o gap no topo.
- `ConfirmModal.tsx`: Utilizado para modais de exclusão e avisos.
