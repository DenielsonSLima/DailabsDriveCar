# Keep-alive do Supabase Free

O workflow `.github/workflows/supabase-keep-alive.yml` faz uma consulta mínima
ao banco três vezes por dia. Ele consulta somente o campo `id` de no máximo um
registro da tabela pública `config_empresa`, descarta a resposta e registra
apenas o código HTTP. Ele não cria, atualiza nem exclui dados do ERP.

## Configuração no GitHub

O repositório precisa ter este secret em **Settings > Secrets and variables >
Actions**:

- `SUPABASE_PUBLISHABLE_KEY`: chave pública `sb_publishable_...` do projeto.

Depois de publicar o workflow, abra **Actions > Manter Supabase ativo > Run
workflow**. A execução deve finalizar em verde e exibir `HTTP 200`.

O agendamento usa UTC e roda às 03:17, 11:17 e 19:17, equivalentes a 00:17,
08:17 e 16:17 em America/Maceio.

## Observação

Projetos Free com pouca atividade podem ser pausados pelo Supabase. A própria
documentação informa que algumas consultas de usuário por dia normalmente são
suficientes para evitar a pausa, mas a garantia contratual de disponibilidade
continua existindo apenas nos planos pagos.
