import Link from "next/link";

export default function HomeMenu({
  currentUser,
  season,
  seasons,
}: {
  currentUser: { username: string } | null;
  season: number;
  seasons: number[];
}) {
  return (
    <details className="group relative z-20 shrink-0">
      <summary className="flex cursor-pointer list-none items-center gap-3 rounded-xl border border-white/15 bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:border-red-400/50 [&::-webkit-details-marker]:hidden">
        <span aria-hidden="true" className="flex w-5 flex-col gap-1">
          <span className="h-0.5 w-5 rounded-full bg-current" />
          <span className="h-0.5 w-5 rounded-full bg-current" />
          <span className="h-0.5 w-5 rounded-full bg-current" />
        </span>
        Menú
      </summary>
      <div className="absolute right-0 top-full mt-3 w-[min(20rem,calc(100vw-2.5rem))] rounded-2xl border border-white/10 bg-slate-900 p-4 shadow-2xl shadow-black/40">
        <nav aria-label="Navegación principal" className="grid gap-1">
          {[
            { href: "/estadisticas", label: "Campeonatos" },
            { href: "/ranking", label: "Ranking" },
            { href: "/corredores", label: "Corredores" },
          ].map((item) => (
            <Link
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-200 transition-colors hover:bg-white/[0.06] hover:text-white"
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          ))}
          {currentUser ? (
            <>
              <Link
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-200 transition-colors hover:bg-white/[0.06] hover:text-white"
                href="/perfil"
              >
                Mi perfil
              </Link>
              <div className="mt-2 flex items-center justify-between gap-3 border-t border-white/10 px-3 pt-4">
                <span className="min-w-0 truncate text-sm font-semibold text-red-100">
                  Hola, {currentUser.username}
                </span>
                <form action="/api/auth/logout" method="post">
                  <button
                    className="rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-slate-200 transition-colors hover:border-red-400/40 hover:text-white"
                    type="submit"
                  >
                    Salir
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="mt-2 grid grid-cols-2 gap-2 border-t border-white/10 pt-4">
              <Link
                className="rounded-full border border-white/15 px-3 py-2 text-center text-sm font-semibold text-slate-200 transition-colors hover:border-red-400/40 hover:text-white"
                href="/login"
              >
                Ingresar
              </Link>
              <Link
                className="rounded-full bg-red-500 px-3 py-2 text-center text-sm font-semibold text-white transition-colors hover:bg-red-400"
                href="/register"
              >
                Registrarse
              </Link>
            </div>
          )}
        </nav>

        <form action="/estadisticas" className="mt-4 border-t border-white/10 pt-4" method="get">
          <label
            className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400"
            htmlFor="season"
          >
            Temporada
          </label>
          <div className="flex gap-2">
            <select
              className="min-w-0 flex-1 rounded-full border border-white/15 bg-slate-950 px-3 py-2 text-sm font-semibold text-white"
              defaultValue={season}
              id="season"
              name="year"
            >
              {seasons.map((availableSeason) => (
                <option key={availableSeason} value={availableSeason}>
                  Temporada {availableSeason}
                </option>
              ))}
            </select>
            <button
              className="rounded-full bg-red-500 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-400"
              type="submit"
            >
              Ver
            </button>
          </div>
        </form>
      </div>
    </details>
  );
}
