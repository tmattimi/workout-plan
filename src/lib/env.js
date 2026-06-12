// ─────────────────────────────────────────────────────────────────────────────
// env.js — platform & URL abstraction
//
// Purpose: keep every assumption about "where the app is running" in ONE place so
// that wrapping the app in a native shell (Capacitor) later is a change to this
// file rather than a hunt through the whole codebase.
//
// On the web today, every function below behaves exactly as the old inline
// window.location calls did — there is no behavior change. When the app is
// wrapped with Capacitor for the App Store, only the marked sections change.
// ─────────────────────────────────────────────────────────────────────────────

// The canonical public web address of the app. Used for building links inside
// emails (invites, password resets, messages) that must open in a browser and
// point back at the real deployed site — NOT at the native app's local origin.
//
// On web this can stay as window.location.origin. In a native build,
// window.location.origin is a local/file origin (e.g. capacitor://localhost),
// which is useless in an email, so the native build must hardcode the real URL.
//
// To override at build time, set REACT_APP_PUBLIC_URL in the environment.
const PUBLIC_WEB_URL =
  (typeof process !== "undefined" && process.env && process.env.REACT_APP_PUBLIC_URL) ||
  null;

// ── Platform detection ───────────────────────────────────────────────────────
// Capacitor injects window.Capacitor when running inside the native shell.
// On the plain web this is always false, so isNative() === false today.
export function isNative() {
  return typeof window !== "undefined" && !!window.Capacitor?.isNativePlatform?.();
}

export function isWeb() {
  return !isNative();
}

// ── URLs ─────────────────────────────────────────────────────────────────────

// The base URL to put inside emails / external links that must resolve to the
// real website. On web: the current origin (same as before). In native: the
// hardcoded public site, because the local origin is meaningless externally.
export function publicWebUrl() {
  if (PUBLIC_WEB_URL) return PUBLIC_WEB_URL.replace(/\/$/, "");
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return "";
}

// Where Supabase should send users back to after they click an email link
// (invite, signup confirmation, password reset). These links open in a browser,
// so they should always target the public web URL, even from the native app.
// Pass an optional path like "reset-password".
export function authRedirectUrl(path = "") {
  const clean = path.replace(/^\//, "");
  return `${publicWebUrl()}/${clean}`;
}

// Build a client setup/invite link the coach can copy and send.
export function clientSetupLink(accessToken) {
  return `${publicWebUrl()}?client=${accessToken}`;
}

// ── Auth tokens delivered via URL ─────────────────────────────────────────────
// When a client clicks an invite/reset email, Supabase appends tokens to the URL
// hash (#access_token=...&type=invite). On the web the link lands in the app and
// we read them here. In native, this same hash arrives via a deep link / app URL
// open event — wiring that up is a Capacitor-phase task, but every place that
// needs "are there auth tokens to consume?" should call THIS, not read the hash
// directly, so the native deep-link handler has a single seam to feed.
export function getAuthTokenHash() {
  if (typeof window === "undefined") return "";
  return window.location?.hash || "";
}

export function hasAuthTokensInUrl() {
  const hash = getAuthTokenHash();
  return (
    hash.includes("access_token") ||
    hash.includes("type=invite") ||
    hash.includes("type=recovery")
  );
}

// Read a query param (e.g. ?client=TOKEN). On web this reads the real query
// string; the native deep-link handler can later feed the same value here.
export function getQueryParam(name) {
  if (typeof window === "undefined") return null;
  try {
    return new URLSearchParams(window.location.search).get(name);
  } catch {
    return null;
  }
}

// ── Navigation primitives ─────────────────────────────────────────────────────
// Centralized so native can override (e.g. push notifications/route changes that
// shouldn't do a hard browser navigation).

// Hard-navigate the browser to a full external URL (e.g. a Stripe checkout page).
// In native this should open the system browser instead; that's a Capacitor
// Browser plugin swap, isolated to here.
export function openExternalUrl(url) {
  if (typeof window !== "undefined") window.location.href = url;
}

// Strip the auth-token hash from the URL after consuming it, without reloading.
// No-op-safe in environments without history.
export function clearUrlHash() {
  if (typeof window !== "undefined" && window.history?.replaceState) {
    window.history.replaceState(null, "", window.location.pathname);
  }
}

// How the app decides which "surface" to show at launch (coach vs client).
// TODAY (web): derived from the URL path (/coach). This is the ONE piece of
// entry logic that genuinely cannot work as-is in native, because a native shell
// has no URL path — it always loads at the root origin. When we wrap the app,
// this must be replaced with a non-URL signal (a stored role, the logged-in
// user's role from Supabase, or a build flag). Centralizing it here means that
// rework happens in one function instead of in index.js routing.
export function launchSurface() {
  if (isNative()) {
    // PLACEHOLDER for the native build. Until coach/client role detection is
    // wired (Capacitor phase), native always opens the client surface, which is
    // the surface real app users get. Coaches use the web dashboard.
    return "client";
  }
  const path = typeof window !== "undefined" ? window.location.pathname : "/";
  return path.startsWith("/coach") ? "coach" : "client";
}
