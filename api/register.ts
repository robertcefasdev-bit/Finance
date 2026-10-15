import { assertConfig, cleanUsername, db, ensureSchema, hashPassword, normalizePhone, route, send, setSessionCookie, usernameKey, validPassword } from "./_lib.js";

export default route(["POST"], async (req, res) => {
  assertConfig();
  const { phone, password } = req.body ?? {};
  const username = cleanUsername(req.body?.username);
  const normalized = normalizePhone(phone);
  if (!username) {
    return send(res, 400, { error: "Nome de usuário: 3 a 30 caracteres (letras, números, espaço, _ . -)." });
  }
  if (!normalized) return send(res, 400, { error: "Telefone inválido. Use DDD + número." });
  if (!validPassword(password)) return send(res, 400, { error: "A senha precisa ter pelo menos 6 caracteres." });

  await ensureSchema();
  const sql = db();
  const taken = await sql`SELECT username_lc, phone FROM users WHERE username_lc = ${usernameKey(username)} OR phone = ${normalized}`;
  if (taken.length > 0) {
    return send(res, 409, { error: "Usuário ou telefone já cadastrado." });
  }
  const rows = await sql`INSERT INTO users (username, username_lc, phone, password_hash)
    VALUES (${username}, ${usernameKey(username)}, ${normalized}, ${await hashPassword(password)})
    RETURNING id, token_version`;
  setSessionCookie(res, String(rows[0].id), Number(rows[0].token_version));
  send(res, 201, { username });
});
