import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

import { getDriverCareerProfile } from "@/lib/services/drivers";
import { getSeasonDrivers } from "@/lib/services/season-drivers";

const pointsFormatter = new Intl.NumberFormat("es-AR", {
  maximumFractionDigits: 2,
});

const carImageRevision = "94375503dc8e724e7eaae95fe3ca365da238a5dd";
const teamCarFiles: Record<string, string> = {
  alpine: "Alpine.webp",
  "alpine f1 team": "Alpine.webp",
  "aston martin": "Aston Martin.webp",
  "aston martin aramco": "Aston Martin.webp",
  audi: "Audi.webp",
  "audi revolut": "Audi.webp",
  cadillac: "Cadillac.webp",
  ferrari: "Ferrari.webp",
  "scuderia ferrari": "Ferrari.webp",
  "haas f1 team": "Haas F1 Team.webp",
  haas: "Haas F1 Team.webp",
  mclaren: "McLaren.webp",
  mercedes: "Mercedes.webp",
  "racing bulls": "Racing Bulls.webp",
  "visa cash app racing bulls": "Racing Bulls.webp",
  "red bull racing": "Red Bull Racing.webp",
  "oracle red bull racing": "Red Bull Racing.webp",
  williams: "Williams.webp",
};

function DriverProfileLoading() {
  return (
    <main
      aria-label="Cargando perfil del corredor"
      className="min-h-screen bg-slate-950 px-5 py-10 text-white sm:px-8 sm:py-14"
    >
      <div className="mx-auto max-w-5xl animate-pulse">
        <div className="h-5 w-40 rounded bg-white/10" />
        <div className="mt-8 h-72 rounded-3xl bg-white/[0.04]" />
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div
              className="h-24 rounded-2xl bg-white/[0.04]"
              key={index}
            />
          ))}
        </div>
      </div>
    </main>
  );
}

export default async function DriverProfilePage({
  params,
}: {
  params: Promise<{ season: string; code: string }>;
}) {
  return (
    <Suspense fallback={<DriverProfileLoading />}>
      <DriverProfileContent params={params} />
    </Suspense>
  );
}

