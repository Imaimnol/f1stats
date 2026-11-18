import Link from "next/link";
import { connection } from "next/server";
import { getLatestDriverInfo } from "@/lib/openf1";
import {
  importSeason,
  refreshCompletedSeasonResults,
} from "@/lib/services/f1-import";
import {
  getAvailableSeasons,
  getSeasonStandings,
} from "@/lib/services/standings";
import SeasonSelector from "@/app/estadisticas/season-selector";

export type Championship = "drivers" | "constructors";

type StandingsPageProps = {
  searchParams: Promise<{ year?: string | string[] }>;
  championship: Championship;
};

const seasonDataMinYear = 2023;

const pointsFormatter = new Intl.NumberFormat("es-AR", {
  maximumFractionDigits: 2,
});

type Standing = {
  id: string;
  name: string;
  detail: string | null;
  teamName?: string;
  points: number;
  wins: number;
  podiums: number;
  starts: number;
  driverNumber?: number | null;
  teamColor?: string;
};

const teamColors: Array<[string, string]> = [
  ["alpine", "#ff87bc"],
  ["aston martin", "#00a19c"],
  ["audi", "#c7c7c7"],
  ["cadillac", "#d8b15c"],
  ["ferrari", "#e8002d"],
  ["haas", "#ffffff"],
  ["mclaren", "#ff8000"],
  ["mercedes", "#27f4d2"],
  ["racing bulls", "#6692ff"],
  ["red bull", "#3671c6"],
  ["williams", "#64c4ff"],
];

function getTeamColor(name: string) {
  const normalizedName = name.toLowerCase();
  return (
    teamColors.find(([team]) => normalizedName.includes(team))?.[1] ??
    "#94a3b8"
  );
}

