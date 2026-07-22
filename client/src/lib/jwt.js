/**
 * Decode a JWT payload without verifying the signature.
 * Signature checks stay on the server; the client only reads `exp` for logout timing.
 *
 * @param {string} token
 * @returns {{ exp?: number, userID?: string } | null}
 */
export function decodeToken(token) {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null

    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = payload.padEnd(payload.length + ((4 - (payload.length % 4)) % 4), '=')
    const json = atob(padded)
    return JSON.parse(json)
  } catch {
    return null
  }
}

/**
 * Milliseconds until the token expires. Returns 0 if already expired or invalid.
 *
 * @param {string} token
 * @returns {number}
 */
export function msUntilExpiry(token) {
  const payload = decodeToken(token)
  if (!payload?.exp) return 0

  const remaining = payload.exp * 1000 - Date.now()
  return remaining > 0 ? remaining : 0
}

/**
 * @param {string} token
 * @returns {boolean}
 */
export function isTokenExpired(token) {
  return msUntilExpiry(token) === 0
}
