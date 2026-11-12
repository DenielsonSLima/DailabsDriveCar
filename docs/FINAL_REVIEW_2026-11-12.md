# Arkhen Drive Car: revisão local de 12/11/2026

## Entrega preparada

- Contrato visual do Estoque aplicado aos módulos internos: títulos, cartões, campos, abas, tabelas, detalhes, formulários e modais. Inventários por arquivo e cobertura visual estão separados.
- Estoque, Compras e Vendas usam a mesma geometria de KPIs; Entradas e Saídas preservam quatro cards por linha em desktop, com redução responsiva.
- Financeiro tem sete KPIs e abas em faixas horizontais, com rolagem interna quando necessário. Essa exceção foi solicitada após o contrato inicial.
- Sidebar escura com Outfit, ícones discretos; corpo em Inter. Fontes verificadas carregadas no navegador.
- Login escuro, Home reorganizada e identidade Arkhen Drive Car. Símbolo PNG transparente 1024×1024, sem caixa escura no componente. Favicons e atalhos exportados do mesmo mestre transparente, sem reinterpretar a marca.
- Marketing removido da interface e código client-side, recuperável pelo Git. Nenhum registro, mídia, credencial ou integração removido.
- Lotes: três médias visíveis (venda, despesas e compra incluindo despesas), com explicação do divisor e da diferença para lucro gerencial. Helpers e cálculos existentes preservados.
- Recebimento de Lotes na própria página: detalhe, Voltar, Baixar título e histórico somente leitura. Reutiliza backend existente; demais módulos mantêm o modal legado. Proteção contra duplo envio e callback antigo após navegação.

## Verificação

- Build Vite do código final aprovado. Permanece aviso de chunk acima de 500 kB.
- Onze testes locais aprovados: financeiro de Lotes, formulário real/transporte fictício, compatibilidade RECEBER/PAGAR legado, navegação durante RPC pendente, resultado, médias visíveis, UI de Lotes, valores, isolamento dos recebíveis, service e pesquisa de Estoque.
- Typecheck restrito às fontes: 36 diagnósticos preexistentes, nenhum novo comparado à base. Não é typecheck verde. O projeto não oferece script de lint.
- 204 capturas atuais: 153 principais/administrativas, 27 Lotes, 18 recebimento inline e 6 login/sidebar. Repetições focadas substituem imagens anteriores; não representam 204 capturas todas feitas após a última alteração de um asset. Fonte/commit por cena e limites em STOCK_QA_COVERAGE.md.
- Após a proteção de concorrência, 18 capturas inline foram repetidas em 20d55bc. Após remover o fundo da logo, Home/Financeiro e login/sidebar foram repetidos em 0e59a06.
- Comparação de cálculos e handlers do Resumo usa a base imutável, não HEAD móvel. O teste originalmente dependia de HEAD antes do commit; essa fragilidade foi corrigida e a suíte repetida.
- Varredura por padrões comuns de segredos no delta sem achados. Isso não equivale a auditoria completa de segurança.

## Limites e estado de publicação

Testes com dados fictícios, sem login ou baixa real, escrita remota, impressão ou upload de dados de clientes. Não provam todas as permissões, todos os estados hierárquicos, todos os valores monetários extremos ou Safari/aparelho físico. Templates/PDFs e site público não foram redesenhados; a marca da plataforma no rodapé público foi atualizada sem alterar a empresa.

A produção consultada permanece em `36bc9b43c00559a6e629d85ab4a9692c0766e315`, deployment READY, sem erro de alias. Nenhum push, PR, merge, migration ou deploy feito nesta revisão. A autorização anterior expirou; publicar exige autorização nova. Este pacote não contém alterações de SQL ou serviços financeiros.

## Reprodução local

`npm ci` e `npm run build`. Testes DOM usam Happy DOM fornecido por `HAPPY_DOM_MODULE`. Testes visuais usam ferramentas isoladas: Playwright 1.51.1, Chromium Headless Shell 1161 e Tailwind CLI 3, informados por `PLAYWRIGHT_MODULE`, `CHROMIUM_PATH` e `TAILWIND_CLI`. Cache de Inter/Outfit deve existir em `scratch/stock-standard-qa`; a rede é bloqueada durante as capturas. Não use credenciais ou serviços reais no harness.
