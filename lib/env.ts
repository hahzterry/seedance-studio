export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable ${name}`);
  return value;
}

/** Reads HF_CREDENTIALS ("key-id:key-secret"), the same variable the official SDK uses. */
export function higgsfieldCredentials(): { keyId: string; keySecret: string } {
  // Trim whitespace to guard against copy-paste errors in Vercel
  let raw = requireEnv("HF_CREDENTIALS").trim();

  // If the user accidentally included the "Key " prefix in the env var, strip it.
  // (The code in lib/higgsfield.ts adds "Key " to the header automatically.)
  if (raw.startsWith("Key ")) {
    raw = raw.slice(4).trim();
  }

  const sep = raw.indexOf(":");
  if (sep <= 0 || sep === raw.length - 1) {
    throw new Error("HF_CREDENTIALS must be in key-id:key-secret format (without the 'Key ' prefix)");
  }

  return { keyId: raw.slice(0, sep), keySecret: raw.slice(sep + 1) };
}