function StandingsTable({
  title,
  rows,
  season,
  driverLinks = false,
}: {
  title: string;
  rows: Standing[];
  season: number;
  driverLinks?: boolean;
}) {
  const isConstructorsTable = !driverLinks;

  return (
    <section
      className="overflow-hidden rounded-3xl border border-white/[0.08] bg-[#11131b]"
      id={driverLinks ? "pilotos" : "constructores"}
    >
      <div className="border-b border-white/[0.08] px-5 py-4 sm:px-6">
        <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400 sm:text-sm">
          {season} {title}
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table
          className={`w-full text-left text-sm ${
            isConstructorsTable ? "min-w-[420px]" : "min-w-[650px]"
          }`}
        >
          <thead className="border-b border-white/[0.08] text-[10px] font-semibold uppercase tracking-wider text-slate-500 sm:text-xs">
            <tr>
              <th className="w-14 px-5 py-3 font-medium sm:px-6">Pos</th>
              <th className="px-3 py-3 font-medium">
                {isConstructorsTable ? "Constructor" : "Piloto"}
              </th>
              {!isConstructorsTable && (
                <th className="px-3 py-3 font-medium">Equipo</th>
              )}
              <th className="px-3 py-3 text-right font-medium">Victorias</th>
              <th className="px-5 py-3 text-right font-medium sm:px-6">Puntos</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.06]">
            {rows.map((row, index) => (
              <tr
                className="text-slate-300 transition-colors hover:bg-white/[0.025]"
                key={row.id}
              >
                <td className="px-5 py-4 font-mono font-bold tabular-nums sm:px-6">
                  <span
                    className={index === 0 ? "text-amber-300" : "text-slate-400"}
                  >
                    {index + 1}
                  </span>
                </td>
                <td className="px-3 py-4">
                  {driverLinks ? (
                    <Link
                      className="flex items-center gap-3 font-semibold text-white transition-colors hover:text-red-300"
                      href={`/pilotos/${row.id}`}
                    >
                      {row.driverNumber !== null &&
                        row.driverNumber !== undefined && (
                          <span
                            aria-label={`Número del piloto ${row.driverNumber}`}
                            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/15 text-sm font-black tabular-nums text-white"
                            style={{
                              backgroundColor: row.teamColor ?? "#475569",
                              textShadow: "0 1px 3px rgb(0 0 0 / 80%)",
                            }}
                          >
                            {row.driverNumber}
                          </span>
                        )}
                      {row.name}
                    </Link>
                  ) : (
                    <p
                      className="border-l-2 py-1 pl-3 font-semibold text-white"
                      style={{
                        borderColor: getTeamColor(row.name),
                        color: getTeamColor(row.name),
                      }}
                    >
                      {row.name}
                    </p>
                  )}
                  {driverLinks && row.detail && (
                    <p className="mt-1 pl-3 text-xs text-slate-500">
                      {row.detail}
                    </p>
                  )}
                </td>
                {!isConstructorsTable && (
                  <td className="px-3 py-4 text-sm text-slate-400">
                    {row.teamName || "—"}
                  </td>
                )}
                <td className="px-3 py-4 text-right font-mono tabular-nums text-slate-400">
                  {row.wins}
                </td>
                <td className="px-5 py-4 text-right font-mono font-bold tabular-nums text-white sm:px-6">
                  {pointsFormatter.format(row.points)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default async function StandingsPage({
  searchParams,
  championship,
}: StandingsPageProps) {
  await connection();

  const currentSeason = new Date().getFullYear();
  const query = await searchParams;

  const availableSeasons = (await getAvailableSeasons(currentSeason)).filter(
    (season) => season >= seasonDataMinYear
  );

  const requestedSeason =
    typeof query.year === "string" ? Number(query.year) : currentSeason;
  const hasInvalidSeason =
    query.year !== undefined &&
    (typeof query.year !== "string" ||
      !availableSeasons.includes(requestedSeason));
  const season = hasInvalidSeason ? currentSeason : requestedSeason;
  const isDriversChampionship = championship === "drivers";
  const championshipTitle = isDriversChampionship
    ? "Campeonato de Pilotos"
    : "Campeonato de Constructores";

  let standings = await getSeasonStandings(season);
  let importError: string | null = null;
  if (season === currentSeason) {
    try {
      const summary = await refreshCompletedSeasonResults(season);
      standings = await getSeasonStandings(season);
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
  } else if (standings.races === 0) {
    try {
      const summary = await importSeason(season);
      standings = await getSeasonStandings(season);
      if (summary.failures.length > 0) {
        importError = `No se pudieron importar ${summary.failures.length} carreras.`;
      }
    } catch (error) {
      console.error("Error importando resultados de la temporada:", error);
      importError =
        error instanceof Error
          ? error.message
          : "No se pudieron importar los resultados de la temporada.";
    }
  }

  if (isDriversChampionship && season === currentSeason) {
    try {
      const currentDrivers = await getLatestDriverInfo();
      standings = {
        ...standings,
        drivers: standings.drivers.map((driver) => ({
          ...driver,
          driverNumber: driver.detail
            ? currentDrivers.get(driver.detail.toUpperCase())?.number ??
              driver.permanentNumber
            : driver.permanentNumber,
          teamColor: driver.detail
            ? currentDrivers.get(driver.detail.toUpperCase())?.teamColor ??
              undefined
            : undefined,
        })),
      };
    } catch (error) {
      console.error("Error cargando los datos de los pilotos:", error);
    }
  }

  return (
    <main className="min-h-screen bg-[#0B0E14] px-4 py-8 text-white sm:px-8 sm:py-12">
      <div className="mx-auto max-w-6xl">
        <header className="mb-7 border-b border-white/10 pb-7 sm:mb-9 sm:pb-8">
          <Link
            href="/"
            className="text-sm font-semibold text-red-300 transition-colors hover:text-red-200"
          >
            ← F1 Stats
          </Link>
          <div className="mt-6">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-red-400">
              Campeonato de Fórmula 1
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Clasificación {season}
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              {isDriversChampionship ? "Pilotos" : "Constructores"} · {standings.races}{" "}
              {standings.races === 1 ? "carrera" : "carreras"} con resultados
            </p>
          </div>
          <div className="mt-6">
            <nav aria-label="Tipo de campeonato" className="mb-4 flex gap-2">
              <Link
                aria-current={isDriversChampionship ? "page" : undefined}
                className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                  isDriversChampionship
                    ? "border-red-500/40 bg-red-500/10 text-red-200"
                    : "border-white/10 bg-white/[0.03] text-slate-400 hover:text-white"
                }`}
                href={`/estadisticas?year=${season}`}
              >
                Pilotos
              </Link>
              <Link
                aria-current={!isDriversChampionship ? "page" : undefined}
                className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                  !isDriversChampionship
                    ? "border-red-500/40 bg-red-500/10 text-red-200"
                    : "border-white/10 bg-white/[0.03] text-slate-400 hover:text-white"
                }`}
                href={`/constructores?year=${season}`}
              >
                Constructores
              </Link>
            </nav>
            <SeasonSelector
              seasons={availableSeasons}
              season={season}
              championship={championship}
            />
          </div>
        </header>

        {hasInvalidSeason && (
          <p
            className="mb-6 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-200"
            role="alert"
          >
            La temporada solicitada no está disponible. Elegí una de las
            temporadas con resultados importados.
          </p>
        )}

        {importError && (
          <p
            className="mb-6 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-200"
            role="alert"
          >
            No se pudieron cargar todos los resultados: {importError}
          </p>
        )}

        {standings.races === 0 ? (
          <section className="rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-12 text-center">
            <h2 className="text-xl font-semibold">
              Todavía no hay resultados para mostrar
            </h2>
            <p className="mx-auto mt-2 max-w-lg leading-7 text-slate-300">
              Cuando se importen resultados de carreras de la temporada{" "}
              {season}, aquí aparecerá el campeonato de{" "}
              {isDriversChampionship ? "pilotos" : "constructores"}.
            </p>
            <Link
              href="/"
              className="mt-6 inline-flex rounded-full bg-red-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-400"
            >
              Consultar calendario
            </Link>
          </section>
        ) : (
          <>
            {isDriversChampionship && standings.drivers[0] && (
              <p className="mb-5 text-sm leading-6 text-slate-300">
                <span className="font-semibold text-white">
                  {standings.drivers[0].name}
                </span>{" "}
                lidera el campeonato de pilotos con{" "}
                <span className="font-bold text-white">
                  {pointsFormatter.format(standings.drivers[0].points)}
                </span>{" "}
                puntos y {standings.drivers[0].wins}{" "}
                {standings.drivers[0].wins === 1 ? "victoria" : "victorias"}.
              </p>
            )}
            <div className="space-y-5">
              <StandingsTable
                title={championshipTitle}
                rows={
                  isDriversChampionship
                    ? standings.drivers
                    : standings.constructors
                }
                season={season}
                driverLinks={isDriversChampionship}
              />
            </div>
          </>
        )}
        <p className="mt-8 text-center text-xs text-slate-500">
          Las posiciones se calculan con los puntos de los resultados guardados.
        </p>
      </div>
    </main>
  );
}
