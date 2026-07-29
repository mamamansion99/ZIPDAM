export interface LiffAuth {
  idToken?: string | null;
  lineUserId?: string;
  displayName?: string;
  pictureUrl?: string;
}

let currentAuth: LiffAuth = {};
let initializationPromise: Promise<LiffAuth | null> | null = null;
const DEFAULT_LIFF_ID = "2008727011-FNiAJIzb";
const REAUTH_STARTED_AT_KEY = "zipdam_liff_reauth_started_at";
const RESUME_CART_KEY = "zipdam_resume_cart";

export class LiffReauthStartedError extends Error {
  constructor() {
    super("LINE session refresh started");
    this.name = "LiffReauthStartedError";
  }
}

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

export function isIdTokenExpired(
  idToken?: string | null,
  clockSkewSeconds = 60,
) {
  if (!idToken) return true;
  try {
    const encodedPayload = idToken.split(".")[1];
    if (!encodedPayload) return true;
    const normalized = encodedPayload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      "=",
    );
    const payload = JSON.parse(atob(padded));
    const expiresAt = Number(payload?.exp);
    if (!Number.isFinite(expiresAt)) return true;
    return expiresAt <= Math.floor(Date.now() / 1000) + clockSkewSeconds;
  } catch (_) {
    return true;
  }
}

function getLiffId() {
  if (typeof window === "undefined") return DEFAULT_LIFF_ID;
  return (
    (window as any).__ZIPDAM_LIFF_ID ||
    (window as any).NEXT_PUBLIC_LIFF_ID ||
    DEFAULT_LIFF_ID
  );
}

function getLoginRedirectUri() {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}${window.location.pathname}`;
}

function clearReauthMarker() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(REAUTH_STARTED_AT_KEY);
}

function clearLiffCallbackParameters() {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  let changed = false;
  ["code", "state", "liffClientId", "liffRedirectUri"].forEach((key) => {
    if (url.searchParams.has(key)) {
      url.searchParams.delete(key);
      changed = true;
    }
  });
  if (changed) {
    const query = url.searchParams.toString();
    window.history.replaceState(
      window.history.state,
      "",
      `${url.pathname}${query ? `?${query}` : ""}${url.hash}`,
    );
  }
}

async function beginLiffReauth(liff: any): Promise<never> {
  if (typeof window === "undefined") {
    throw new Error("LINE authentication is unavailable");
  }

  const previousAttempt = Number(
    window.sessionStorage.getItem(REAUTH_STARTED_AT_KEY) || 0,
  );
  if (previousAttempt && Date.now() - previousAttempt < 15_000) {
    throw new Error(
      "เซสชัน LINE หมดอายุ กรุณาปิดหน้านี้แล้วเปิดผ่าน LINE อีกครั้ง",
    );
  }

  setLiffAuth({});
  window.sessionStorage.setItem(REAUTH_STARTED_AT_KEY, String(Date.now()));
  window.sessionStorage.setItem(RESUME_CART_KEY, "1");

  if (liff.isInClient?.()) {
    window.location.reload();
  } else {
    if (liff.isLoggedIn?.()) liff.logout();
    window.location.replace(getLoginRedirectUri());
  }

  throw new LiffReauthStartedError();
}

export function isExpiredLineTokenError(value: unknown) {
  return /idtoken expired|invalid id token|token verify failed/i.test(
    String(value || ""),
  );
}

export async function restartLiffAuth(): Promise<never> {
  const liff = (await import("@line/liff")).default;
  if (!liff.id) {
    await liff.init({
      liffId: getLiffId(),
      withLoginOnExternalBrowser: true,
    });
    await liff.ready;
  }
  return beginLiffReauth(liff);
}

async function runLiffInitialization(
  liffId = getLiffId(),
): Promise<LiffAuth | null> {
  const liff = (await import("@line/liff")).default;
  await liff.init({
    liffId,
    withLoginOnExternalBrowser: true,
  });
  await liff.ready;

  if (!liff.isLoggedIn()) {
    return beginLiffReauth(liff);
  }

  const idToken = liff.getIDToken?.();
  if (isIdTokenExpired(idToken)) {
    return beginLiffReauth(liff);
  }

  const profile = await liff.getProfile();
  if (!isRealLineUserId(profile?.userId)) {
    throw new Error("ไม่สามารถยืนยันบัญชี LINE ได้");
  }

  const auth = {
    idToken,
    lineUserId: profile.userId,
    displayName: profile.displayName || "LINE customer",
    pictureUrl: profile.pictureUrl,
  };
  clearReauthMarker();
  clearLiffCallbackParameters();
  setLiffAuth(auth);
  return auth;
}

export function initializeLiffAuth(
  liffId = getLiffId(),
): Promise<LiffAuth | null> {
  if (!initializationPromise) {
    initializationPromise = runLiffInitialization(liffId).catch((error) => {
      initializationPromise = null;
      throw error;
    });
  }
  return initializationPromise;
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
    if (initializationPromise) {
      await initializationPromise;
    }
    const liff = (await import("@line/liff")).default;
    if (!liff.id) {
      await initializeLiffAuth(getLiffId());
    }
    if (!liff?.isLoggedIn || !liff.isLoggedIn()) {
      return beginLiffReauth(liff);
    }

    const idToken = liff.getIDToken?.();
    if (isIdTokenExpired(idToken)) {
      return beginLiffReauth(liff);
    }

    const profile = await liff.getProfile();

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
    clearReauthMarker();
    clearLiffCallbackParameters();
    setLiffAuth(nextAuth);
    return nextAuth;
  } catch (error) {
    if (error instanceof LiffReauthStartedError) throw error;
    if (error instanceof Error && error.message === authError) throw error;
    if (
      error instanceof Error &&
      error.message.includes("กรุณาปิดหน้านี้แล้วเปิดผ่าน LINE")
    ) {
      throw error;
    }
    throw new Error(authError);
  }
}
