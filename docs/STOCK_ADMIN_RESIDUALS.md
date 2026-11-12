# Revisão administrativa: achados e resolução

## Estado atual

O manifesto `scripts/stock-admin-scenes.json` contém 33 cenas adicionais, após a remoção autorizada do módulo Marketing. A cobertura visual atual e histórica está separada em `STOCK_QA_COVERAGE.md`; o manifesto é um inventário, não prova que todas as cenas foram repetidas no último snapshot.

## Achados corrigidos no pacote

- EditorSite administrativo: painéis, títulos, botões e campos passaram ao contrato Estoque. Hero, Quem Somos e Contato foram renderizados novamente sem salvar.
- Oito páginas de Relatórios: controles e KPIs ajustados por atributos JSX, preservando handlers e dados. Templates/PDFs não alterados.
- Logs: chrome próprio substituído pelo contrato comum, com tabela responsiva. Cobertura histórica, não repetida integralmente após a nova Home/sidebar.
- Performance: três indicadores residuais alinhados ao cartão comum; aba Outros Meses rechecada sem overflow.
- Caixa: rótulos do eixo e rodapé separados para não colidirem em mobile; nova captura inspecionada.
- Marketing: todo o módulo client-side e suas entradas de navegação removidos após pedido posterior, recuperáveis pelo Git. Nenhum banco, mídia ou credencial removido. Ver `MARKETING_REMOVAL.md`.

## Fixtures e limites

`stock-admin-mocks.mjs` substitui serviços antes dos mocks genéricos. EditorSite exige objeto completo; Montadoras exige envelope paginado; Conciliação Patrimonial exige objeto. Os testes não usam serviços reais. `getSiteContent` pode criar fallback apesar do nome de leitura, e toggles de AjustesCentral podem chamar atualização diretamente: mutações e navegação externa ficam bloqueadas no harness.

Estados vazios não provam gerenciadores hierárquicos preenchidos. Modelos, Versões e Condições ainda não têm todas as combinações de fixtures e permissões exercitadas. Não declarar uniformidade visual comprovada em todos os estados possíveis.

## Correções de inventário

Ajustes usa ModulePlaceholder com cartões, não redireciona. Backup e ApiReset também são placeholders nesta versão. A rota /ajustes/site-publico abre EditorSite administrativo, não a página pública. O site público e os documentos impressos não foram redesenhados nesta revisão do sistema interno.
