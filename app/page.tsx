import Link from "next/link";
import { connection } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  getSeasonRaceCalendar,
  refreshCompletedSeasonResults,
} from "@/lib/services/f1-import";
import {
  getRaceResults,
  getSeasonRoundsWithResults,
} from "@/lib/services/race-results";
import { getSeasonStandings } from "@/lib/services/standings";
import { getCircuitLayout } from "@/lib/services/circuit-layout";
import HomeMenu from "@/app/home-menu";
import Countdown from "@/app/countdown";
import RaceCircuit from "@/app/race-circuit";

const pointsFormatter = new Intl.NumberFormat("es-AR", {
  maximumFractionDigits: 2,
});

const raceDateFormatter = new Intl.DateTimeFormat("es-AR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});

type StandingRow = Awaited<
  ReturnType<typeof getSeasonStandings>
>["drivers"][number];

function StandingsPanel({
  title,
  rows,
  season,
  driverLinks = false,
}: {
  title: string;
  rows: StandingRow[];
  season: number;
  driverLinks?: boolean;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#111217] shadow-xl shadow-black/20">
      <header className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
        <h2 className="text-base font-bold tracking-wide text-white sm:text-lg">
          {title}
        </h2>
        <Link
          className="shrink-0 text-xs font-semibold text-slate-400 transition-colors hover:text-red-300"
          href={`/estadisticas?year=${season}`}
        >
          Tabla completa <span aria-hidden="true">→</span>
        </Link>
      </header>
      {rows.length ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[360px] text-left text-sm">
            <thead className="text-[10px] uppercase tracking-[0.16em] text-slate-500">
              <tr>
                <th className="w-14 px-5 py-3 font-semibold">Pos.</th>
                <th className="px-3 py-3 font-semibold">Nombre</th>
                <th className="px-5 py-3 text-right font-semibold">Puntos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {rows.slice(0, 5).map((row, index) => (
                <tr
                  className="transition-colors hover:bg-white/[0.03]"
                  key={row.id}
                >
                  <td className="px-5 py-3.5 font-bold tabular-nums text-red-300">
                    {String(index + 1).padStart(2, "0")}
                  </td>
                  <td className="px-3 py-3.5">
                    {driverLinks ? (
                      <Link
                        className="font-semibold text-white transition-colors hover:text-red-200"
                        href={`/pilotos/${row.id}`}
                      >
                        {row.name}
                      </Link>
                    ) : (
                      <span className="font-semibold text-white">
                        {row.name}
                      </span>
                    )}
                    {row.detail && (
                      <span className="ml-2 text-xs text-slate-500">
                        {row.detail}
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3.5 text-right font-bold tabular-nums text-slate-200">
                    {pointsFormatter.format(row.points)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="px-5 py-8 text-sm text-slate-400">
          Todavía no hay resultados para esta temporada.
        </p>
      )}
    </section>
  );
}

export default async function Home() {
  await connection();

  const season = new Date().getFullYear();
  const serverNow = new Date().getTime();
  let importError: string | null = null;
  let roundsWithResults = await getSeasonRoundsWithResults(season);

  try {
    const summary = await refreshCompletedSeasonResults(season);
    roundsWithResults = await getSeasonRoundsWithResults(season);
    if (summary.failures.length > 0) {
      importError = `No se pudieron actualizar ${summary.failures.length} carreras.`;
    }
  } catch (error) {
    console.error("Error actualizando resultados de la temporada:", error);
    importError =
      error instanceof Error
        ? error.message
        : "No se pudieron actualizar los resultados de la temporada.";
  }

  const [currentUser, standings, calendarResponse] = await Promise.all([
    getCurrentUser(),
    getSeasonStandings(season),
    getSeasonRaceCalendar(season)
      .then((calendar) => ({ calendar, error: null }))
      .catch((error: unknown) => {
        console.error("Error cargando el calendario de la temporada:", error);
        return {
          calendar: null,
          error:
            "No se pudo cargar el calendario de carreras. Intentá nuevamente más tarde.",
        };
      }),
  ]);
  const { calendar, error: calendarError } = calendarResponse;

  const nextRace =
    calendar?.races.find(
      (race) => new Date(race.dateStart).getTime() > serverNow
    ) ?? null;
  const seasonProgress =
    nextRace && calendar && calendar.races.length > 1
      ? Math.round(
          ((nextRace.round - 1) / (calendar.races.length - 1)) * 100
        )
      : 0;
  let circuitPoints: Awaited<ReturnType<typeof getCircuitLayout>> | null = null;
  let circuitLayoutError: string | null = null;
  if (nextRace) {
    try {
      circuitPoints = await getCircuitLayout(nextRace.circuitKey, season);
    } catch (error) {
      console.error("Error cargando el trazado de la próxima carrera:", error);
      circuitLayoutError =
        "No se pudo cargar el trazado del circuito desde MultiViewer.";
    }
  }
  const completedRaces =
    calendar?.races
      .filter(
        (race) =>
          roundsWithResults.has(race.round) &&
          new Date(race.dateStart).getTime() <= serverNow
      )
      .sort(
        (left, right) =>
          new Date(left.dateStart).getTime() -
          new Date(right.dateStart).getTime()
      ) ?? [];
  const lastRace = completedRaces[completedRaces.length - 1] ?? null;

  let lastRaceDetails: Awaited<ReturnType<typeof getRaceResults>> = null;
  let lastRaceError: string | null = null;
  if (lastRace) {
    try {
      lastRaceDetails = await getRaceResults(season, lastRace.round);
    } catch (error) {
      console.error("Error cargando los resultados de la última carrera:", error);
      lastRaceError = "No se pudieron cargar los resultados de la última carrera.";
    }
  }

  const loadErrors = [importError, calendarError, lastRaceError].filter(
    (error): error is string => error !== null
  );

  return (
    <main className="min-h-screen bg-[#090a0e] px-4 py-6 text-white sm:px-8 sm:py-9">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 flex items-center justify-between gap-4 border-b border-white/10 pb-5 sm:mb-8 sm:pb-6">
          <Link className="flex items-center gap-3" href="/">
            <span className="flex size-10 items-center justify-center rounded-xl bg-red-500 text-sm font-black italic text-white shadow-lg shadow-red-950/40">
              F1
            </span>
            <span>
              <span className="block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Temporada {season}
              </span>
              <span className="mt-0.5 block text-lg font-bold tracking-tight sm:text-xl">
                F1 Live Dashboard
              </span>
            </span>
          </Link>
          <HomeMenu
            currentUser={
              currentUser ? { username: currentUser.username } : null
            }
          />
        </header>

        {loadErrors.length > 0 && (
          <p
            className="mb-5 rounded-xl border border-amber-400/25 bg-amber-400/[0.07] px-4 py-3 text-sm text-amber-200"
            role="status"
          >
            {loadErrors.join(" ")}
          </p>
        )}

        <div className="grid gap-5 lg:grid-cols-2">
          <section className="overflow-hidden rounded-2xl border border-red-500/20 bg-[#111217] shadow-xl shadow-black/20">
            <div className="border-b border-white/[0.06] px-5 py-4">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-red-300">
                Next Race
                {nextRace ? ` · Round ${nextRace.round}` : ""}
              </p>
            </div>
            {nextRace ? (
              <div className="p-5 sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                      {season} Schedule
                    </p>
                    <h2 className="mt-1 flex items-center gap-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
                      {nextRace.countryName.toLowerCase().includes("united states") && (
                        <span aria-label="Estados Unidos" role="img">
                          🇺🇸
                        </span>
                      )}
                      {nextRace.circuitShortName}
                    </h2>
                    <p className="mt-1 text-sm font-semibold text-slate-300">
                      {nextRace.location}, {nextRace.countryName}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {raceDateFormatter.format(new Date(nextRace.dateStart))} (UTC)
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center justify-center sm:w-52">
                    <RaceCircuit
                      circuit={nextRace.circuitShortName}
                      points={circuitPoints}
                    />
                  </div>
                </div>
                {circuitLayoutError && (
                  <p className="mt-2 text-right text-[10px] text-slate-500">
                    {circuitLayoutError}
                  </p>
                )}
                <div className="mt-4 flex max-w-64 items-center gap-3">
                  <div
                    aria-label={`${seasonProgress}% de temporada completada`}
                    className="h-2 flex-1 overflow-hidden rounded-full bg-slate-800"
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={seasonProgress}
                  >
                    <div
                      className="h-full rounded-full bg-emerald-400"
                      style={{ width: `${seasonProgress}%` }}
                    />
                  </div>
                  <span className="whitespace-nowrap text-xs text-slate-400">
                    {seasonProgress}% de temporada
                  </span>
                </div>
                <div className="mt-4 border-t border-white/[0.06] pt-4">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                    Cuenta regresiva
                  </p>
                  <Countdown compact date={nextRace.dateStart} />
                </div>
                <Link
                  className="mt-5 inline-flex text-sm font-semibold text-slate-300 transition-colors hover:text-white"
                  href="/estadisticas"
                >
                  Ver temporadas <span aria-hidden="true" className="ml-2">→</span>
                </Link>
              </div>
            ) : (
              <div className="p-6">
                <h2 className="text-xl font-bold">Próxima carrera no disponible</h2>
                <p className="mt-2 text-sm text-slate-400">
                  Todavía no hay una fecha de carrera futura publicada.
                </p>
              </div>
            )}
          </section>

          <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#111217] shadow-xl shadow-black/20">
            <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-5 py-4">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                Last Race
                {lastRace ? ` · Round ${lastRace.round}` : ""}
              </p>
              {lastRace && (
                <Link
                  className="shrink-0 text-xs font-semibold text-slate-400 transition-colors hover:text-white"
                  href={`/resultados/${season}/${lastRace.round}`}
                >
                  Resultados completos <span aria-hidden="true">›</span>
                </Link>
              )}
            </div>
            {lastRace && lastRaceDetails ? (
              <div className="p-5 sm:p-6">
                <h2 className="mb-5 text-2xl font-extrabold tracking-tight">
                  {lastRaceDetails.name}
                </h2>
                <ol className="space-y-2">
                  {lastRaceDetails.results
                    .filter((result) => result.position !== null)
                    .slice(0, 3)
                    .map((result) => (
                      <li
                        className="flex items-center gap-3 rounded-xl bg-[#191a20] px-3 py-3"
                        key={`${result.position}-${result.driver.firstName}-${result.driver.lastName}`}
                      >
                        <span
                          className={`flex size-9 shrink-0 items-center justify-center rounded-lg text-sm font-black tabular-nums ${
                            result.position === 1
                              ? "bg-amber-500 text-black"
                              : "bg-slate-800 text-slate-200"
                          }`}
                        >
                          {result.position}
                        </span>
                        <span
                          aria-hidden="true"
                          className="h-9 w-1 shrink-0 rounded-full bg-red-500"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-bold text-white">
                            {result.driver.firstName} {result.driver.lastName}
                          </span>
                          <span className="block truncate text-xs text-slate-500">
                            {result.team.name}
                          </span>
                        </span>
                        <span className="shrink-0 text-xs font-medium tabular-nums text-slate-500">
                          {pointsFormatter.format(result.points)} pts
                        </span>
                      </li>
                    ))}
                </ol>
                <p className="mt-4 text-xs text-slate-500">
                  {lastRaceDetails.circuit.locality},{" "}
                  {lastRaceDetails.circuit.country}
                </p>
              </div>
            ) : (
              <div className="p-6">
                <h2 className="text-xl font-bold">
                  {lastRace ? "Resultados no disponibles" : "Todavía no hay carreras"}
                </h2>
                <p className="mt-2 text-sm text-slate-400">
                  {lastRace
                    ? "No se encontraron resultados para la última carrera."
                    : "Cuando termine una carrera, sus resultados aparecerán aquí."}
                </p>
              </div>
            )}
          </section>

          <StandingsPanel
            title="Campeonato de pilotos"
            rows={standings.drivers}
            season={season}
            driverLinks
          />
          <StandingsPanel
            title="Campeonato de constructores"
            rows={standings.constructors}
            season={season}
          />
        </div>

        <p className="mt-7 text-center text-xs text-slate-600">
          Calendario proporcionado por OpenF1 · Trazados por MultiViewer ·
          Temporada {season}
        </p>
      </div>
    </main>
  );
}
