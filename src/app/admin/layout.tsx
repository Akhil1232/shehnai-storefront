import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession, destroySession } from "@/lib/auth";
import "../globals.css";

const NAV = [
  ["/admin", "Dashboard"],
  ["/admin/products", "Products"],
  ["/admin/collections", "Collections"],
  ["/admin/inventory", "Inventory"],
  ["/admin/orders", "Orders"],
  ["/admin/banners", "Banners"],
  ["/admin/sections", "Home Sections"],
  ["/admin/reviews", "Reviews"],
  ["/admin/settings", "Settings"],
] as const;

export const metadata = { title: "Shehnai Admin" };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  // The login page renders inside this layout too, so allow it through.
  if (!session) return <html lang="en"><body className="bg-[#F4F1EA]">{children}</body></html>;

  async function signOut() {
    "use server";
    await destroySession();
    redirect("/admin/login");
  }

  return (
    <html lang="en">
      <body className="bg-[#F4F1EA] font-sans text-ink">
        <div className="flex min-h-screen">
          <aside className="w-[210px] flex-none border-r border-[color:var(--line)] bg-white">
            <div className="border-b border-[color:var(--line)] px-4 py-4">
              <span className="font-serif text-xl">Shehnai®</span>
              <span className="block text-[10px] uppercase tracking-[0.16em] text-[color:var(--muted)]">Admin</span>
            </div>
            <nav className="py-2">
              {NAV.map(([href, label]) => (
                <Link key={href} href={href} className="block px-4 py-2 text-[13px] hover:bg-[#F4F1EA] hover:text-maroon">
                  {label}
                </Link>
              ))}
            </nav>
            <div className="mt-auto border-t border-[color:var(--line)] px-4 py-3">
              <p className="text-[12px] font-semibold">{session.name}</p>
              <p className="mb-2 text-[10.5px] uppercase tracking-[0.1em] text-[color:var(--muted)]">{session.role}</p>
              <Link href="/" target="_blank" className="block text-[11.5px] text-maroon">View store ↗</Link>
              <form action={signOut}><button className="mt-1 text-[11.5px] text-[color:var(--muted)] hover:text-maroon">Sign out</button></form>
            </div>
          </aside>
          <main className="flex-1 overflow-x-auto p-6">{children}</main>
        </div>
      </body>
    </html>
  );
}
