/** Chrome for signed-in admin pages only. */
export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="adminbar noprint">
        <a className="logo" href="/admin">
          CHIMPANION<b>.</b> <span>admin</span>
        </a>
        <nav aria-label="Admin">
          <a href="/admin">Dashboard</a>
          <a href="/admin/planner">Cost planner</a>
          <a href="/">View site</a>
        </nav>
        <form action="/api/admin/logout" method="post">
          <button type="submit" className="pill ghost">
            Sign out
          </button>
        </form>
      </header>
      <main id="main">{children}</main>
    </>
  );
}