async function DriverProfileContent({
  params,
}: {
  params: Promise<{ season: string; code: string }>;
}) {
  await connection();
  const { season: seasonParam, code: codeParam } = await params;
  const season = Number(seasonParam);
  const code = codeParam.toUpperCase();
  const currentSeason = new Date().getFullYear();

  if (
    !/^\d{4}$/.test(seasonParam) ||
    !Number.isSafeInteger(season) ||
    season < 2023 ||
    season > currentSeason ||
    !/^[A-Z0-9]{2,3}$/.test(code)
  ) {
    notFound();
  }

  const [seasonDrivers, profile] = await Promise.all([
    getSeasonDrivers(season),
    getDriverCareerProfile(code),
  ]);
  const driver = seasonDrivers.find((item) => item.code === code);

  if (!driver) {
    notFound();
  }

  const carFile = season === 2026 ? teamCarFiles[driver.team.toLowerCase()] : null;
  const carImageUrl = carFile
    ? `https://raw.githubusercontent.com/TracingInsights/2026/${carImageRevision}/images/cars/${encodeURIComponent(carFile)}`
    : null;
  const driverName = `${driver.firstName} ${driver.lastName}`;
  const results = profile?.results ?? [];
  const seasonResults = results.filter(
    (result) => result.race.season === season
  );
  const seasonFinishes = seasonResults
    .map((result) => result.position)
    .filter((position): position is number => position !== null && position > 0);
  const seasonStats = {
    races: seasonResults.length,
    points: seasonResults.reduce((total, result) => total + result.points, 0),
    wins: seasonResults.filter((result) => result.position === 1).length,
    podiums: seasonResults.filter(
      (result) =>
        result.position !== null &&
        result.position >= 1 &&
        result.position <= 3
    ).length,
    poles: seasonResults.filter((result) => result.grid === 1).length,
    bestFinish:
      seasonFinishes.length > 0 ? Math.min(...seasonFinishes) : null,
  };
  const careerStats = profile?.stats ?? {
    races: 0,
    points: 0,
    wins: 0,
    podiums: 0,
    poles: 0,
    bestFinish: null,
  };
  const teamInitials = driver.team
    .split(/\s+/)
    .filter((word) => !["F1", "Team", "Racing"].includes(word))
    .map((word) => word[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();

  const stats = [
    { label: `Carreras ${season}`, value: String(seasonStats.races) },
    { label: `Puntos ${season}`, value: pointsFormatter.format(seasonStats.points) },
    { label: `Victorias ${season}`, value: String(seasonStats.wins) },
    { label: `Podios ${season}`, value: String(seasonStats.podiums) },
    { label: "Carreras en F1", value: String(careerStats.races) },
    { label: "Puntos en F1", value: pointsFormatter.format(careerStats.points) },
    { label: "Victorias en F1", value: String(careerStats.wins) },
    { label: "Podios en F1", value: String(careerStats.podiums) },
    { label: "Pole positions", value: String(careerStats.poles) },
    {
      label: "Mejor resultado",
      value: careerStats.bestFinish ? `P${careerStats.bestFinish}` : "—",
    },
  ];

  return (
    <main className="relative min-h-screen isolate bg-slate-950 px-5 py-10 text-white sm:px-8 sm:py-14">
      {carImageUrl && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
        >
          <Image
            alt=""
            className="object-contain object-center sm:object-right-top"
            fill
            loading="eager"
            sizes="100vw"
            src={carImageUrl}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/45 via-slate-950/75 to-slate-950" />
        </div>
      )}
      <div className="relative z-10 mx-auto max-w-5xl">
        <Link
          href={`/corredores?year=${season}`}
          className="text-sm font-semibold text-red-300 transition-colors hover:text-red-200"
        >
          ← Volver a corredores {season}
        </Link>

        <section
          className="relative mt-8 min-h-[26rem] overflow-hidden rounded-3xl border bg-slate-900/35 sm:min-h-[32rem]"
          style={{
            borderColor: `${driver.teamColor}70`,
            background: `linear-gradient(115deg, ${driver.teamColor}70 0%, rgb(15 23 42 / 45%) 75%)`,
          }}
        >
          {driver.headshotUrl && (
            <div className="absolute inset-y-0 right-0 w-4/5 sm:w-3/5">
              <Image
                alt={driverName}
                className="object-contain object-bottom"
                fill
                preload
                sizes="(max-width: 640px) 80vw, 60vw"
                src={driver.headshotUrl}
              />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/35 to-transparent" />
          <div className="relative z-10 flex min-h-[26rem] flex-col justify-between p-6 sm:min-h-[32rem] sm:p-10">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-300">
                  Perfil de corredor · {season}
                </p>
                <h1
                  className="mt-4 text-4xl font-black tracking-tight sm:text-6xl"
                  style={{ color: driver.teamColor }}
                >
                  {driver.lastName}
                </h1>
                <p className="mt-2 text-xl font-medium text-white sm:text-2xl">
                  {driver.firstName}
                </p>
              </div>
              <p
                className="text-5xl font-black sm:text-7xl"
                style={{ color: driver.teamColor }}
              >
                {driver.number}
              </p>
            </div>

            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Escudería
                </p>
                <p className="mt-1 text-lg font-bold text-white sm:text-2xl">
                  {driver.team}
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-300">
                  {[profile?.nationality, driver.code]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              <div
                aria-label={`Identificador visual de ${driver.team}`}
                className="flex size-20 shrink-0 items-center justify-center rounded-2xl border-2 bg-slate-950/70 text-xl font-black tracking-tight sm:size-28 sm:text-3xl"
                style={{
                  borderColor: driver.teamColor,
                  color: driver.teamColor,
                  boxShadow: `0 0 32px ${driver.teamColor}45`,
                }}
              >
                {teamInitials || driver.code}
              </div>
            </div>
          </div>
        </section>
        {carImageUrl && (
          <p className="mt-2 text-right text-xs text-slate-400">
            Auto 2026 ·{" "}
            <a
              className="underline decoration-slate-500 underline-offset-2 hover:text-white"
              href="https://github.com/TracingInsights/2026"
              rel="noreferrer"
              target="_blank"
            >
              Imágenes de TracingInsights
            </a>
          </p>
        )}

        <section
          aria-label="Estadísticas del corredor"
          className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5"
        >
          {stats.map((stat) => (
            <div
              className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"
              key={stat.label}
            >
              <p className="text-xs font-medium text-slate-400">{stat.label}</p>
              <p className="mt-2 text-2xl font-bold text-white">{stat.value}</p>
            </div>
          ))}
        </section>

        {results.length === 0 ? (
          <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-6">
            <h2 className="text-lg font-semibold">
              Todavía no hay resultados importados
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Se muestran los datos del piloto para {season}; las estadísticas
              se completarán cuando sus resultados estén guardados.
            </p>
          </section>
        ) : (
          <section className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
            <div className="border-b border-white/10 px-5 py-4">
              <h2 className="text-lg font-semibold">Resultados de carrera</h2>
              <p className="mt-1 text-sm text-slate-400">
                Temporadas con resultados importados
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead className="text-xs uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="px-5 py-3 font-medium">Temporada</th>
                    <th className="px-5 py-3 font-medium">Carrera</th>
                    <th className="px-5 py-3 font-medium">Equipo</th>
                    <th className="px-5 py-3 text-right font-medium">Salida</th>
                    <th className="px-5 py-3 text-right font-medium">
                      Llegada
                    </th>
                    <th className="px-5 py-3 text-right font-medium">Puntos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {results.slice(0, 12).map((result) => (
                    <tr
                      className="text-slate-200"
                      key={`${result.race.season}-${result.race.round}`}
                    >
                      <td className="px-5 py-4">{result.race.season}</td>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-white">
                          {result.race.name}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {result.race.circuit.name}
                        </p>
                      </td>
                      <td className="px-5 py-4">{result.team.name}</td>
                      <td className="px-5 py-4 text-right">
                        {result.grid ?? "—"}
                      </td>
                      <td className="px-5 py-4 text-right font-semibold">
                        {result.position ?? "—"}
                      </td>
                      <td className="px-5 py-4 text-right">
                        {pointsFormatter.format(result.points)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
