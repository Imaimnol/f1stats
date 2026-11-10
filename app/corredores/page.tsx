import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";

import { getSeasonDrivers } from "@/lib/services/season-drivers";

const firstAvailableSeason = 2023;

type DriversPageProps = {
  searchParams: Promise<{ year?: string | string[] }>;
};

function DriversLoading() {
  return (
    <main
      aria-label="Cargando corredores"
      className="min-h-screen bg-slate-950 px-5 py-10 text-white sm:px-8 sm:py-14"
    >
      <div className="mx-auto max-w-6xl animate-pulse">
        <div className="mb-8 border-b border-white/10 pb-8">
          <div className="h-4 w-28 rounded bg-white/10" />
          <div className="mt-6 h-10 w-64 rounded bg-white/10" />
          <div className="mt-4 h-5 w-80 max-w-full rounded bg-white/10" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <div
              className="h-56 rounded-2xl border border-white/10 bg-white/[0.04]"
              key={index}
            />
          ))}
        </div>
      </div>
    </main>
  );
}

export default function DriversPage(props: DriversPageProps) {
  return (
    <Suspense fallback={<DriversLoading />}>
      <DriversContent searchParams={props.searchParams} />
    </Suspense>
  );
}

async function DriversContent({
  searchParams,
}: DriversPageProps) {
  await connection();

  const currentSeason = new Date().getFullYear();
  const query = await searchParams;
  const requestedSeason =
    typeof query.year === "string" && /^\d{4}$/.test(query.year)
      ? Number(query.year)
      : currentSeason;
  const season =
    requestedSeason >= firstAvailableSeason &&
    requestedSeason <= currentSeason
      ? requestedSeason
      : currentSeason;
  const seasons = Array.from(
    { length: currentSeason - firstAvailableSeason + 1 },
    (_, index) => currentSeason - index
  );

  let drivers: Awaited<ReturnType<typeof getSeasonDrivers>> = [];
  let error: string | null = null;

  try {
    drivers = await getSeasonDrivers(season);
  } catch (cause) {
    console.error(`Error cargando los corredores de ${season}:`, cause);
    error =
      "No se pudieron cargar los corredores de esta temporada. Intentá nuevamente más tarde.";
  }

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-10 text-white sm:px-8 sm:py-14">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 border-b border-white/10 pb-8">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <Link
                href="/"
                className="text-sm font-semibold text-red-300 transition-colors hover:text-red-200"
              >
                ← Volver al calendario
              </Link>
              <p className="mb-3 mt-6 text-sm font-semibold uppercase tracking-[0.24em] text-red-400">
                F1 Stats
              </p>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                Corredores
              </h1>
              <p className="mt-3 max-w-xl text-base leading-7 text-slate-300">
                Pilotos y equipos de la temporada, con sus números e imágenes.
              </p>
            </div>

            <form
              action="/corredores"
              className="flex items-end gap-3"
              method="get"
            >
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Temporada
                </span>
                <select
                  className="rounded-full border border-white/15 bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                  defaultValue={season}
                  name="year"
                >
                  {seasons.map((availableSeason) => (
                    <option key={availableSeason} value={availableSeason}>
                      {availableSeason}
                    </option>
                  ))}
                </select>
              </label>
              <button
                className="rounded-full bg-red-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-400"
                type="submit"
              >
                Ver
              </button>
            </form>
          </div>
        </header>

        <nav className="mb-6 flex flex-wrap gap-3">
          <Link
            href="/estadisticas"
            className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-slate-200 transition-colors hover:border-red-400/40 hover:text-white"
          >
            Campeonatos
          </Link>
          <Link
            href="/ranking"
            className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-slate-200 transition-colors hover:border-red-400/40 hover:text-white"
          >
            Ranking
          </Link>
        </nav>

        {error ? (
          <section
            className="rounded-2xl border border-amber-400/30 bg-amber-400/10 px-6 py-8 text-amber-100"
            role="alert"
          >
            {error}
          </section>
        ) : drivers.length === 0 ? (
          <section className="rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-12 text-center">
            <h2 className="text-xl font-semibold">
              No hay corredores disponibles
            </h2>
            <p className="mt-2 text-slate-300">
              La API todavía no publicó los pilotos de la temporada {season}.
            </p>
          </section>
        ) : (
          <>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Temporada {season}</h2>
              <p className="text-sm text-slate-400">
                {drivers.length} corredores
              </p>
            </div>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {drivers.map((driver, index) => {
                const name = `${driver.firstName} ${driver.lastName}`;

                return (
                  <li
                    className="relative min-h-56 overflow-hidden rounded-2xl border bg-slate-900 transition-transform duration-200 hover:-translate-y-1 hover:shadow-xl"
                    key={`${driver.number}-${driver.code}-${name}`}
                    style={{
                      borderColor: `${driver.teamColor}70`,
                      background: `linear-gradient(125deg, ${driver.teamColor}38, #0f172a 72%)`,
                    }}
                  >
                    <Link
                      aria-label={`Ver perfil de ${name}`}
                      className="absolute inset-0 z-20 rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                      href={`/corredores/${season}/${driver.code}`}
                    >
                      <span className="sr-only">Ver perfil de {name}</span>
                    </Link>
                    {driver.headshotUrl && (
                      <div className="absolute inset-y-0 right-0 w-3/5">
                        <Image
                          alt={name}
                          className="object-contain object-bottom"
                          fill
                          loading={index < 3 ? "eager" : "lazy"}
                          sizes="(max-width: 640px) 60vw, (max-width: 1024px) 30vw, 20vw"
                          src={driver.headshotUrl}
                        />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-950/30 via-slate-950/10 to-transparent" />
                    <div className="pointer-events-none relative z-10 flex min-h-56 flex-col p-5">
                      <div className="max-w-[65%]">
                        <h3
                          className="text-xl font-bold"
                          style={{ color: driver.teamColor }}
                        >
                          {driver.lastName}
                        </h3>
                        <p className="mt-1 text-sm text-slate-300">
                          {driver.team}
                        </p>
                        <p
                          className="mt-1 text-2xl font-bold"
                          style={{ color: driver.teamColor }}
                        >
                          {driver.number}
                        </p>
                      </div>
                      <p className="mt-auto max-w-[65%] text-sm font-semibold text-white">
                        {driver.firstName} {driver.lastName}
                      </p>
                      <span className="mt-2 text-xs font-semibold text-slate-300">
                        Ver perfil →
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}

        <p className="mt-8 text-center text-xs text-slate-500">
          Información e imágenes de corredores proporcionadas por OpenF1.
        </p>
      </div>
    </main>
  );
}
