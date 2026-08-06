// PERSONAL SOLO-OPERATOR MODE (SINGLE_USER). Build-time flag, baked into the
// bundle by Vite from web/.env (VITE_SINGLE_USER=true) - the counterpart of the
// backend's SINGLE_USER env flag (src/config.ts). When true the SPA treats the
// operator as permanently signed in, hides every SaaS surface (login/register,
// pricing/upgrade, billing, 2FA, GDPR account tools, transparency/legal), and
// premium gating self-answers "entitled". The backend enforces its own flag
// independently; this one only shapes the UI. False (or unset) = the
// multi-tenant product build, byte-for-byte unchanged.
// Parsed with the SAME token set as the backend's bool() helper (src/config.ts)
// so VITE_SINGLE_USER=1 / yes / TRUE can't silently leave the SPA in product
// mode while the backend has unmounted the auth routes (a dead-end build).
const RAW = String(import.meta.env.VITE_SINGLE_USER ?? "").trim().toLowerCase();
export const SINGLE_USER: boolean = RAW === "true" || RAW === "1" || RAW === "yes";

/** The synthetic operator identity shown where the UI needs *a* user. */
export const OPERATOR_USER = { email: "operator@local", displayName: "Operator" } as const;
