export function generateSecureKey(length: number = 32): string {
  const byteLength = Math.ceil((length * 3) / 4) // base64 expands by ~4/3
  const randomBytes = crypto.getRandomValues(new Uint8Array(byteLength))
  const base64 = btoa(String.fromCharCode(...randomBytes))
  const urlSafe = base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
  return urlSafe.slice(0, length) // ensure exact length
}
