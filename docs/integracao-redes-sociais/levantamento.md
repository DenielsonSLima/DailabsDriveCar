# Arquitetura e Planejamento: Módulo de Marketing Automático (Meta Ads)

## 1. Resumo Executivo e Proposta de Valor
A integração do ERP Hidrocar com a Meta (Facebook e Instagram) transformará o sistema em uma "Central de Comando" de marketing para as lojas de veículos. O objetivo é remover a fricção de usar o complexo Gerenciador de Anúncios da Meta, permitindo que o lojista use as mídias geradas dentro do próprio ERP para publicar organicamente e criar tráfego pago (Ads) com **2 ou 3 cliques**, controlando o orçamento diretamente pela nossa interface.

---

## 2. A Jornada do Usuário (Como o Lojista usará na prática)

Imagine o fluxo diário do dono da revenda de carros:

1. **Geração da Arte:** Ele entra no submódulo "Gerador de Stories/Feed", cria a arte de um Honda Civic com o preço e a logomarca da loja.
2. **Distribuição Orgânica:** Ele clica em um botão "Postar no Instagram". O ERP conecta-se à conta e a foto vai para o Feed e Stories oficiais da loja.
3. **Impulsionamento (O Tráfego Pago):** Ele decide que quer investir R$ 50,00 por dia nesse Honda Civic para vender rápido.
4. **O Modal de Patrocínio no ERP:** Em vez de abrir o Facebook, ele clica em "Patrocinar" direto no ERP. Abre-se um painel muito limpo:
   - *Público:* "Pessoas de 18 a 50 anos"
   - *Região:* "Goiânia e raio de 30km"
   - *Verba:* "R$ 50,00 por dia durante 5 dias"
5. **Acompanhamento:** No Dashboard de Marketing do ERP, ele vê: "O Civic teve 5.000 visualizações e você já gastou R$ 120,00. Seu saldo restante na plataforma é de R$ 380,00".

---

## 3. Como funciona o controle de Saldo e Dinheiro (Obrigatório Ler)

### O Problema da Injeção de Saldo (Recarga)
Muitos clientes perguntam: *"Posso adicionar saldo no Facebook via PIX por dentro do meu ERP?"*
**A Resposta Técnica:** Não. A Meta bloqueia via API qualquer injeção primária de dinheiro. O ERP não pode gerar um código PIX ou boleto que deposite dinheiro na conta do Facebook do cliente. Isso ocorre por rígidas regras globais de prevenção à lavagem de dinheiro (AML - Anti-Money Laundering).

### A Solução e Fluxo Real (Exemplo Prático)
Para que o módulo funcione, adotamos o seguinte fluxo:

1. **A Recarga Base (Feita na Meta):** 
   - No dia 01 do mês, o lojista abre o site oficial do Facebook (Gerenciador de Anúncios).
   - Ele gera um PIX de R$ 1.000,00 e paga. O saldo da conta de anúncios dele agora é R$ 1.000,00.
   - *Ou*, ele cadastra o cartão de crédito corporativo dele direto na plataforma da Meta.
   
2. **A Gestão Inteligente (Feita no ERP):**
   - Agora ele não precisa mais abrir o Facebook o resto do mês.
   - O ERP vai bater na API da Meta e perguntar: *"Quanto esse cliente tem de limite e quanto ele já gastou?"*.
   - A API retorna: Limite (`spend_cap`) de 1000 e Gasto (`amount_spent`) de 0. O ERP mostra na tela: **Saldo Disponível: R$ 1.000,00**.
   - O cliente impulsiona 2 carros a R$ 100,00 cada. O ERP dispara a ordem de criação de campanha para a Meta. 
   - No dia seguinte, a API reportará o consumo, e o Dashboard do ERP atualizará para: **Saldo Disponível: R$ 800,00**.

---

## 4. Estrutura Técnica de Criação de Anúncios (Como o Robô Trabalha)

Quando o lojista preenche nosso modal simples e clica em "Patrocinar", nosso sistema (Backend) precisa traduzir isso para a complexidade da **Meta Marketing API**. 
O código fará 4 requisições em cascata invisíveis para o usuário:

### Etapa 1: Upload do Criativo (`POST /act_{ID_CONTA}/adimages`)
- O ERP pega a foto do Honda Civic hospedada no Supabase e manda para a Meta. 
- A Meta devolve um "Código Hash" (ex: `hash_8f93a...`).

### Etapa 2: Criação da Campanha (`POST /act_{ID_CONTA}/campaigns`)
- O ERP cria a "Pasta Mãe" do anúncio.
- Define o objetivo (ex: Engajamento ou Tráfego para o WhatsApp).
- *Exemplo de Carga (Payload):* `{"name": "Venda_Honda_Civic", "objective": "OUTCOME_TRAFFIC", "status": "ACTIVE"}`

### Etapa 3: Criação do Conjunto de Anúncios (`POST /act_{ID_CONTA}/adsets`)
- Aqui o ERP joga as configurações de orçamento e público.
- *Exemplo de Carga:* 
  `{"daily_budget": 5000, "targeting": {"geo_locations": {"cities": [{"key": "goiania"}]}, "age_min": 18, "age_max": 50}}` 
  *(Nota: R$ 50,00 vira 5000 em centavos na API).*

### Etapa 4: Criação e Montagem do Anúncio Final (`POST /act_{ID_CONTA}/ads`)
- O ERP junta tudo: Liga a Campanha, ao Conjunto, e puxa o "Hash" da Imagem gerado na Etapa 1, adicionando o texto/legenda e o botão "Saiba Mais".
- A partir deste momento, o anúncio vai para a fila de revisão da Meta e começa a rodar, consumindo aquele saldo de R$ 1.000,00.

---

## 5. Arquitetura Multitenant (Segurança de Múltiplas Lojas)

Como o Hidrocar ERP atende várias lojas (cada uma é um `organization_id`):
- Implementaremos um fluxo de **Autenticação OAuth2** ("Login com Facebook").
- A loja A entra, autoriza o App da Dailabs, e nós gravamos o `access_token` criptografado no banco de dados atrelado apenas à Loja A.
- Quando a Loja B acessar, ela terá o seu próprio token. 
- Em hipótese alguma os dados ou campanhas se cruzarão, garantido pelo Row Level Security (RLS) do Supabase.

---

## 6. O Caminho das Pedras: Próximos Passos (Checklist)

Para transformar isso em código real, precisaremos seguir estes passos burocráticos e técnicos:

### Fase 1: Burocracia Meta (1 a 2 semanas)
- [ ] Entrar em `developers.facebook.com` com uma conta corporativa da Dailabs.
- [ ] Criar um Aplicativo do tipo "Business (Negócios)".
- [ ] Adicionar os produtos "Marketing API" e "Instagram Graph API".
- [ ] Passar pelo processo de **Verificação de Empresa** (enviar contrato social, CNPJ para provar que a software house existe e não é fraude).
- [ ] Pedir permissões avançadas de sistema (`ads_management` e `ads_read`).

### Fase 2: Estruturação no ERP (2 semanas)
- [ ] Criar tabelas no Supabase para guardar Tokens de forma segura atrelados ao tenant.
- [ ] Criar Supabase Edge Functions para orquestrar as chamadas para a Meta de forma segura (sem expor credenciais no Frontend).
- [ ] Desenvolver o "Modal Simplificado de Anúncios" no Frontend.

### Fase 3: Validação (1 semana)
- [ ] Fazer um teste real publicando foto organicamente.
- [ ] Fazer um teste real subindo uma campanha de tráfego com uma conta "SandBox" (de testes).
