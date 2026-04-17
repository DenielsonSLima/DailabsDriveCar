# Histórico de Alterações do Projeto

## [2026-04-17] - Refatoração Modular e Correção de Resiliência
- **Modularização do Sistema**: Refatoração completa do `SitePublicoService` para separar o carregamento de dados. Agora, erros em um componente (ex: dados da empresa) não impedem a exibição de outros (ex: catálogo de veículos/motos).
- **Correção de Detalhes do Veículo**: Aplicado `z.coerce.number()` em campos de KM e Anos no schema principal, resolvendo o crash ao abrir a página de detalhes do veículo no site público.
- **Melhoria de SEO**: Tornadas dinâmicas as metatags da página de detalhes, refletindo o nome real da loja.

## [2026-04-17] - Suporte a Motocicletas e Correção de Visibilidade Inicial
- **Visibilidade Site**: Correção do erro de parsing inicial no Zod para campos numéricos.
- **Suporte a Motos**: Expansão do catálogo para motocicletas (Biz, CG 160, BMW R 1250 GS, etc.) com montadoras oficiais.
- **Limpeza de UI**: Remoção definitiva do campo `portas`.

## [2026-04-17] - Povoamento de Catálogo Global: 30 Modelos Populares/Premium e Enriquecimento Visual
**O que foi feito:**
- **Povoamento de Dados**: Inserção de 30 modelos de veículos representativos do mercado brasileiro (20 Populares e 10 Premium) como dados globais (`organization_id IS NULL`).
- **Novas Montadoras**: Cadastramento de Toyota, BMW, Audi e Land Rover.
- **Padronização Técnica**: Para cada modelo, foram criadas de 2 a 3 versões com motorização e câmbio reais (ex: 1.0 MPI, 1.3 Turbo, Hybrid, Diesel 4x4).
- **Enriquecimento Visual**:
    - Logotipos oficiais em PNG transparente para as novas e principais montadoras.
    - Fotos de estúdio (padrão catálogo) vinculadas aos modelos de maior volume e destaque.
- **Correção de Ortografia**: Renomeada a montadora `VOLKSVAGEM` para `VOLKSWAGEN` em todo o banco de dados.
- **Hotfix Modelos**: Corrigido erro de "tela branca" em `Modelos.page.tsx` causado pela ausência da função `getModeloNameById`.

**Por quê:**
O sistema necessitava de uma base de dados inicial robusta para facilitar o uso por novos clientes e demonstrar a qualidade visual do ERP. A correção na página de modelos era crítica para a estabilidade do módulo de cadastros.

**Arquivos afetados:**
- Banco de Dados (SQL: Update e Seeds)
- `modules/cadastros/modelos/Modelos.page.tsx` [MODIFY]
