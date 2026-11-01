# Ace Stats

Site público e jogo de estratégia de tênis para o amador.

- Site de apresentação: React/Vite, publicado no GitHub Pages em https://ace-stats.com.
- Página do jogo: /jogo.
- Jogo: projeto independente em strategy-game, preparado para app.ace-stats.com.
- Autenticação e progresso: Google via Supabase Auth; banco PostgreSQL privado no Supabase.
- Hospedagem proposta: Cloudflare Pages para o jogo e Render Free para seu servidor.

## Desenvolvimento

Use Node.js 24 LTS.

Site:

    npm ci
    npm run dev -- --host 127.0.0.1 --port 8080

Jogo, em outro terminal:

    cd strategy-game
    npm ci
    npm run dev

Abra http://127.0.0.1:8080/jogo. O botão de jogar aponta para a porta 3100 durante o desenvolvimento. O modo visitante funciona localmente sem credenciais; o login Google exige configurar o Supabase.

## Compilação e verificação

Site:

    npm run build

A compilação prepara entradas reais para /jogo, /android, /watch, /platform e /privacy, permitindo acesso direto no GitHub Pages.

Jogo:

    npm --prefix strategy-game run check
    npm --prefix strategy-game run build
    npm --prefix strategy-game test

Consulte strategy-game/README.md para publicação e configuração. Nenhuma senha ou chave secreta deve ser adicionada ao repositório.
