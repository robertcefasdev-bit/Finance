import { db, ensureSchema, hashPassword, normalizePhone, route, send, setSessionCookie, validPassword, validUsername } from "./_lib.js";

export default route(["POST"], async (req, res) => {
  const { username, phone, password } = req.body ?? {};
  const normalized = normalizePhone(phone);
  if (!validUsername(username)) {
    return send(res, 400, { error: "Usuário: 3 a 30 caracteres (letras, números, _ . -)." });
  }
  if (!normalized) return send(res, 400, { error: "Telefone inválido. Use DDD + número." });
  if (!validPassword(password)) return send(res, 400, { error: "A senha precisa ter pelo menos 6 caracteres." });

  await ensureSchema();
  const sql = db();
  const taken = await sql`SELECT username_lc, phone FROM users WHERE username_lc = ${username.toLowerCase()} OR phone = ${normalized}`;
  if (taken.length > 0) {
    return send(res, 409, { error: "Usuário ou telefone já cadastrado." });
  }
  const rows = await sql`INSERT INTO users (username, username_lc, phone, password_hash)
    VALUES (${username}, ${username.toLowerCase()}, ${normalized}, ${await hashPassword(password)})
    RETURNING id, token_version`;
  setSessionCookie(res, String(rows[0].id), Number(rows[0].token_version));
  send(res, 201, { username });
});
