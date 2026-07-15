/**
 * Autenticación por PIN de 4 dígitos (un solo usuario, el dueño).
 * No hay tabla de usuarios: el PIN vive en process.env.PIN_CODE.
 *
 * En la cookie NO se guarda el PIN en claro, sino un hash SHA-256 de
 * (SALT + PIN). El middleware valida que la cookie coincida con ese hash.
 * Usa Web Crypto, disponible tanto en el runtime Edge (middleware) como en Node.
 */
export const AUTH_COOKIE = "fp_session";
const SALT = "factura-pos::session::v1";

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Comparación en tiempo (cuasi) constante para evitar timing attacks. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/** Token de sesión derivado del PIN configurado. */
export async function sessionToken(): Promise<string> {
  const pin = process.env.PIN_CODE;
  if (!pin) throw new Error("Falta la variable de entorno PIN_CODE");
  const data = new TextEncoder().encode(`${SALT}:${pin}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return toHex(digest);
}

/** Valida la cookie de sesión contra el token esperado. */
export async function isValidToken(token: string | undefined): Promise<boolean> {
  if (!token || !process.env.PIN_CODE) return false;
  return safeEqual(token, await sessionToken());
}

/** Valida el PIN ingresado en el login contra process.env.PIN_CODE. */
export function isValidPin(pin: string): boolean {
  const expected = process.env.PIN_CODE ?? "";
  if (!expected) return false;
  return safeEqual(pin, expected);
}
