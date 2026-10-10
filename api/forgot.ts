import { appUrl, db, ensureSchema, normalizePhone, route, send, sha256 } from "./_lib.js";
import { sendResetLink, whatsappConfigured } from "./_whatsapp.js";
import { randomBytes } from "node:crypto";

const GENERIC = { ok: true, message: "Se houver uma conta com esses dados, enviamos um link para o WhatsApp cadastrado." };

export default route(["POST"], async (req, res) => {
  const { identifier } = req.body ?? {};
  if (typeof identifier !== "string" || !identifier.trim()) {
    return send(res, 400, { error: "Informe seu usuário ou telefone." });
  }
  const configured = whatsappConfigured();
  if (!configured && process.env.VERCEL_ENV === "production") {
    return send(res, 503, { error: "Envio por WhatsApp ainda não configurado." });
  }

  await ensureSchema();
  const sql = db();
  const phone = normalizePhone(identifier);
  const rows = await sql`SELECT id, phone FROM users
    WHERE username_lc = ${identifier.trim().toLowerCase()} OR phone = ${phone ?? ""} LIMIT 1`;
  const user = rows[0];
  if (!user) return send(res, 200, GENERIC);

  // no máximo 3 pedidos por hora por conta
  const recent = await sql`SELECT count(*)::int AS n FROM password_resets
    WHERE user_id = ${user.id} AND created_at > now() - interval '1 hour'`;
  if (Number(recent[0].n) >= 3) return send(res, 200, GENERIC);

  const token = randomBytes(32).toString("base64url");
  await sql`INSERT INTO password_resets (user_id, token_hash, expires_at)
    VALUES (${user.id}, ${sha256(token)}, now() + interval '30 minutes')`;
  const link = `${appUrl(req)}/?reset=${token}`;

  if (configured) {
    try {
      await sendResetLink(user.phone, link);
    } catch (error) {
      console.error(error); // não revela o erro ao usuário
    }
  } else {
    console.log(`[DEV] Link de redefinição para ${user.phone}: ${link}`);
  }
  send(res, 200, GENERIC);
});
