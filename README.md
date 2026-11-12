# CRM do curso

CRM de leads com funil Kanban (React + Vite + Supabase), usado como projeto de exemplo no curso
**"Como resolver bugs automaticamente"**.

> Este CRM tem defeitos de propósito: são os bugs que você vai encontrar e consertar ao longo do curso.
> Não conserte por conta própria antes das aulas.

## O que você precisa

- [Node.js](https://nodejs.org) 22 ou mais novo e o [Git](https://git-scm.com)
- Conta grátis no [GitHub](https://github.com), no [Supabase](https://supabase.com) e no [Cloudflare](https://dash.cloudflare.com/sign-up)
- [GitHub CLI](https://cli.github.com) (`gh`) logado: `gh auth login`
- [Claude Code](https://claude.com/claude-code)

## 1. Sua cópia do repositório

1. No GitHub, nesta página, clique em **Use this template → Create a new repository**.
   Dê um nome (ex.: `crm-do-curso`) e crie. Ela pode ser privada.
2. Clone a sua cópia e instale as dependências:

```bash
git clone https://github.com/<seu-usuario>/crm-do-curso.git
cd crm-do-curso
npm install
```

## 2. O banco de dados (Supabase)

1. Em [supabase.com/dashboard](https://supabase.com/dashboard), clique em **New project**. Dê um nome, clique em
   **Generate a password** (o CRM não usa essa senha, mas guarde) e mantenha a região **Americas**.
   Em **Security**, deixe as opções como vêm (**Automatically expose new tables** marcado: o CRM precisa disso).
   Clique em **Create new project** e espere uns 2 minutos.
   > Plano grátis: no máximo 2 projetos ativos. Se o Supabase não deixar criar, pause um projeto antigo em
   > **Project Settings → General → Pause project**.
2. Abra **SQL Editor**, cole o conteúdo inteiro de
   [`supabase/migrations/20261112000000_estrutura_inicial.sql`](supabase/migrations/20261112000000_estrutura_inicial.sql)
   e clique em **Run**. Tem de aparecer **Success. No rows returned**. Isso cria as tabelas, as regras de acesso e
   os gatilhos (não cria dados).
3. Em **Authentication → Sign In / Providers**, desligue **Confirm email** e clique em **Save changes**.
   Assim o cadastro entra direto, sem precisar confirmar o e-mail.
4. Clique em **Connect** (no topo). No trecho `.env.local` aparecem a URL do projeto (`...SUPABASE_URL`) e a chave
   publicável (`...PUBLISHABLE_KEY`, começa com `sb_publishable_`). Você vai usar as duas no próximo passo.

## 3. Rodar o CRM na sua máquina

1. Copie o `.env.example` para `.env` e preencha com o que copiou:

```
VITE_SUPABASE_URL=https://<seu-projeto>.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...
```

2. Rode `npm run dev` e abra o endereço que aparecer (ex.: http://localhost:5173).
3. Clique em **Cadastre-se**, preencha **Seu nome**, **Nome da empresa**, **E-mail** e **Senha**, clique em
   **Continuar**, deixe o plano **Gratuito** e clique em **Criar conta gratuita**. O CRM abre no Dashboard.
4. Crie os dados de exemplo das aulas (use o e-mail e a senha do cadastro):

```bash
npm run dados-de-exemplo -- seu@email.com suaSenha
```

Isso cria a lead **Juliana** (com uma mensagem) e o lead **Carlos Souza** (sem mensagem).

O `.env` nunca vai para o Git (está no `.gitignore`).

## 4. Publicar (produção)

A publicação roda no GitHub Actions e vai para o Cloudflare Workers. Você só faz a configuração uma vez.

1. **Token do Cloudflare:** em [dash.cloudflare.com](https://dash.cloudflare.com) → **My Profile → API Tokens →
   Create Token**, use o modelo **Edit Cloudflare Workers**, escolha a sua conta e crie. Copie o token.
2. **ID da conta:** na página inicial do Cloudflare, menu da conta → **Copy account ID**.
3. **Endereço de produção:** em **Workers & Pages**, veja o seu subdomínio `workers.dev`
   (ex.: `seu-nome.workers.dev`). O CRM vai ficar em `https://crm-do-curso.seu-nome.workers.dev`.
   Coloque esse endereço em `homepage` no `package.json` e faça commit.
4. **No GitHub**, no seu repositório: **Settings → Secrets and variables → Actions**:
   - em **Secrets**: `CLOUDFLARE_API_TOKEN` e `CLOUDFLARE_ACCOUNT_ID`;
   - em **Variables**: `PRODUCAO_URL` (o endereço do passo 3), `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
5. Publique:

```bash
npm run publicar
```

O comando dispara o workflow **Publicar produção**, espera terminar e confere qual versão ficou no ar.
Ele imprime `{"ok": true, "versao": "...", "noAr": "..."}`.

Outros comandos:

| Comando | O que faz |
|---|---|
| `npm run versao:no-ar` | qual commit está no ar (lê `/version.json` do site) |
| `npm run desfazer -- <commit>` | volta a produção para uma versão anterior |
| `npm run check` | lint + tipos + testes (o que precisa passar antes de entregar) |
| `npm test` | só os testes |

## Problemas comuns

- **Tela branca com "VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY precisam estar definidas"**: falta o `.env`
  (na sua máquina) ou as variables do GitHub (em produção).
- **"Não consegui entrar com esse e-mail e senha"** no `dados-de-exemplo`: confira se o cadastro foi feito e se o
  **Confirm email** está desligado no Supabase.
- **`npm run publicar` diz que `versao-no-ar` precisa do endereço**: preencha `homepage` no `package.json`.
