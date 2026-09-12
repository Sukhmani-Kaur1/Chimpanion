/**
 * The visitor's country as reported by the hosting edge (Vercel, Cloudflare or CloudFront).
 * Nothing is stored — no cookie, no log. Returns `null` locally or on hosts that don't set it.
 */
export const dynamic = "force-dynamic";

export function GET(request: Request) {
  const h = request.headers;
  const raw = h.get("x-vercel-ip-country") ?? h.get("cf-ipcountry") ?? h.get("cloudfront-viewer-country");
  const country = raw && /^[A-Za-z]{2}$/.test(raw) ? raw.toUpperCase() : null;
  return Response.json({ country }, { headers: { "Cache-Control": "private, no-store" } });
}
