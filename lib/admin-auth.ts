/**
 * Session handling for the admin area. Runs on the edge, so it uses Web Crypto rather than
 * node:crypto. The password never reaches the browser and the cookie is HttpOnly, signed and
 * time-limited; without both env vars set, the admin area stays shut.
 */
export const SESSION_COOKIE = "chimpanion_admin";
const TTL_MS = 12 * 60 * 60 * 1000;
const enc = new TextEncoder();

const hex = (buf: ArrayBuffer) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");

export async function sha256(value: string): Promise<string> {
  return hex(await crypto.subtle.digest("SHA-256", enc.encode(value)));
}

async function sign(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return hex(await crypto.subtle.sign("HMAC", key, enc.encode(data)));
}

/** Compares without leaking where two equal-length strings differ. */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function createSession(secret: string): Promise<{ token: string; expires: Date }> {
  const exp = Date.now() + TTL_MS;
  return { token: `${exp}.${await sign(secret, String(exp))}`, expires: new Date(exp) };
}

export async function verifySession(token: string | undefined, secret: string): Promise<boolean> {
  if (!token) return false;
  const [expPart, signature] = token.split(".");
  const exp = Number(expPart);
  if (!signature || !Number.isFinite(exp) || exp <= Date.now()) return false;
  return timingSafeEqual(signature, await sign(secret, expPart));
}

/** Both must be set, or the admin area refuses to open at all. */
export function adminConfig(): { password: string; secret: string } | null {
  const password = process.env.ADMIN_PASSWORD;
  const secret = process.env.ADMIN_SECRET;
  return password && secret ? { password, secret } : null;
}

/** Only ever redirect back into the admin area — never to an attacker's URL. */
export function safeNext(next: string | undefined | null): string {
  return next && next.startsWith("/admin") && !next.startsWith("//") ? next : "/admin";
}
