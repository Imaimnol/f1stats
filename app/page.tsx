import Link from "next/link";
import { connection } from "next/server";
import { getSeasonRaceCalendar } from "@/lib/services/f1-import";
import { getSeasonRoundsWithResults } from "@/lib/services/race-results";

const dateFormatter = new Intl.DateTimeFormat("es-AR", {
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});

const firstAvailableSeason = 2023;

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ year?: string | string[] }>;
}) {
  await connection();

  const currentYear = new Date().getFullYear();
  const query = await searchParams;
  const requestedSeason =
    typeof query.year === "string" ? Number(query.year) : currentYear;
  const isValidSeason =
    typeof query.year === "string" &&
    /^\d{4}$/.test(query.year) &&
    requestedSeason >= firstAvailableSeason &&
    requestedSeason <= currentYear;
  const hasInvalidSeason = query.year !== undefined && !isValidSeason;
  const season = isValidSeason ? requestedSeason : currentYear;
  const seasons = Array.from(
    { length: Math.max(0, currentYear - firstAvailableSeason + 1) },
    (_, index) => currentYear - index
  );

  const [calendar, roundsWithResults] = await Promise.all([
    getSeasonRaceCalendar(season).catch((error: unknown) => {
      console.error("Error cargando el calendario de la temporada:", error);
      return null;
    }),
    getSeasonRoundsWithResults(season).catch(() => new Set<number>()),
  ]);

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
                Todas las carreras de la temporada, con fechas, circuitos y
                resultados disponibles.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/estadisticas"
                className="w-fit rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-slate-200 transition-colors hover:border-red-400/40 hover:text-white"
              >
                Ver campeonatos
              </Link>
              <form action="/" className="flex items-center gap-2" method="get">
                <label className="sr-only" htmlFor="season">
                  Elegir temporada
                </label>
                <select
                  className="rounded-full border border-white/15 bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
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
                  className="rounded-full bg-red-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-400"
                  type="submit"
                >
                  Ver
                </button>
              </form>
            </div>
          </div>
        </header>

        {hasInvalidSeason && (
          <p
            className="mb-6 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-200"
            role="alert"
          >
            La temporada solicitada no es válida. Elegí un año entre {firstAvailableSeason} y {currentYear}.
          </p>
        )}

        {calendar.races.length === 0 ? (
          <section className="rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-12 text-center">
            <h2 className="text-xl font-semibold">
              Calendario todavía no disponible
            </h2>
            <p className="mt-2 text-slate-300">
              OpenF1 aún no publicó carreras para la temporada {calendar.season}.
            </p>
          </section>
        ) : (
          <>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                Temporada {calendar.season}
              </h2>
              <p className="text-sm text-slate-400">
                {calendar.races.length} carreras
              </p>
            </div>

            <ol className="grid gap-3 sm:grid-cols-2">
              {calendar.races.map((race) => {
                const hasResults = roundsWithResults.has(race.round);

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
                    <div className="mt-5 border-t border-white/10 pt-4">
                      <p className="text-sm font-medium text-slate-200">
                        {dateFormatter.format(new Date(race.dateStart))}
                      </p>
                      {hasResults ? (
                        <Link
                          href={`/resultados/${season}/${race.round}`}
                          className="mt-3 inline-flex rounded-full border border-red-400/40 bg-red-500/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-red-200 transition-colors hover:border-red-300 hover:text-red-100"
                        >
                          Ver resultados
                        </Link>
                      ) : (
                        <p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                          Resultados todavía no disponibles
                        </p>
                      )}
                    </div>
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
