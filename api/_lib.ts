import { neon } from "@neondatabase/serverless";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  createHash,
  createHmac,
  randomBytes,
  scrypt as scryptCb,
  timingSafeEqual,
} from "node:crypto";

// ---------- Banco (Postgres da Vercel / Neon) ----------
// A integração "Neon" do Marketplace da Vercel cria a variável DATABASE_URL sozinha.
export function db() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL não configurada");
  return neon(url);
}

let schemaReady = false;
export async function ensureSchema() {
  if (schemaReady) return;
  const sql = db();
  await sql`CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    username TEXT NOT NULL,
    username_lc TEXT NOT NULL UNIQUE,
    phone TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    token_version INT NOT NULL DEFAULT 0,
    failed_count INT NOT NULL DEFAULT 0,
    locked_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS password_resets (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS user_state (
    user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    data JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`;
  schemaReady = true;
}

// ---------- Senhas ----------
function scrypt(password: string, salt: Buffer, len: number): Promise<Buffer> {
  return new Promise((resolve, reject) =>
    scryptCb(password, salt, len, (err, key) =>
      err ? reject(err) : resolve(key),
    ),
  );
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const key = await scrypt(password, salt, 64);
  return `scrypt$${salt.toString("hex")}$${key.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [kind, saltHex, keyHex] = stored.split("$");
  if (kind !== "scrypt" || !saltHex || !keyHex) return false;
  const expected = Buffer.from(keyHex, "hex");
  const actual = await scrypt(password, Buffer.from(saltHex, "hex"), expected.length);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export const sha256 = (value: string) =>
  createHash("sha256").update(value).digest("hex");

// ---------- Sessão (cookie assinado) ----------
const COOKIE = "session";
const SESSION_SECONDS = 60 * 60 * 24 * 30;

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 16) throw new Error("AUTH_SECRET ausente ou curta (mín. 16 caracteres)");
  return s;
}

const b64 = (value: string | Buffer) => Buffer.from(value).toString("base64url");
const sign = (payload: string) =>
  createHmac("sha256", secret()).update(payload).digest("base64url");

export function makeToken(userId: string, version: number) {
  const payload = b64(
    JSON.stringify({ u: userId, v: version, e: Math.floor(Date.now() / 1000) + SESSION_SECONDS }),
  );
  return `${payload}.${sign(payload)}`;
}

function readToken(token: string): { u: string; v: number } | null {
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = sign(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (typeof data.e !== "number" || data.e < Date.now() / 1000) return null;
    return { u: String(data.u), v: Number(data.v) };
  } catch {
    return null;
  }
}

const secureFlag = () => (process.env.VERCEL_ENV === "development" ? "" : "; Secure");

export function setSessionCookie(res: VercelResponse, userId: string, version: number) {
  res.setHeader(
    "Set-Cookie",
    `${COOKIE}=${makeToken(userId, version)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSION_SECONDS}${secureFlag()}`,
  );
}

export function clearSessionCookie(res: VercelResponse) {
  res.setHeader(
    "Set-Cookie",
    `${COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${secureFlag()}`,
  );
}

export interface SessionUser {
  id: string;
  username: string;
  phone: string;
}

export async function getSessionUser(req: VercelRequest): Promise<SessionUser | null> {
  const cookie = req.headers.cookie ?? "";
  const match = cookie.split(";").map((c) => c.trim()).find((c) => c.startsWith(`${COOKIE}=`));
  if (!match) return null;
  const token = readToken(match.slice(COOKIE.length + 1));
  if (!token) return null;
  await ensureSchema();
  const rows = await db()`SELECT id, username, phone, token_version FROM users WHERE id = ${token.u}`;
  const user = rows[0];
  if (!user || Number(user.token_version) !== token.v) return null;
  return { id: String(user.id), username: user.username, phone: user.phone };
}

// ---------- Validações ----------
export function normalizePhone(input: unknown): string | null {
  if (typeof input !== "string") return null;
  let digits = input.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.length === 10 || digits.length === 11) digits = `55${digits}`; // Brasil sem DDI
  return /^\d{12,15}$/.test(digits) ? digits : null;
}

export const validUsername = (u: unknown): u is string =>
  typeof u === "string" && /^[A-Za-z0-9_.-]{3,30}$/.test(u);

export const validPassword = (p: unknown): p is string =>
  typeof p === "string" && p.length >= 6 && p.length <= 200;

// ---------- Helpers de resposta ----------
export function send(res: VercelResponse, status: number, body: unknown) {
  res.status(status).setHeader("Cache-Control", "no-store").json(body);
}

type Handler = (req: VercelRequest, res: VercelResponse) => Promise<void>;

// Garante método, JSON e trata erros sem vazar detalhes
export function route(methods: string[], handler: Handler) {
  return async (req: VercelRequest, res: VercelResponse) => {
    try {
      if (!req.method || !methods.includes(req.method)) {
        res.setHeader("Allow", methods.join(", "));
        return send(res, 405, { error: "Método não permitido" });
      }
      if (req.method !== "GET") {
        const type = String(req.headers["content-type"] ?? "");
        if (!type.includes("application/json")) {
          return send(res, 415, { error: "Use application/json" });
        }
      }
      await handler(req, res);
    } catch (error) {
      console.error(error);
      send(res, 500, { error: "Erro interno do servidor" });
    }
  };
}

export const appUrl = (req: VercelRequest) =>
  (process.env.APP_URL ?? `https://${req.headers["x-forwarded-host"] ?? req.headers.host}`).replace(/\/$/, "");
