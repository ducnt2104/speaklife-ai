/**
 * SpeakLife AI — Defense-in-Depth Input Sanitization & Anti-Injection Guards
 * Protects against NoSQL Injection, XSS, and payload exhaustion attacks.
 */

/**
 * Escapes HTML control characters to prevent Stored & Reflected XSS.
 */
export function sanitizeHtml(input: string): string {
  if (typeof input !== "string") return "";
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

/**
 * Strips null bytes and invisible control characters.
 */
export function stripControlCharacters(input: string): string {
  if (typeof input !== "string") return "";
  return input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
}

/**
 * Recursively removes MongoDB operator keys (starting with $) to neutralize NoSQL Injection.
 */
export function sanitizeNoSql<T>(payload: T): T {
  if (payload === null || typeof payload !== "object") {
    return payload;
  }

  if (Array.isArray(payload)) {
    return payload.map((item) => sanitizeNoSql(item)) as unknown as T;
  }

  const cleanObject: Record<string, any> = {};
  for (const [key, value] of Object.entries(payload as Record<string, any>)) {
    // Drop any key that starts with a dollar sign or contains a dot
    if (key.startsWith("$") || key.includes(".")) {
      console.warn(`[Security Alert] Rejected potentially malicious MongoDB operator key: ${key}`);
      continue;
    }
    cleanObject[key] = sanitizeNoSql(value);
  }

  return cleanObject as T;
}

/**
 * Enforces maximum string length to prevent memory exhaustion and token budget abuse.
 */
export function truncateSafe(input: string, maxLength: number = 4000): string {
  if (typeof input !== "string") return "";
  return input.slice(0, maxLength);
}
