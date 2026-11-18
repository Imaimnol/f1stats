import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDriverProfile } from "@/lib/services/drivers";
import { getSeasonDrivers } from "@/lib/services/season-drivers";
import { getSeasonStandings } from "@/lib/services/standings";
import { prisma } from "@/lib/prisma";
import FavoriteButton from "./favorite-button";

const pointsFormatter = new Intl.NumberFormat("es-AR", {
  maximumFractionDigits: 2,
});

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-[#14151a] p-4 sm:p-5">
      <p className="text-xs font-medium text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-bold tabular-nums text-white sm:text-3xl">
        {value}
      </p>
    </div>
  );
}

function finishLabel(position: number | null, status: string | null) {
  if (position !== null) {
    return `P${position}`;
  }
  const normalizedStatus = status?.toLowerCase() ?? "";
  if (normalizedStatus.includes("not start")) {
    return "DNS";
  }
  if (normalizedStatus.includes("disqual")) {
    return "DSQ";
  }
  if (normalizedStatus.includes("not finish")) {
    return "DNF";
  }
  return "—";
}

export default async function DriverPage({
  params,
  searchParams,
}: {
  params: Promise<{ driverId: string }>;
  searchParams: Promise<{ year?: string | string[]; view?: string | string[] }>;
}) {
  await connection();
  const [{ driverId }, query] = await Promise.all([params, searchParams]);
  const [driver, user] = await Promise.all([
    getDriverProfile(driverId),
    getCurrentUser(),
  ]);

  if (!driver) {
    notFound();
  }

  const seasons = [
    ...new Set(driver.results.map((result) => result.race.season)),
  ].sort((left, right) => right - left);
  const defaultSeason = seasons[0] ?? new Date().getFullYear();
  const requestedSeason =
    typeof query.year === "string" && /^\d{4}$/.test(query.year)
      ? Number(query.year)
      : defaultSeason;
  const hasInvalidSeason =
    query.year !== undefined &&
    (typeof query.year !== "string" || !seasons.includes(requestedSeason));
  const selectedSeason = hasInvalidSeason ? defaultSeason : requestedSeason;
  const isCareerView = query.view === "career";
  const seasonResults = driver.results
    .filter((result) => result.race.season === selectedSeason)
    .sort((left, right) => left.race.round - right.race.round);
  const careerResults = [...driver.results].sort(
    (left, right) =>
      left.race.date.getTime() - right.race.date.getTime() ||
      left.race.round - right.race.round
  );
  const activeResults = isCareerView ? careerResults : seasonResults;

  let teamColor = "#e10600";
  let headshotUrl: string | null = null;
  let driverInfoError: string | null = null;
  try {
    const seasonDrivers = await getSeasonDrivers(selectedSeason);
    const seasonDriver = seasonDrivers.find(
      (seasonEntry) => seasonEntry.code === driver.code
    );
    if (seasonDriver) {
      teamColor = seasonDriver.teamColor;
      headshotUrl = seasonDriver.headshotUrl;
    }
  } catch (error) {
    console.error("Error cargando la imagen y escudería del piloto:", error);
    driverInfoError =
      "No se pudo cargar la foto o los colores de la escudería.";
  }

  const [favorite, standings] = await Promise.all([
    user
      ? prisma.favoriteDriver.findUnique({
          where: {
            userId_driverId: {
              userId: user.id,
              driverId,
            },
          },
          select: { id: true },
        })
      : Promise.resolve(null),
    getSeasonStandings(selectedSeason),
  ]);
  const seasonPosition =
    standings.drivers.findIndex((standing) => standing.id === driverId) + 1;
  const seasonFinishes = seasonResults
    .map((result) => result.position)
    .filter((position): position is number => position !== null && position > 0);
  const seasonStats = {
    points: seasonResults.reduce((total, result) => total + result.points, 0),
    wins: seasonResults.filter((result) => result.position === 1).length,
    podiums: seasonResults.filter(
      (result) =>
        result.position !== null &&
        result.position >= 1 &&
        result.position <= 3
    ).length,
    averageFinish:
      seasonFinishes.length > 0
        ? seasonFinishes.reduce((total, position) => total + position, 0) /
          seasonFinishes.length
        : null,
    dnfs: seasonResults.filter(
      (result) => result.status?.toLowerCase() === "did not finish"
    ).length,
  };
  const statCards = isCareerView
    ? [
        { label: "Carreras", value: String(driver.stats.races) },
        { label: "Puntos", value: pointsFormatter.format(driver.stats.points) },
        { label: "Victorias", value: String(driver.stats.wins) },
        { label: "Podios", value: String(driver.stats.podiums) },
        { label: "Promedio de llegada", value: driver.stats.avgFinish?.toFixed(1) ?? "—" },
        { label: "Abandonos", value: String(driver.stats.dnfs) },
      ]
    : [
        { label: "Posición", value: seasonPosition > 0 ? `P${seasonPosition}` : "—" },
        { label: "Puntos", value: pointsFormatter.format(seasonStats.points) },
        { label: "Victorias", value: String(seasonStats.wins) },
        { label: "Podios", value: String(seasonStats.podiums) },
        { label: "Promedio de llegada", value: seasonStats.averageFinish?.toFixed(1) ?? "—" },
        { label: "Abandonos", value: String(seasonStats.dnfs) },
      ];

  const chartSeries = isCareerView
    ? [...driver.results.reduce((totals, result) => {
        totals.set(
          result.race.season,
          (totals.get(result.race.season) ?? 0) + result.points
        );
        return totals;
      }, new Map<number, number>())]
        .sort(([left], [right]) => left - right)
        .map(([label, points]) => ({ label: String(label), points }))
    : seasonResults.reduce<Array<{ label: string; points: number }>>(
        (series, result) => {
          series.push({
            label: String(result.race.round),
            points: (series.at(-1)?.points ?? 0) + result.points,
          });
          return series;
        },
        []
      );
  const maxChartPoints = Math.max(
    1,
    ...chartSeries.map((point) => point.points)
  );
  const chartCoordinates = chartSeries
    .map((point, index) => {
      const x =
        chartSeries.length > 1
          ? 24 + (index * 452) / (chartSeries.length - 1)
          : 250;
      const y = 144 - (point.points / maxChartPoints) * 124;
      return `${x},${y}`;
    })
    .join(" ");
  const driverName = `${driver.firstName} ${driver.lastName}`;

  return (
    <main className="min-h-screen bg-[#090a0e] px-4 py-6 text-white sm:px-8 sm:py-9">
      <div className="mx-auto max-w-6xl">
        <Link
          href={`/estadisticas?year=${selectedSeason}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 transition-colors hover:text-white"
        >
          <span aria-hidden="true">←</span> Volver a campeonatos
        </Link>

        <section
          className="relative mt-5 min-h-[20rem] overflow-hidden rounded-2xl border bg-[#111217] sm:min-h-[25rem]"
          style={{
            borderColor: `${teamColor}55`,
            background: `linear-gradient(115deg, ${teamColor}27 0%, #111217 62%)`,
          }}
        >
          <span
            aria-hidden="true"
            className="absolute -right-2 -top-14 text-[20rem] font-black leading-none opacity-[0.055] sm:right-8 sm:text-[25rem]"
            style={{ color: teamColor }}
          >
            {driver.permanentNumber ?? "F1"}
          </span>
          {headshotUrl && (
            <div className="absolute inset-y-0 right-0 w-3/4 sm:w-1/2">
              <Image
                alt={driver.lastName}
                className="object-contain object-bottom"
                fill
                preload
                sizes="(max-width: 640px) 75vw, 50vw"
                src={headshotUrl}
              />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-[#111217] via-[#111217]/85 to-transparent" />
          <div className="relative z-10 flex min-h-[20rem] flex-col justify-end p-6 sm:min-h-[25rem] sm:p-10">
            <div className="mb-auto flex justify-end pt-1">
              {user ? (
                <FavoriteButton
                  driverId={driverId}
                  initialFavorite={favorite !== null}
                />
              ) : (
                <Link
                  className="rounded-full border border-white/15 bg-black/20 px-4 py-2 text-xs font-semibold text-slate-200 transition-colors hover:border-white/30 hover:text-white"
                  href="/login"
                >
                  Ingresá para guardar favoritos
                </Link>
              )}
            </div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
              Perfil de piloto · {isCareerView ? "Trayectoria" : selectedSeason}
            </p>
            <p
              className="mt-3 text-4xl font-black tracking-tight sm:text-5xl"
              style={{ color: teamColor }}
            >
              {driver.lastName}
            </p>
            <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl">
              {driver.firstName}
            </h1>
            <p className="mt-3 text-sm font-semibold text-slate-300">
              {seasonResults[0]?.team.name ?? "Escudería no disponible"}
              <span className="mx-2 text-slate-600">·</span>
              {[driver.nationality, driver.code]
                .filter(Boolean)
                .join(" · ")}
              {driver.permanentNumber !== null &&
                ` · #${driver.permanentNumber}`}
            </p>
          </div>
        </section>

        {driverInfoError && (
          <p
            className="mt-3 text-xs text-amber-200"
            role="status"
          >
            {driverInfoError}
          </p>
        )}

        <nav
          aria-label="Temporadas del piloto"
          className="mt-6 flex flex-wrap gap-2"
        >
          {seasons.slice(0, 8).map((season) => (
            <Link
              aria-current={
                !isCareerView && season === selectedSeason ? "page" : undefined
              }
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                !isCareerView && season === selectedSeason
                  ? "border-white/20 bg-white text-slate-950"
                  : "border-white/10 bg-[#14151a] text-slate-400 hover:text-white"
              }`}
              href={`/pilotos/${driverId}?year=${season}`}
              key={season}
            >
              {season} Season
            </Link>
          ))}
          <Link
            aria-current={isCareerView ? "page" : undefined}
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
              isCareerView
                ? "border-white/20 bg-white text-slate-950"
                : "border-white/10 bg-[#14151a] text-slate-400 hover:text-white"
            }`}
            href={`/pilotos/${driverId}?view=career`}
          >
            Trayectoria
          </Link>
        </nav>

        {hasInvalidSeason && (
          <p
            className="mt-4 rounded-lg border border-amber-400/20 bg-amber-400/[0.06] px-4 py-3 text-sm text-amber-200"
            role="alert"
          >
            Esa temporada no tiene resultados para este piloto. Se muestra su
            temporada más reciente.
          </p>
        )}

        <section
          aria-label="Estadísticas del piloto"
          className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6"
        >
          {statCards.map((stat) => (
            <StatCard key={stat.label} label={stat.label} value={stat.value} />
          ))}
        </section>

        {chartSeries.length > 0 && (
          <section className="mt-5 rounded-2xl border border-white/[0.07] bg-[#111217] p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-base font-bold text-white">
                {isCareerView ? "Puntos por temporada" : "Progresión de puntos"}
              </h2>
              <span className="text-xs text-slate-500">
                {isCareerView ? "Trayectoria" : `Temporada ${selectedSeason}`}
              </span>
            </div>
            <div className="overflow-x-auto">
              <svg
                aria-label={`Gráfico de ${isCareerView ? "puntos por temporada" : "progresión de puntos"} de ${driverName}`}
                className="h-52 min-w-[32rem] w-full"
                role="img"
                viewBox="0 0 500 180"
              >
                {[20, 62, 103, 144].map((y) => (
                  <line
                    key={y}
                    stroke="rgb(255 255 255 / 8%)"
                    strokeDasharray="3 5"
                    x1="20"
                    x2="480"
                    y1={y}
                    y2={y}
                  />
                ))}
                {chartCoordinates && (
                  <polyline
                    fill="none"
                    points={chartCoordinates}
                    stroke={teamColor}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="3"
                  />
                )}
                {chartSeries.map((point, index) => {
                  const x =
                    chartSeries.length > 1
                      ? 24 + (index * 452) / (chartSeries.length - 1)
                      : 250;
                  const y = 144 - (point.points / maxChartPoints) * 124;
                  return (
                    <circle
                      aria-label={`${point.label}: ${pointsFormatter.format(point.points)} puntos`}
                      cx={x}
                      cy={y}
                      fill={teamColor}
                      key={`${point.label}-${index}`}
                      r="3"
                    />
                  );
                })}
                {chartSeries.length > 0 && (
                  <>
                    <text fill="#94a3b8" fontSize="10" x="20" y="168">
                      {chartSeries[0].label}
                    </text>
                    <text
                      fill="#94a3b8"
                      fontSize="10"
                      textAnchor="end"
                      x="480"
                      y="168"
                    >
                      {chartSeries.at(-1)?.label}
                    </text>
                    <text
                      fill="#94a3b8"
                      fontSize="10"
                      textAnchor="end"
                      x="480"
                      y="15"
                    >
                      {pointsFormatter.format(maxChartPoints)} pts
                    </text>
                  </>
                )}
              </svg>
            </div>
            <p className="mt-1 text-center text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              {isCareerView ? "Temporada" : "Ronda"}
            </p>
          </section>
        )}

        <section className="mt-5 overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111217]">
          <header className="border-b border-white/[0.07] px-5 py-4">
            <h2 className="font-bold text-white">Resultados de carrera</h2>
            <p className="mt-1 text-xs text-slate-500">
              {isCareerView
                ? "Todas las temporadas con resultados importados"
                : `Temporada ${selectedSeason}`}
            </p>
          </header>
          {activeResults.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-left text-sm">
                <thead className="bg-white/[0.025] text-[10px] uppercase tracking-[0.15em] text-slate-500">
                  <tr>
                    {isCareerView && <th className="px-5 py-3">Temporada</th>}
                    <th className="px-5 py-3">Rnd</th>
                    <th className="px-5 py-3">Grand Prix</th>
                    <th className="px-5 py-3 text-right">Grid</th>
                    <th className="px-5 py-3 text-right">Finish</th>
                    <th className="px-5 py-3 text-right">+/-</th>
                    <th className="px-5 py-3 text-right">Pts</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {activeResults.map((result) => {
                    const gain =
                      result.grid !== null && result.position !== null
                        ? result.grid - result.position
                        : null;
                    return (
                      <tr
                        className="text-slate-300 transition-colors hover:bg-white/[0.025]"
                        key={`${result.race.season}-${result.race.round}`}
                      >
                        {isCareerView && (
                          <td className="px-5 py-3.5 text-slate-500">
                            {result.race.season}
                          </td>
                        )}
                        <td className="px-5 py-3.5 tabular-nums text-slate-500">
                          {result.race.round}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="block font-semibold text-white">
                            {result.race.name}
                          </span>
                          <span className="mt-0.5 block text-xs text-slate-500">
                            {result.race.circuit.name}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right tabular-nums">
                          {result.grid ?? "—"}
                        </td>
                        <td className="px-5 py-3.5 text-right font-semibold text-white">
                          {finishLabel(result.position, result.status)}
                        </td>
                        <td
                          className={`px-5 py-3.5 text-right tabular-nums ${
                            gain && gain > 0
                              ? "text-emerald-300"
                              : gain && gain < 0
                                ? "text-red-300"
                                : "text-slate-500"
                          }`}
                        >
                          {gain === null
                            ? "—"
                            : gain > 0
                              ? `+${gain}`
                              : gain === 0
                                ? "—"
                                : gain}
                        </td>
                        <td className="px-5 py-3.5 text-right font-semibold tabular-nums text-white">
                          {result.points > 0
                            ? pointsFormatter.format(result.points)
                            : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="px-5 py-10 text-center text-sm text-slate-400">
              Todavía no hay resultados importados para esta temporada.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
