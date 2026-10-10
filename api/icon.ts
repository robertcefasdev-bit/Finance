import type { VercelRequest, VercelResponse } from "@vercel/node";
import { ICONS } from "./_icons.js";

// Serve os ícones do app (apple-touch-icon e ícones do Android) em PNG.
export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", "GET, HEAD");
    return res.status(405).end();
  }
  const size = String(req.query.size ?? "512");
  const data = ICONS[size];
  if (!data) return res.status(404).json({ error: "Tamanho não disponível (180, 192 ou 512)." });
  res.setHeader("Content-Type", "image/png");
  res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  res.status(200).send(Buffer.from(data, "base64"));
}
