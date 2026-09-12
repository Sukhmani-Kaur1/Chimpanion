import type { Metadata } from "next";
import { adminConfig, safeNext } from "@/lib/admin-auth";

export const metadata: Metadata = { title: "Sign in" };
export const dynamic = "force-dynamic";

const MESSAGES: Record<string, string> = {
  wrong: "That password didn't match. Try again.",
  unconfigured: "Admin access isn't set up on this deployment yet — ADMIN_PASSWORD and ADMIN_SECRET are missing.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error, next } = await searchParams;
  const configured = adminConfig() !== null;

  return (
    <div className="login">
      <form className="logincard" action="/api/admin/login" method="post">
        <div className="kicker">CHIMPANION ADMIN</div>
        <h1>Sign in</h1>
        {error && <p className="formerr">{MESSAGES[error] ?? "Something went wrong. Try again."}</p>}
        {!configured && !error && (
          <p className="formerr">
            Set <code>ADMIN_PASSWORD</code> and <code>ADMIN_SECRET</code> in your environment to open the
            admin area.
          </p>
        )}
        <input type="hidden" name="next" value={safeNext(next)} />
        <label className="pf-label" htmlFor="password">
          Password
        </label>
        <input
          className="field"
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          autoFocus
          required
        />
        <button className="pill dark" type="submit" style={{ width: "100%" }}>
          Sign in
        </button>
        <p className="plain">Internal tool. Nothing here is public, and it isn&apos;t indexed.</p>
      </form>
    </div>
  );
}
