/**
 * Validates a post-login redirect target (the `?next=` query param).
 * Only same-app paths are accepted — anything else (absolute URLs,
 * protocol-relative `//host`, `/\host`) falls back to `fallback`, so the
 * login page can't be used as an open redirect.
 */
export function getSafeRedirect(next: string | null | undefined, fallback = "/"): string {
  if (!next) return fallback;
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}

/** Builds the login URL that brings the user back to `path` after signing in. */
export function loginUrlFor(path: string): string {
  return `/login?next=${encodeURIComponent(path)}`;
}
