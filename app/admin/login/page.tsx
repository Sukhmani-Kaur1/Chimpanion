import type { Metadata } from "next";
import { adminConfig, safeNext } from "@/lib/admin-auth";
import { pillClass } from "@/components/ui/Button";
import { fieldClass } from "@/components/ui/Layout";
import Typography from "@/components/ui/Typography";

export const metadata: Metadata = { title: "Sign in" };
export const dynamic = "force-dynamic";

const MESSAGES: Record<string, string> = {
  wrong: "That password didn't match. Try again.",
  unconfigured: "Admin access isn't set up on this deployment yet — ADMIN_PASSWORD and ADMIN_SECRET are missing.",
};

const errorBox = "rounded-[10px] bg-warn-bg px-3 py-2.5 text-sm font-semibold text-warn";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error, next } = await searchParams;
  const configured = adminConfig() !== null;

  return (
    <div className="flex min-h-[70vh] items-center justify-center p-[22px]">
      <form
        className="grid w-[min(400px,100%)] gap-2.5 rounded-panel border border-line bg-card p-6 sm:p-7"
        action="/api/admin/login"
        method="post"
      >
        <Typography variant="kicker">CHIMPANION ADMIN</Typography>
        <Typography variant="h2" as="h1" className="text-4xl">
          Sign in
        </Typography>

        {error && <p className={errorBox}>{MESSAGES[error] ?? "Something went wrong. Try again."}</p>}
        {!configured && !error && (
          <p className={errorBox}>
            Set <code className="rounded bg-[#f1f1ea] px-1 font-mono text-xs">ADMIN_PASSWORD</code> and{" "}
            <code className="rounded bg-[#f1f1ea] px-1 font-mono text-xs">ADMIN_SECRET</code> in your
            environment to open the admin area.
          </p>
        )}

        <input type="hidden" name="next" value={safeNext(next)} />
        <Typography variant="label" as="label" htmlFor="password">
          Password
        </Typography>
        <input
          className={fieldClass}
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          autoFocus
          required
        />
        <button className={pillClass("dark", "md", "w-full")} type="submit">
          Sign in
        </button>
        <Typography variant="caption">
          Internal tool. Nothing here is public, and it isn&apos;t indexed.
        </Typography>
      </form>
    </div>
  );
}
