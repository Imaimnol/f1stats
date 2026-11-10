import Link from "next/link";
import { connection } from "next/server";
import { getLatestDriverInfo } from "@/lib/openf1";
import { importSeason } from "@/lib/services/f1-import";
import {
  getAvailableSeasons,
  getSeasonStandings,
} from "@/lib/services/standings";
import SeasonSelector from "@/app/estadisticas/season-selector";

const seasonDataMinYear = 2023;

const pointsFormatter = new Intl.NumberFormat("es-AR", {
  maximumFractionDigits: 2,
});

const raceDateFormatter = new Intl.DateTimeFormat("es-AR", {
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});

type Standing = {
  id: string;
  name: string;
  detail: string | null;
  points: number;
  wins: number;
  podiums: number;
  starts: number;
  driverNumber?: number | null;
  teamColor?: string;
};

type AvailableSeasonsResponse = {
  seasons: number[];
};

type SeasonStandingsResponse = {
  season: number;
  races: number;
  drivers: Standing[];
  constructors: Standing[];
  raceDetails: Array<{
    round: number;
    name: string;
    date: string;
    circuit: {
      name: string;
    };
  }>;
};

function StandingsTable({
  title,
  rows,
  driverLinks = false,
}: {
  title: string;
  rows: Standing[];
  driverLinks?: boolean;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
      <div className="border-b border-white/10 px-5 py-4">
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px] text-left text-sm">
          <thead className="text-xs uppercase tracking-wider text-slate-400">
            <tr>
              <th className="px-5 py-3 font-medium">Pos.</th>
              <th className="px-5 py-3 font-medium">{title}</th>
              <th className="px-5 py-3 text-right font-medium">Puntos</th>
              <th className="px-5 py-3 text-right font-medium">Victorias</th>
              <th className="px-5 py-3 text-right font-medium">Podios</th>
              <th className="px-5 py-3 text-right font-medium">Carreras</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {rows.map((row, index) => (
              <tr key={row.id} className="text-slate-200">
                <td className="px-5 py-4 font-semibold text-red-300">
                  {index + 1}
                </td>
                <td className="px-5 py-4">
                  {driverLinks ? (
                    <Link
                      className="flex items-center gap-3 font-semibold text-white transition-colors hover:text-red-300"
                      href={`/pilotos/${row.id}`}
                    >
                      {row.driverNumber !== null &&
                        row.driverNumber !== undefined && (
                          <span
                            aria-label={`Número del piloto ${row.driverNumber}`}
                            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-white/20 text-lg font-black tabular-nums text-white"
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
                    <p className="font-semibold text-white">{row.name}</p>
                  )}
                  {row.detail && (
                    <p className="mt-1 text-xs text-slate-400">{row.detail}</p>
                  )}
                </td>
                <td className="px-5 py-4 text-right font-semibold text-white">
                  {pointsFormatter.format(row.points)}
                </td>
                <td className="px-5 py-4 text-right">{row.wins}</td>
                <td className="px-5 py-4 text-right">{row.podiums}</td>
                <td className="px-5 py-4 text-right">{row.starts}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default async function StatisticsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string | string[] }>;
}) {
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

  let standings = await getSeasonStandings(season);
  let importError: string | null = null;
  if (standings.races === 0) {
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

  if (season === currentSeason) {
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
    <main className="min-h-screen bg-slate-950 px-5 py-10 text-white sm:px-8 sm:py-14">
      <div className="mx-auto max-w-5xl">
        <header className="mb-10 border-b border-white/10 pb-8 sm:mb-12 sm:pb-10">
          <Link
            href="/"
            className="text-sm font-semibold text-red-300 transition-colors hover:text-red-200"
          >
            ← Volver al calendario
          </Link>
          <div className="mt-6 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.24em] text-red-400">
                F1 Stats
              </p>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                Campeonatos
              </h1>
              <p className="mt-3 max-w-xl text-base leading-7 text-slate-300">
                Posiciones de pilotos y constructores según los resultados
                importados.
              </p>
            </div>
            <SeasonSelector seasons={availableSeasons} season={season} />
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
              {season}, aquí aparecerán las posiciones de pilotos y equipos.
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
            <p className="mb-5 text-sm text-slate-400">
              Resultados de {standings.races}{" "}
              {standings.races === 1 ? "carrera importada" : "carreras importadas"}
            </p>
            <div className="space-y-6">
              <StandingsTable
                title="Pilotos"
                rows={standings.drivers}
                driverLinks
              />
              <StandingsTable
                title="Constructores"
                rows={standings.constructors}
              />
            </div>
            <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04]">
              <div className="border-b border-white/10 px-5 py-4">
                <h2 className="text-lg font-semibold">
                  Carreras con resultados
                </h2>
              </div>
              <ol className="divide-y divide-white/10">
                {standings.raceDetails.map((race) => (
                  <li key={race.round}>
                    <Link
                      href={`/resultados/${season}/${race.round}`}
                      className="flex flex-col gap-1 px-5 py-4 transition-colors hover:bg-white/[0.04] sm:flex-row sm:items-center sm:justify-between"
                    >
                      <span className="font-semibold text-white">
                        Ronda {race.round}: {race.name}
                      </span>
                      <span className="text-sm text-slate-400">
                        {race.circuit.name} · {raceDateFormatter.format(new Date(race.date))}
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>
            </section>
          </>
        )}
        <p className="mt-8 text-center text-xs text-slate-500">
          Las posiciones se calculan con los puntos de los resultados guardados.
        </p>
      </div>
    </main>
  );
}
