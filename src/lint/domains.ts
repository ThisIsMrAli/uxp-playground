/** Matches a URL against manifest v5 requiredPermissions.network.domains (supports "all" and "https://*.example.com"). */
export function domainAllowed(url: string, domains: unknown): boolean {
  if (domains === 'all') return true;
  if (!Array.isArray(domains)) return false;
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return true; // relative or dynamic URL: cannot judge statically
  }
  return domains.some((d) => {
    let p: URL;
    try {
      p = new URL(String(d).replace('*.', 'wildcard.'));
    } catch {
      return false;
    }
    if (p.protocol !== u.protocol) return false;
    if (p.hostname.startsWith('wildcard.')) {
      const base = p.hostname.slice('wildcard.'.length);
      return u.hostname === base || u.hostname.endsWith('.' + base);
    }
    return p.hostname === u.hostname;
  });
}
