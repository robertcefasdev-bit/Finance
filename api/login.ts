import { db, ensureSchema, hashPassword, route, send, setSessionCookie, verifyPassword } from "./_lib.js";

const MAX_FAILS = 5;

export default route(["POST"], async (req, res) => {
  const { username, password } = req.body ?? {};
  if (typeof username !== "string" || typeof password !== "string") {
    return send(res, 400, { error: "Informe usuário e senha." });
  }
  await ensureSchema();
  const sql = db();
  const rows = await sql`SELECT id, username, password_hash, token_version, failed_count, locked_until
    FROM users WHERE username_lc = ${username.trim().toLowerCase()}`;
  const user = rows[0];
  if (user?.locked_until && new Date(user.locked_until) > new Date()) {
    return send(res, 429, { error: "Muitas tentativas. Tente de novo em 15 minutos." });
  }
  // compara mesmo sem usuário, para não revelar se ele existe pelo tempo de resposta
  const ok = user
    ? await verifyPassword(password, user.password_hash)
    : (await hashPassword(password), false);
  if (!user || !ok) {
    if (user) {
      const fails = Number(user.failed_count) + 1;
      if (fails >= MAX_FAILS) {
        await sql`UPDATE users SET failed_count = 0, locked_until = now() + interval '15 minutes' WHERE id = ${user.id}`;
      } else {
        await sql`UPDATE users SET failed_count = ${fails} WHERE id = ${user.id}`;
      }
    }
    return send(res, 401, { error: "Usuário ou senha incorretos." });
  }
  await sql`UPDATE users SET failed_count = 0, locked_until = NULL WHERE id = ${user.id}`;
  setSessionCookie(res, String(user.id), Number(user.token_version));
  send(res, 200, { username: user.username });
});
