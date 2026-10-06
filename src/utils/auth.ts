// Login local: a senha nunca é guardada em texto puro, só um hash com "sal".
// Atenção: tudo fica no navegador deste aparelho (não há servidor).

const AUTH_KEY = "finance-auth-v1";
const SESSION_KEY = "finance-session";

export interface Auth {
  name: string;
  salt: string;
  hash: string;
}

const enc = new TextEncoder();
const toHex = (buf: ArrayBuffer | Uint8Array) =>
  Array.from(new Uint8Array(buf as ArrayBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

async function hashPassword(password: string, salt: string): Promise<string> {
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const key = await crypto.subtle.importKey(
      "raw",
      enc.encode(password),
      "PBKDF2",
      false,
      ["deriveBits"],
    );
    const bits = await crypto.subtle.deriveBits(
      { name: "PBKDF2", salt: enc.encode(salt), iterations: 100000, hash: "SHA-256" },
      key,
      256,
    );
    return toHex(bits);
  }
  // Alternativa simples quando o navegador não oferece crypto.subtle (ex.: http fora do localhost)
  let h = 5381;
  const text = `${salt}:${password}`;
  for (let r = 0; r < 2000; r++) {
    for (let i = 0; i < text.length; i++) {
      h = ((h << 5) + h + text.charCodeAt(i) + r) | 0;
    }
  }
  return `weak-${(h >>> 0).toString(16)}`;
}

export function readAuth(): Auth | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? (JSON.parse(raw) as Auth) : null;
  } catch {
    return null;
  }
}

export async function createAuth(name: string, password: string): Promise<Auth> {
  const salt = toHex(crypto.getRandomValues(new Uint8Array(16)));
  const auth: Auth = {
    name: name.trim(),
    salt,
    hash: await hashPassword(password, salt),
  };
  try {
    localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
  } catch {
    /* ignora */
  }
  return auth;
}

export async function verifyAuth(
  auth: Auth,
  name: string,
  password: string,
): Promise<boolean> {
  if (name.trim().toLowerCase() !== auth.name.toLowerCase()) return false;
  return (await hashPassword(password, auth.salt)) === auth.hash;
}

export function isSessionActive(): boolean {
  try {
    return sessionStorage.getItem(SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

export function setSession(active: boolean) {
  try {
    if (active) sessionStorage.setItem(SESSION_KEY, "1");
    else sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignora */
  }
}
