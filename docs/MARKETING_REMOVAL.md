# Remoção do módulo Marketing solicitada pelo usuário

## Removido do aplicativo

- Cinco rotas e cinco imports em App.tsx: Marketing, Anúncios, Novo Anúncio, Feed, Stories.
- Pasta modules/marketing completa: 13 arquivos (cinco páginas, sete componentes/helpers e serviço client-side, contados no diff Git).
- Cena Marketing do harness visual e quatro cenas adicionais do manifesto administrativo, para evitar imports de arquivos removidos.
- Sidebar e atalhos Início também deixaram de exibir o módulo no pacote integrado.

## Preservado deliberadamente

Nenhuma consulta ou ação foi executada contra banco, Storage, plataformas de anúncios ou contas. Nenhum registro, campanha, arquivo de mídia, credencial ou integração existente foi apagado/desconectado. Supabase/functions, migrations, tests, histórico SQL e Git permanecem intactos. Campos de moldura existentes nos dados da Empresa foram mantidos para não alterar schema/dados históricos. EditorSite (/ajustes/site-publico) é edição administrativa do site e permanece, pois não pertence à divulgação/campanhas Marketing.

Docs de QA, screenshots e patches históricos registram o trabalho anterior e foram preservados como evidência, não como funcionalidades ativas. Recuperação do código removido é possível pelo histórico Git, incluindo a revisão 7c9d45b anterior à remoção.

## Relatórios na mesma janela

Os oito arquivos modules/relatorios/pages passaram a usar dc-kpi-grid (uma coluna móvel), dc-kpi-card branco, dc-kpi-label/value/hint e valores20px. Nenhuma fórmula, handler, consulta ou dado mudou: igualdade AST sem className confirmada nos oito. Templates/PDFs não foram editados. Corpo/table e valores continuam presentes.

## Verificações

Parser TypeScript: App sem erros de sintaxe; oito relatórios sem mudanças além de className. Harness passou node --check. A rodada integrada posterior contém 204 capturas atuais, com Marketing ausente e controles de Home/sidebar presentes. Consulte STOCK_QA_COVERAGE.md para a cobertura efetivamente repetida e seus limites. Build e testes finais do pacote são registrados separadamente.
