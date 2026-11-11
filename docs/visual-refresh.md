# DriveCar: padronização visual

## Escopo e limites

Esta alteração é exclusivamente de apresentação: classes, espaçamento,
tipografia, superfícies, responsividade e atributos de acessibilidade.
Regras, rotas, permissões, dados, cálculos, integrações, serviços, handlers
e conteúdos de documentos/imagens exportados são preservados. Não há migração
nem operação no banco.

## Direção visual

A referência é a clareza dos painéis e formulários da Universo, especialmente
`modules/gestor/emissor-nfse/nfse.css` e os controles financeiros: superfícies
brancas, fundo slate, bordas discretas, raios de 8–12 px, tipografia moderada,
hierarquia legível e ações consistentes. A identidade DriveCar é preservada.

- Títulos e valores com peso 600; rótulos e ações com 500–600.
- Retirada de caixa-alta decorativa e espaçamento excessivo entre letras.
- Cartões com raios de 12–16 px e sombras discretas.
- Azul/indigo para interação; cores semânticas de status preservadas.
- Barra lateral escura em slate, com texto claro e seleção discreta, conforme
  revisão solicitada pelo usuário. As áreas de conteúdo permanecem claras.
- Ícones decorativos usam a mesma paleta neutra. Cores adicionais ficam
  restritas a alertas, estados, ações semânticas e legendas de gráficos.
- Controles com foco visível, áreas de toque e adaptação ao celular.
- Modais e barras de preview seguem a interface; o papel/documento e os
  canvases de marketing mantêm sua composição original.

## Arquitetura da alteração

Os componentes mantêm seus contratos e estrutura funcional. As classes são
alteradas no ponto de uso, sem substituir indiscriminadamente utilitários
Tailwind no CSS. `index.css` contém tokens e regras pequenas de acessibilidade,
opt-in por `data-drivecar-ui`, inclusive em portais. Conteúdos de impressão
`#print-content`, `#print-content-wrapper` e `data-drivecar-document` são
excluídos das regras de controles e foco.

## Verificação

O relatório de QA registra a comparação com o commit-base, os testes executados,
as telas visualizadas e os limites. Mudança de classe não é evidência de teste
funcional completo. A aprovação visual e o deploy de produção são etapas
separadas desta preparação.
