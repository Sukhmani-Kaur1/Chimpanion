import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Chimpanion admin" },
  robots: { index: false, follow: false, nocache: true },
};

/** Covers the sign-in page too, so it stays bare — the chrome lives in (panel). */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
