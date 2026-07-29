export interface LiffAuth {
  idToken?: string | null;
  lineUserId?: string;
  displayName?: string;
  pictureUrl?: string;
}

let currentAuth: LiffAuth = {};

export const isRealLineUserId = (value?: string | null) =>
  /^U[0-9a-f]{32}$/i.test(String(value || "").trim());

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

export async function requireLiffAuth(): Promise<{
  idToken: string;
  lineUserId: string;
  displayName: string;
  pictureUrl?: string;
}> {
  const authError =
    "ไม่สามารถยืนยันบัญชี LINE ได้ กรุณาเปิดหน้านี้ใน LINE แล้วเข้าสู่ระบบอีกครั้ง";

  try {
    const liff = (await import("@line/liff")).default;
    if (!liff?.isLoggedIn || !liff.isLoggedIn()) {
      throw new Error(authError);
    }

    const [idToken, profile] = await Promise.all([
      Promise.resolve(liff.getIDToken && liff.getIDToken()),
      liff.getProfile(),
    ]);

    if (!idToken || !isRealLineUserId(profile?.userId)) {
      throw new Error(authError);
    }

    const nextAuth = {
      idToken,
      lineUserId: profile.userId,
      displayName:
        profile.displayName || getLiffAuth().displayName || "LINE customer",
      pictureUrl: profile.pictureUrl,
    };
    setLiffAuth(nextAuth);
    return nextAuth;
  } catch (error) {
    if (error instanceof Error && error.message === authError) throw error;
    throw new Error(authError);
  }
}
