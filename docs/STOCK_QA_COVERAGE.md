# QA integrado do padrão Estoque

## Rodada atual após nova direção do usuário

Base integrada `943d777`, Home/login repetidos em `95660b0`; Caixa repetida após `b538890`; recebimento inline regenerado e repetido no snapshot final `20d55bcb9c5dcb29354d981e654017a676689035`. Relatório principal guarda o commit de cada captura. Esta rodada substitui as imagens de mesmo nome, não representa repetição de todas as 57 cenas históricas.

- **153 capturas / 24 cenas únicas** em `scratch/stock-standard-qa/report.json`, resumo em `summary.json`: quatro principais, Home, Estoque detalhe/formulário, Caixa, Performance, oito interfaces Relatórios, seis cadastros/ajustes com fixtures corrigidas e EditorSite.
- Financeiro: dashboard + onze abas, subabas e modais representativos; faixa única de KPIs e abas conforme nova solicitação. EditorSite: Hero, Quem Somos e Contato, sem salvar. Performance: Mês Atual e Outros Meses. Despesa Estoque: abrir e fechar pelo X, sem efetivar.
- **27 capturas** em `scratch/lotes-compactos/report.json`: cards comerciais/Estoque com quatro itens, cinco abas de Lotes e detalhe financeiro, 1440/1024/390. Resumo atual mostra venda média, despesa média e compra média incluindo despesas.
- **18 capturas** em `scratch/recebimento-inline/report.json`: seis estados em 1440/1024/390; dados do título, baixa, ações e histórico inline. Sem overlay; nenhuma chamada de escrita. Voltar/avançar/recarregar/cancelar testados. Não valida operação financeira real.
- **6 capturas** em `scratch/arkhen-brand-qa/report.json`: login escuro e sidebar nova em 1440/390/320. Outfit local carregada.
- Marketing removido das cenas atuais e da interface. Manifesto administrativo agora contém 33 extras; nem todos foram repetidos após a nova direção.

### Medição comparativa atual

Estoque, Compras e Vendas: 1440 = quatro cartões 275 × 102 px; 1024 = duas colunas 354 × 102; 390 = uma coluna 358 × 102. Padding 14 × 16, raio 12, rótulo 13/18 peso500, valor20/28 peso600; títulos30/36 desktop e24/32 mobile. Ticket e sócios não ocupam blocos gigantes.

Financeiro é exceção **intencional aprovada pelo novo pedido**: sete KPIs em faixa horizontal, cartões de aproximadamente155 × 102 px e valores18px; rolagem interna nos viewports estreitos. Não afirmar igualdade integral de geometria entre as quatro páginas. A propriedade grid-template-columns herdada não determina colunas quando o elemento usa flex.

FontFaceSet status `loaded`; Inter400/500/600/700 e Outfit400/500/600 carregadas. Checks de fontes verdadeiros e captura após fonts.ready. Moedas individuais medidas com Range: sem quebra/corte nas fixtures verificadas; detecção restrita aos seletores do harness, não prova valores arbitrários.

### Achados rechecados

Performance Outros Meses sem overflow; Caixa eixoY íntegro; EditorSite campos com borda e padding; oito Relatórios com KPIs de interface padronizados; seis fixtures corrigidas (erros anteriores eram de mock, não falhas comprovadas em produção); Despesa Estoque fecha pelo X. Home tinha meses cortados: margem inferior corrigida e captura inspecionada. Login placeholder antigo corrigido. Caixa tinha rodapé sobre os meses: correção em b538890 e repetição separada.

Inspeção visual direta atual inclui Home desktop, login desktop/320, sidebar390, Financeiro desktop, Caixa390, Performance Outros Meses390, Despesa Estoque390, EditorSite Contato390, Lotes Resumo390 e baixa inline390. Não declarar inspeção manual de cada imagem. A suíte verifica automaticamente erros, gaps, fontes, overflow, imagens visíveis quebradas e moedas. Capturas full-page contêm a barra fixa na posição atual do viewport, não uma obstrução permanente de todo o conteúdo.

### Segurança e limites atuais

Chromium Headless Shell oficial1161/Playwright1.51.1, HTTP loopback, serviços substituídos por fixtures, rede externa bloqueada. Nenhum banco real, pagamento, login, upload, impressão ou publicação. Não é Safari nem aparelho físico. Estados vazios prevalecem em cadastros/relatórios; Caixa tem três meses sintéticos e KPIs zero; Performance zero. Não prova todas as permissões, estados e dados reais. Guarda de navegação/remount durante baixa pendente integrada no snapshot final; coordenador informou teste DOM e revisão independente aprovados. Esta rodada de navegador não submete baixa, nem mesmo ao mock, portanto não exercita pendência real de submissão. As 18 capturas inline finais passaram com zero erros, zero rede externa, zero chamadas de escrita e sem overlay. Baixa390 e detalhe1440 foram reinspecionados visualmente, sem corte ou colisão. As outras186 capturas não foram repetidas nesta última rodada.

## Histórico anterior, não confundir com validação final

Resultados até `7c9d45b`: 272 capturas /57 cenas,33 Lotes e6 branding; JSON preservado em `scratch/stock-standard-qa/history-7c9d45b/`. Imagens de mesmo nome podem ter sido sobrescritas pela rodada atual. A cobertura histórica incluía demais hubs, detalhes/formulários comerciais,15 cadastros,10 ajustes e Marketing então existente. Não somar histórico como cobertura final atual.

## Ajuste final da marca

Após o pedido de PNG sem fundo, a caixa escura do componente foi retirada e o mestre transparente passou a ser usado diretamente. Home/Financeiro e as seis capturas de login/sidebar foram repetidos em `0e59a06`; as demais cenas não precisaram de alteração de layout e não foram repetidas só por esta troca da marca. PNGs ativos e wrapper transparente verificados.
