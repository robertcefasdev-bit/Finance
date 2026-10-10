# Publicar na Vercel (com banco de dados)

## 1. Subir o projeto
1. Coloque o projeto no GitHub e importe em https://vercel.com/new (preset: Vite).
2. As funções da pasta `api/` viram o backend automaticamente.

## 2. Criar o banco (Postgres da Vercel = Neon)
1. No projeto da Vercel: **Storage → Create Database → Neon (Postgres)**.
2. Conecte ao projeto. A Vercel cria a variável `DATABASE_URL` sozinha.
3. As tabelas (`users`, `password_resets`, `user_state`) são criadas automaticamente no primeiro acesso.

## 3. Variáveis de ambiente (Settings → Environment Variables)
| Variável | Para quê |
|---|---|
| `AUTH_SECRET` | Segredo da sessão (mín. 16 caracteres). Gere com `openssl rand -base64 32` |
| `APP_URL` | Endereço do site, ex.: `https://meu-app.vercel.app` (usado no link do WhatsApp) |
| `WHATSAPP_TOKEN` | Token da WhatsApp Business Cloud API (Meta) |
| `WHATSAPP_PHONE_ID` | ID do número de envio na Meta |
| `WHATSAPP_TEMPLATE` | Nome do template aprovado (ex.: `redefinir_senha`) |
| `WHATSAPP_TEMPLATE_LANG` | Idioma do template (padrão `pt_BR`) |

## 4. WhatsApp ("Esqueci minha senha")
O envio automático exige a **WhatsApp Business Platform (Meta)**:
1. Crie um app em developers.facebook.com e adicione o produto WhatsApp.
2. Cadastre o número que vai enviar as mensagens.
3. Crie um template de categoria **Utilidade**, por exemplo:
   `Olá! Para redefinir sua senha do app, acesse: {{1}} (o link vale por 30 minutos).`
4. Espere a aprovação e coloque o nome dele em `WHATSAPP_TEMPLATE`.

Sem isso configurado, em produção o app responde "Envio por WhatsApp ainda não configurado".
Em desenvolvimento (`vercel dev`) o link de redefinição aparece no terminal.

## 5. Rodar localmente
```
npm install
npm i -g vercel
vercel link
vercel env pull .env.local
vercel dev
```
`npm run dev` sozinho **não** sobe a pasta `api/`; use `vercel dev`.

## Segurança já incluída
- Senha com scrypt + sal; cookie de sessão HttpOnly e assinado.
- Bloqueio de 15 min após 5 senhas erradas.
- Link de redefinição vale 30 min, uso único, máx. 3 pedidos por hora.
- A resposta de "esqueci minha senha" não revela se a conta existe.
