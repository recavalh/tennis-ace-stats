# Tennis Tático · Ace Stats

Jogo de decisões de tênis com 12 exercícios, três estilos de computador e duelos privados por convite.

## Acesso e privacidade

O visitante recebe um token privado salvo no navegador; o servidor guarda somente seu hash. O progresso fica associado ao perfil desse visitante. O login Google é validado no servidor pelo Supabase Auth. Ao entrar, o progresso do visitante é vinculado à conta ou somado ao histórico existente. O token antigo é invalidado e conexões antigas de visitante são encerradas.

O apelido e os dados da partida são compartilhados com o adversário. Histórico e replay são consultados somente pelo perfil autenticado naquela conexão. Placar, decisões, cronômetro e resultados são calculados pelo servidor.

## Desenvolvimento local

Use Node.js 24 LTS:

    npm ci
    npm run dev

Abra http://127.0.0.1:3100. Por padrão, o servidor de desenvolvimento aceita conexões somente neste computador e usa SQLite em data/tennis.sqlite. Para testes na rede local, configure HOST=0.0.0.0 conscientemente.

As variáveis disponíveis estão em .env.example. O arquivo .env é ignorado pelo Git. Sem configuração de autenticação, o visitante pode jogar e o acesso com Google aparece indisponível.

## Banco Supabase

A estrutura fica no schema privado ace_game. Ela não é exposta à Data API do navegador. RLS está habilitado e os papéis anon e authenticated não recebem acesso ao schema. O servidor conecta por DATABASE_URL; nunca envie essa variável ao navegador.

Aplique database/001_game.sql pelo SQL Editor ou execute, com DATABASE_URL no ambiente:

    npm run db:migrate

A migração é idempotente e não contém exclusão de dados. Use a conexão do Session Pooler indicada pelo painel do Supabase para a região do projeto. TLS e hostname são verificados. Para os hosts do pooler compartilhado *.pooler.supabase.com, o servidor inclui a CA pública oficial Supabase Root 2021. DATABASE_CA_CERT permite substituir a CA explicitamente quando necessário. O certificado distribuído pelo painel está em https://supabase-downloads.s3-ap-southeast-1.amazonaws.com/prod/ssl/prod-ca-2021.crt.

## Google

No Google Cloud, prepare um cliente OAuth do tipo aplicação Web com os escopos básicos de identidade. O callback do Google é a URL /auth/v1/callback do seu projeto Supabase, fornecida no painel do provedor Google.

No Supabase:

1. Configure o provedor Google com o ID e o segredo do cliente OAuth.
2. Configure Site URL como https://app.ace-stats.com.
3. Autorize o retorno exato https://app.ace-stats.com/auth/callback.
4. Use somente a URL pública do projeto e a chave publicável em SUPABASE_URL e SUPABASE_PUBLISHABLE_KEY no servidor.

Senhas e segredos entram nos painéis dos provedores ou em .env local; nunca em commits ou mensagens públicas. O segredo OAuth fica no provedor Google do Supabase, não no frontend.

## Render Free

O manifesto render.yaml na raiz declara apenas um Web Service Free, sem banco pago ou disco adicional. Configure:

- DATABASE_URL: conexão privada do PostgreSQL. A senha pode ficar em PGPASSWORD, sem precisar codificar caracteres especiais na URL.
- SUPABASE_URL: URL pública do projeto.
- SUPABASE_PUBLISHABLE_KEY: chave pública, nunca service_role ou sb_secret.
- APP_ORIGINS: origens exatas permitidas, separadas por vírgula. Inclua https://app.ace-stats.com e o domínio pages.dev de revisão, se usado.
- DATABASE_CA_CERT: apenas se exigido pela verificação TLS.

O build instala dependências e executa npm run build. O início aplica a migração e executa npm start. Em produção, o servidor recusa iniciar sem banco persistente.

O Free pode adormecer após inatividade. O primeiro acesso pode demorar aproximadamente um minuto. Salas em andamento ficam em memória e podem terminar em um reinício; pontos e histórico concluídos ficam no PostgreSQL.

## Cloudflare Pages

O frontend é estático. Configure a pasta raiz strategy-game, Node 24 e:

- Build: npm run build:client
- Saída: dist/client
- VITE_GAME_SERVER_URL: origem HTTPS real do Web Service do Render.

Para upload direto, compile localmente com essa mesma variável e envie dist/client. Os builds do frontend e do servidor geram o mesmo identificador a partir do código, permitindo detectar abas antigas sem confundir builds feitos em provedores diferentes.

Associe app.ace-stats.com ao projeto Pages e adicione no provedor DNS o CNAME exato fornecido pelo Cloudflare. O domínio principal pode continuar no GitHub Pages.

## Publicação pelo GitHub

Envie as alterações do jogo na pasta `strategy-game` para o ramo `main`. A ação **Publicar Tennis Tático** testa e compila o código, publica o commit no Render e aguarda a confirmação desse build para enviar a interface ao Cloudflare Pages. A ação também pode ser executada manualmente pelo GitHub em `main`.

O repositório usa a variável `CLOUDFLARE_ACCOUNT_ID` e os segredos `CLOUDFLARE_API_TOKEN` (edição de Pages na conta Ace Stats) e `RENDER_DEPLOY_HOOK_URL` (hook do serviço ace-stats-game). O Render é acionado pela ação do GitHub para publicar a revisão que passou nos testes.

## Verificação

    npm run check
    npm run build
    npm test

A suíte cobre motor de jogo, sincronização de salas, reconexão, saques e voleios, progresso, vínculo de visitante à conta, recuperação entre sessões e rejeição de acessos inválidos.

Os testes de interface existentes estão em tests/ui e usam a porta 3100. O fluxo inicial de visitante também deve ser verificado no navegador.

Para verificar o adaptador PostgreSQL em uma instalação local isolada do PostgreSQL 18 no Windows, use o script da raiz:

    powershell -File scripts/verify-local-postgres.ps1

Esse teste cria um cluster temporário em output, usa apenas loopback e o encerra ao concluir. Ele não usa o banco de produção.

A validação TLS pública, sem enviar senha ou SQL, pode ser executada na pasta strategy-game com node --import tsx scripts/verify-database-tls.ts. Ela confirma a cadeia e o hostname corretos e exige rejeição de CA ausente e hostname incorreto.
