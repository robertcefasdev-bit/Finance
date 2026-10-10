import { db, ensureSchema, hashPassword, route, send, sha256, validPassword } from "./_lib.js";

export default route(["POST"], async (req, res) => {
  const { token, password } = req.body ?? {};
  if (typeof token !== "string" || !token) return send(res, 400, { error: "Link inválido." });
  if (!validPassword(password)) return send(res, 400, { error: "A senha precisa ter pelo menos 6 caracteres." });

  await ensureSchema();
  const sql = db();
  const rows = await sql`SELECT id, user_id FROM password_resets
    WHERE token_hash = ${sha256(token)} AND used_at IS NULL AND expires_at > now()`;
  const reset = rows[0];
  if (!reset) return send(res, 400, { error: "Link inválido ou expirado. Peça um novo." });

  // token_version + 1 derruba todas as sessões antigas
  await sql`UPDATE users SET password_hash = ${await hashPassword(password)},
    token_version = token_version + 1, failed_count = 0, locked_until = NULL WHERE id = ${reset.user_id}`;
  await sql`UPDATE password_resets SET used_at = now() WHERE user_id = ${reset.user_id} AND used_at IS NULL`;
  send(res, 200, { ok: true });
});
