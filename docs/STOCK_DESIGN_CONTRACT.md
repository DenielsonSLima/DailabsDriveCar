# Padrão visual único: Estoque

Referência: Estoque em produção, commit 36bc9b4, e captura fornecida em 12/11/2026. Esta revisão não publica nem altera dados/regras. Estilos comuns vivem em index.css; componentes usam classes de papéis, não tamanhos distintos por módulo.

## Contrato

- `dc-page`: seções com 24 px de distância; sem padding duplicado do Layout.
- `dc-page-header`: título/descrição à esquerda, ação à direita, empilhados no celular.
- `dc-page-title`: 30/36 px desktop, 24/32 px celular, peso 700, slate-900.
- `dc-page-subtitle`: 14/20 px, slate-600, margem superior 4 px.
- `dc-kpi-grid`: 1 coluna móvel, 2 a partir de 640, 4 a partir de 1280; gap 12 px. Em 1024px usa duas colunas, preservando moeda inteira ao lado da sidebar de 240px. Não reservar cartões gigantes/alturas artificiais.
- `dc-kpi-card`: fundo branco, borda slate-200, raio 12 px, padding 14 px vertical/16 horizontal, sombra discreta, min-width 0, altura-base mínima 102px (expande para conteúdo longo). Sem fundo roxo/preto para KPI comum.
- `dc-kpi-label`: 13/18 px, peso 500, slate-600.
- `dc-kpi-value`: 20/28 px, peso 600, slate-900, numerais tabulares, margem superior 4 px. Sem truncamento monetário. Acento primário indigo-600, estados green/red quando semanticamente necessários.
- `dc-kpi-hint`: 13/18 px, slate-600, margem superior 4 px.
- `dc-panel`: branco, borda slate-200, raio 12 px, padding 16 px, sombra discreta.
- `dc-section-title`: 14/20 px, peso 600, slate-900, caixa normal.
- `dc-section-subtitle`: 13/18 px, slate-600.
- `dc-partners`: faixa horizontal, grade de 3 colunas a partir de 768, uma no celular, gap 16. Nome/valor na mesma linha com wrap quando necessário; progress 6 px, sem avatares gigantes. Mesmos cálculos e nomes completos acessíveis.
- `dc-tabs`: grupo compacto slate-100, padding 4, raio 16, gap 4, wrap, largura adequada ao conteúdo. `dc-tab`: 13/18 px peso 600, padding 10px 16px, raio 12. Ativo branco com indigo-600/sombra pequena. Reutilizar estados existentes.
- `dc-filterbar`: branco, borda slate-200, raio 12, padding 16, gap 12. Inputs 40px desktop / mínimo 44px móvel, fonte 14px/16px móvel.
- Botões padrão 40px desktop / mínimo 44px móvel, fonte 13px peso600, raio8/12 coerente. Ícones 16px; não transformar status em uma paleta decorativa.
- Modais: título 20/28px peso600; cabeçalho/corpo/rodapé padding16; raio16; corpo com rolagem e rodapé alcançável. Não apagar estrutura de dialogs, foco, escape, portais, handlers, permissões, disabled ou estado.
- Textos auxiliares mínimo12px, texto comum13/14px. Evitar font-weight800/900, uppercase e tracking largo na interface.

## Limites

Não mudar serviço, hook, SQL, cálculo, validação, dependência, autenticação ou dados. Não tocar site público, impressos/PDFs/conteúdo documental. Quatro cards por linha desktop nas listas de Entradas e Saídas. Sidebar permanece escura. Preservar controles e ações. Documentar inventário real por módulo e verificar componentes com fixtures sintéticas em desktop/tablet/mobile.

## Pedidos posteriores aplicados

Financeiro usa sete cartões em faixa horizontal e abas de linha única, com rolagem interna responsiva e valores18px. Home e login receberam composições próprias conforme pedido posterior, sem mudar handlers. Marketing foi removido do client-side, preservando dados e integrações. O fluxo inline de recebimento de Lotes inclui proteções frontend descritas em LOTES_RECEBIMENTO_INLINE.md, sem alterar serviços financeiros ou banco.
