/**
 * UXP versions named in Adobe's Photoshop UXP changelog
 * (https://developer.adobe.com/photoshop/uxp/2022/ps-reference/changelog/, snapshot retrieved 2026-11-09).
 * The Photoshop version is the release whose changelog entry first mentions that UXP version.
 */
export const PS_UXP_TABLE: { ps: string; uxp: string; released: string }[] = [
  { ps: '24.1', uxp: '6.4', released: 'December 2022' },
  { ps: '24.2', uxp: '6.5', released: 'February 2023' },
  { ps: '24.4', uxp: '7.0', released: 'April 2023' },
  { ps: '24.5', uxp: '7.1', released: 'May 2023' },
  { ps: '25.0', uxp: '7.2', released: 'September 2023' },
  { ps: '25.2', uxp: '7.3', released: 'October 2023' },
  { ps: '25.5', uxp: '7.4', released: 'February 2024' },
  { ps: '26.0', uxp: '8.0', released: 'October 2024' },
  { ps: '26.1', uxp: '8.1', released: 'November 2024' },
  { ps: '26.8', uxp: '8.3', released: 'June 2025' },
  { ps: '26.9', uxp: '8.4', released: 'July 2025' },
  { ps: '26.10', uxp: '9.0', released: 'August 2025' },
  { ps: '27.4', uxp: '9.2', released: 'February 2026' }
];

/** UXP versions offered in the selector. */
export const UXP_VERSIONS = ['6.0', '6.4', '6.5', '7.0', '7.1', '7.2', '7.3', '7.4', '8.0', '8.1', '8.2', '8.3', '8.4', '9.0', '9.1', '9.2', '9.4'];

export function cmpVersion(a: string, b: string): number {
  const pa = String(a).split('.').map((n) => parseInt(n, 10) || 0);
  const pb = String(b).split('.').map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d) return d < 0 ? -1 : 1;
  }
  return 0;
}

/** Best-known UXP version that ships with a Photoshop version (from the table above); null if older than the table. */
export function uxpForPhotoshop(psVersion: string): string | null {
  let found: string | null = null;
  for (const row of PS_UXP_TABLE) if (cmpVersion(psVersion, row.ps) >= 0) found = row.uxp;
  return found;
}

/**
 * ECMAScript level for linting. Jaroslav Bereza reported (forum thread 9050, Jan 2025) that UXP 8 upgraded V8
 * and Photoshop 2024 (UXP 7) supported ECMAScript 2022.
 */
export function ecmaVersionFor(uxp: string): 2022 | 2024 {
  return cmpVersion(uxp, '8.0') >= 0 ? 2024 : 2022;
}
