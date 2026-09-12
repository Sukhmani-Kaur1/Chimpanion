import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, adminConfig, verifySession } from "./lib/admin-auth";

/** Guards every admin route. The login page itself has to stay reachable. */
export const config = { matcher: ["/admin/:path*"] };

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/admin/login") return NextResponse.next();

  const cfg = adminConfig();
  if (cfg && (await verifySession(request.cookies.get(SESSION_COOKIE)?.value, cfg.secret))) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = "/admin/login";
  url.search = pathname === "/admin" ? "" : `?next=${encodeURIComponent(pathname)}`;
  return NextResponse.redirect(url);
}
