/** Local session: a random token stored in localStorage that maps to a player row. */

const KEY = 'expedition31.session'

export function getSessionToken(): string | null {
  return localStorage.getItem(KEY)
}

export function setSessionToken(token: string): void {
  localStorage.setItem(KEY, token)
}

export function clearSession(): void {
  localStorage.removeItem(KEY)
}

export function newSessionToken(): string {
  // crypto.randomUUID is available in all target browsers (modern iOS/Android).
  return crypto.randomUUID()
}
