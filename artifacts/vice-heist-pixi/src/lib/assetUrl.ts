/**
 * Resolve a file in `static/` against the game's actual host path.
 * Stake Engine mounts games at /{game}/v{version}/ — never use root-absolute
 * `/assets/...` URLs (those 404 on the operator CDN).
 */
export function assetUrl(path: string): string {
  const clean = path.replace(/^\//, "");
  if (typeof document === "undefined") return `./${clean}`;
  return new URL(clean, document.baseURI).href;
}
