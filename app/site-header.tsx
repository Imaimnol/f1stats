import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import HomeMenu from "@/app/home-menu";

export default async function SiteHeader() {
  const currentUser = await getCurrentUser();

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#090a0e]/95 text-white backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-8">
        <Link className="flex items-center gap-3" href="/">
          <span className="flex size-10 items-center justify-center rounded-xl bg-red-500 text-sm font-black italic text-white shadow-lg shadow-red-950/40">
            F1
          </span>
          <span>
            <span className="block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Temporada {new Date().getFullYear()}
            </span>
            <span className="mt-0.5 block text-lg font-bold tracking-tight sm:text-xl">
              F1 Stats
            </span>
          </span>
        </Link>
        <HomeMenu
          currentUser={
            currentUser ? { username: currentUser.username } : null
          }
        />
      </div>
    </header>
  );
}
