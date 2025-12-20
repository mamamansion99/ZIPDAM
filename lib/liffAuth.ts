export interface LiffAuth {
  idToken?: string | null;
  lineUserId?: string;
  displayName?: string;
  pictureUrl?: string;
}

let currentAuth: LiffAuth = {};

export function setLiffAuth(auth: LiffAuth) {
  currentAuth = auth;
  if (typeof window !== 'undefined') {
    // stash on window for easy access without prop drilling
    (window as any).__zipdamAuth = auth;
    try {
      window.dispatchEvent(new CustomEvent('zipdam-auth-changed', { detail: auth }));
    } catch (_) {
      // ignore if CustomEvent not available
    }
  }
}

export function getLiffAuth(): LiffAuth {
  if (currentAuth.idToken || currentAuth.lineUserId) return currentAuth;
  if (typeof window !== 'undefined') {
    const fromWin = (window as any).__zipdamAuth;
    if (fromWin) {
      currentAuth = fromWin;
    }
  }
  return currentAuth;
}
