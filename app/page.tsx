import Link from "next/link";
import { connection } from "next/server";
import { getSeasonRaceCalendar } from "@/lib/services/f1-import";

const dateFormatter = new Intl.DateTimeFormat("es-AR", {
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});

export default async function Home() {
  await connection();

  const season = new Date().getFullYear();
  const calendar = await getSeasonRaceCalendar(season).catch((error: unknown) => {
    console.error("Error cargando el calendario de la temporada:", error);
    return null;
  });

  if (!calendar) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-5 py-10 text-white">
        <section className="w-full max-w-lg rounded-2xl border border-white/10 bg-white/[0.04] p-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-red-400">
            F1 Stats
          </p>
          <h1 className="mt-4 text-2xl font-bold">
            No se pudo cargar el calendario
          </h1>
          <p className="mt-3 leading-7 text-slate-300">
            No logramos consultar los datos de OpenF1. Intenta recargar la
            página en unos momentos.
          </p>
          <form action="/" method="get" className="mt-6">
            <button
              className="rounded-full bg-red-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-400"
              type="submit"
            >
              Intentar de nuevo
            </button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-10 text-white sm:px-8 sm:py-14">
        <div className="mx-auto max-w-5xl">
          <header className="mb-10 border-b border-white/10 pb-8 sm:mb-12 sm:pb-10">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.24em] text-red-400">
              F1 Stats
            </p>
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
              <div>
                <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                  Calendario de carreras
                </h1>
                <p className="mt-3 max-w-xl text-base leading-7 text-slate-300">
                  Todas las carreras de la temporada, con fechas y circuitos.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/estadisticas"
                  className="w-fit rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-slate-200 transition-colors hover:border-red-400/40 hover:text-white"
                >
                  Ver campeonatos
                </Link>
                <span className="w-fit rounded-full border border-red-400/40 bg-red-400/10 px-4 py-2 text-sm font-semibold text-red-200">
                  Temporada {calendar.season}
                </span>
              </div>
            </div>
          </header>

          {calendar.races.length === 0 ? (
            <section className="rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-12 text-center">
              <h2 className="text-xl font-semibold">
                Calendario todavía no disponible
              </h2>
              <p className="mt-2 text-slate-300">
                OpenF1 aún no publicó carreras para la temporada {season}.
              </p>
            </section>
          ) : (
            <>
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Temporada {season}</h2>
                <p className="text-sm text-slate-400">
                  {calendar.races.length} carreras
                </p>
              </div>

              <ol className="grid gap-3 sm:grid-cols-2">
                {calendar.races.map((race) => {
                  return (
                    <li
                      key={race.sessionKey}
                      className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition-colors hover:border-red-400/40 hover:bg-white/[0.07]"
                    >
                      <div className="flex min-w-0 items-start gap-4">
                        <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-red-500/15 text-sm font-bold text-red-300">
                          {String(race.round).padStart(2, "0")}
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                            Ronda {race.round}
                          </p>
                          <h3 className="mt-1 truncate text-lg font-semibold">
                            {race.circuitShortName}
                          </h3>
                          <p className="mt-1 text-sm text-slate-300">
                            {race.location}, {race.countryName}
                          </p>
                        </div>
                      </div>
                      <p className="mt-5 border-t border-white/10 pt-4 text-sm font-medium text-slate-200">
                        {dateFormatter.format(new Date(race.dateStart))}
                      </p>
                    </li>
                  );
                })}
              </ol>
            </>
          )}

          <p className="mt-8 text-center text-xs text-slate-500">
            Datos del calendario proporcionados por OpenF1.
          </p>
        </div>
    </main>
  );
}
