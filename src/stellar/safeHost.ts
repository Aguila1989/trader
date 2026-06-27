// SEC-06: SSRF guard for the SDK's domain resolvers (stellar.toml + federation).
// A user-supplied homeDomain / federation domain is fetched server-side by the
// Stellar SDK, so an attacker could point it at an internal address to probe the
// network or tarpit the process. We refuse anything that isn't a plausibly
// PUBLIC DNS hostname: IP literals and private / loopback / link-local / internal
// names are rejected before any request is made. (DNS that resolves a public
// name to a private A record is out of scope here; the per-call timeout bounds
// the tarpit case.)

const IPV4 = /^\d{1,3}(\.\d{1,3}){3}$/;
// mDNS / RFC 6762 / common corp + reserved zones that must never be fetched.
const INTERNAL_SUFFIX =
  /\.(local|localhost|internal|intranet|lan|home|corp|test|example|invalid)$/i;

/**
 * Throw (with a generic message) when `domain` is not a safe public hostname to
 * fetch from. Accepts a bare domain ("centre.io"); for a federation address
 * ("name*centre.io") pass the domain half.
 */
export function assertPublicDomain(domain: string): void {
  const host = domain.trim().toLowerCase().replace(/\.$/, ""); // drop trailing dot
  const bad = (): never => {
    throw new Error("destination domain is not allowed");
  };
  if (!host) bad();
  if (host === "localhost") bad();
  if (host.includes(":")) bad(); // IPv6 literal or host:port - not a plain domain
  if (host.startsWith("[")) bad(); // [IPv6]
  if (IPV4.test(host)) bad(); // any IPv4 literal (127.x / 10.x / 192.168.x / 169.254.x / ...)
  if (!host.includes(".")) bad(); // bare hostname -> internal
  if (INTERNAL_SUFFIX.test(host)) bad();
}
