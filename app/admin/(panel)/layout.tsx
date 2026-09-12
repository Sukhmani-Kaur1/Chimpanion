import { pillClass } from "@/components/ui/Button";
import Typography from "@/components/ui/Typography";

const links = [
  ["/admin", "Dashboard"],
  ["/admin/planner", "Cost planner"],
  ["/", "View site"],
];

/** Chrome for signed-in admin pages only. */
export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="flex flex-wrap items-center gap-x-5 gap-y-3 bg-dark px-4 py-3 text-white sm:px-[22px] sm:py-3.5 print:hidden">
        <Typography as="a" variant="h5" href="/admin" className="text-base tracking-normal">
          CHIMPANION<b>.</b>{" "}
          <span className="ml-1 font-sans text-xs font-semibold tracking-label text-dark-muted uppercase">
            admin
          </span>
        </Typography>

        <nav aria-label="Admin" className="order-3 flex w-full gap-3.5 text-sm text-[#c9c9c0] sm:order-none sm:ml-auto sm:w-auto sm:gap-[18px]">
          {links.map(([href, label]) => (
            <a key={href} href={href} className="transition-colors hover:text-white">
              {label}
            </a>
          ))}
        </nav>

        <form action="/api/admin/logout" method="post">
          <button type="submit" className={pillClass("ghost", "sm")}>
            Sign out
          </button>
        </form>
      </header>
      <main id="main">{children}</main>
    </>
  );
}
