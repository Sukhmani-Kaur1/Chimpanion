import { NextResponse } from "next/server";
import { SESSION_COOKIE, adminConfig, createSession, safeNext, sha256, timingSafeEqual } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const cfg = adminConfig();
  const form = await request.formData();
  const next = safeNext(String(form.get("next") ?? ""));

  if (!cfg) {
    return NextResponse.redirect(new URL("/admin/login?error=unconfigured", request.url), 303);
  }

  // Compare digests so the comparison time doesn't depend on the password's length.
  const supplied = await sha256(String(form.get("password") ?? ""));
  if (!timingSafeEqual(supplied, await sha256(cfg.password))) {
    await new Promise((r) => setTimeout(r, 400));
    return NextResponse.redirect(new URL(`/admin/login?error=wrong&next=${encodeURIComponent(next)}`, request.url), 303);
  }

  const { token, expires } = await createSession(cfg.secret);
  const response = NextResponse.redirect(new URL(next, request.url), 303);
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires,
  });
  return response;
}
