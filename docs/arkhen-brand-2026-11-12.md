# Arkhen Drive Car: identidade visual

Nome da plataforma atualizado no login, sidebar, cabeçalho, início, carregamento, metadados e atalhos. No rodapé público, apenas a identificação da plataforma mudou; loja e CNPJ foram preservados.

O original fornecido foi preservado em `public/brand/arkhen-source.png`. A reconstrução vetorial `arkhen-symbol.svg` mantém a composição angular prata: é interpretação fiel, não recuperação de detalhes inexistentes no raster original.

## Pedido posterior: logo PNG sem fundo

O mestre `arkhen-symbol-1024.png` já era RGBA transparente. O quadrado escuro vinha do wrapper de AppBrand e foi removido; o componente agora usa o PNG diretamente. O login continua escuro, conforme pedido. Não foi necessário inventar uma nova marca.

Favicons/atalhos de 32, 180, 192 e 512 px foram exportados do mesmo mestre, preservando transparência. A variante maskable antiga permanece recuperável no projeto mas não é referenciada pelo manifest; os ícones any de 192 e 512 continuam presentes. Metadados sociais usam o mestre1024. A instalação PWA em aparelho físico não foi testada.

Canal alpha e cantos transparentes verificados em todos os PNGs ativos. Login/sidebar passaram por seis capturas em1440/390/320, com fonte Outfit carregada, sem imagem quebrada, erro JS ou overflow. O harness também verifica que o wrapper da marca é transparente. Build integrado aprovado. Não houve publicação.

Domínio, razão social, CNPJ, contas, permissões, regras financeiras, sessões e documentos preservados. Assets vetoriais e original permanecem para manutenção, sem apagar histórico.
