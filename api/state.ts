import { db, ensureSchema, getSessionUser, route, send } from "./_lib.js";

const MAX_BYTES = 1_000_000;

export default route(["GET", "PUT"], async (req, res) => {
  const user = await getSessionUser(req);
  if (!user) return send(res, 401, { error: "Não autenticado" });
  await ensureSchema();
  const sql = db();

  if (req.method === "GET") {
    const rows = await sql`SELECT data FROM user_state WHERE user_id = ${user.id}`;
    return send(res, 200, { data: rows[0]?.data ?? null });
  }

  const { data } = req.body ?? {};
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return send(res, 400, { error: "Dados inválidos." });
  }
  const json = JSON.stringify(data);
  if (json.length > MAX_BYTES) return send(res, 413, { error: "Dados grandes demais." });
  await sql`INSERT INTO user_state (user_id, data, updated_at)
    VALUES (${user.id}, ${json}::jsonb, now())
    ON CONFLICT (user_id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`;
  send(res, 200, { ok: true });
});
