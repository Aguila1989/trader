/**
 * The ONE scroll utility (2026-07 Feature 3, Bug 1). Every scroll-to-target in
 * the app routes through here so header-offset handling stays consistent —
 * do not call scrollIntoView or hand-compute window.scrollTo offsets elsewhere.
 *
 * align:
 *   "top"     (default) scrolls the window so the target sits just below the
 *             sticky header (its real measured height) plus a 16px breather —
 *             the fix for anchors landing hidden underneath the header.
 *   "center"/"nearest" keep the native scrollIntoView placements used by the
 *             trustlines panel and the onboarding tour (a header offset makes
 *             no sense for those placements).
 */
export type ScrollAlign = "top" | "center" | "nearest";

export function scrollToSection(
  target: string | HTMLElement | null | undefined,
  opts: { align?: ScrollAlign; smooth?: boolean } = {},
): void {
  const el =
    typeof target === "string" ? document.getElementById(target) : (target ?? null);
  if (!el) return;
  const align = opts.align ?? "top";
  // smooth:false is for callers that MEASURE right after scrolling (the
  // onboarding tour) — an animation would corrupt the measurement.
  const behavior: ScrollBehavior = opts.smooth === false ? "auto" : "smooth";
  try {
    if (align === "top") {
      const headerHeight = document.querySelector("header")?.offsetHeight ?? 0;
      const top = el.getBoundingClientRect().top + window.scrollY - headerHeight - 16;
      window.scrollTo({ top: Math.max(0, top), behavior });
    } else {
      el.scrollIntoView({ behavior, block: align, inline: "nearest" });
    }
  } catch {
    /* non-browser / very old engine — scrolling is best-effort */
  }
}

/** Companion: smooth-scroll the window back to the top (page transitions). */
export function scrollToTop(): void {
  try {
    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch {
    /* ignore */
  }
}
