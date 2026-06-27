// SEC-06: SSRF guard for the SDK's domain resolvers (stellar.toml + federation).
// A user-supplied homeDomain / federation domain is fetched server-side by the
// Stellar SDK, so an attacker could point it at an internal address to probe the
// network or tarpit the process. Two layers:
//   1. assertPublicDomain() - cheap syntactic reject of IP literals + internal
//      names BEFORE any lookup.
//   2. assertDnsPublic() - resolves the name and rejects it if ANY resolved
//      address is private / loopback / link-local (closes the "alias a public
//      name to 127.0.0.1" trick, e.g. localhost.example.com).
// A determined DNS-rebind (public answer to us, private answer to the SDK) is
// still out of scope without IP-pinning the SDK's own fetch; the 20s SDK timeout
// (client.ts) bounds the tarpit case.

import { promises as dns } from "node:dns";

const IPV4 = /^\d{1,3}(\.\d{1,3}){3}$/;
// mDNS / RFC 6762 / common corp + reserved zones that must never be fetched.
const INTERNAL_SUFFIX =
  /\.(local|localhost|internal|intranet|lan|home|corp|test|example|invalid)$/i;

/**
 * Throw (with a generic message) when `domain` is not a syntactically-safe
 * public hostname. Accepts a bare domain ("centre.io"); for a federation address
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

/** True for a private / loopback / link-local / reserved IP (v4 or v6). A
 *  malformed value is treated as unsafe (true). */
export function isPrivateAddress(ip: string, family?: number): boolean {
  const s = ip.toLowerCase();
  if (family === 6 || s.includes(":")) {
    if (s === "::1" || s === "::") return true; // loopback / unspecified
    if (s.startsWith("fe80")) return true; // link-local
    if (s.startsWith("fc") || s.startsWith("fd")) return true; // unique-local (ULA)
    const mapped = s.match(/::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/); // IPv4-mapped
    if (mapped) return isPrivateAddress(mapped[1] as string, 4);
    return false;
  }
  const o = s.split(".").map(Number);
  if (o.length !== 4 || o.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return true;
  const [a, b] = o as [number, number, number, number];
  if (a === 0 || a === 127) return true; // this-network / loopback
  if (a === 10) return true; // private
  if (a === 172 && b >= 16 && b <= 31) return true; // private
  if (a === 192 && b === 168) return true; // private
  if (a === 169 && b === 254) return true; // link-local + cloud metadata (169.254.169.254)
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
  if (a >= 224) return true; // multicast / reserved
  return false;
}

/**
 * Syntactic check + DNS resolution: refuse a domain that resolves to any
 * non-public address. Used by the resolvers before the SDK fetches.
 */
export async function assertDnsPublic(domain: string): Promise<void> {
  assertPublicDomain(domain);
  const host = domain.trim().replace(/\.$/, "");
  let addrs: { address: string; family: number }[];
  try {
    addrs = await dns.lookup(host, { all: true });
  } catch {
    throw new Error("destination domain is not allowed");
  }
  if (addrs.length === 0) throw new Error("destination domain is not allowed");
  for (const a of addrs) {
    if (isPrivateAddress(a.address, a.family)) {
      throw new Error("destination domain is not allowed");
    }
  }
}
