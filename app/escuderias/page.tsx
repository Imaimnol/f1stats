import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";

import TeamMark from "@/app/team-mark";
import { getSeasonDrivers } from "@/lib/services/season-drivers";
import { findTeamLogo, teamLogos } from "@/lib/team-logos";

const season = 2026;
const carImageRevision = "94375503dc8e724e7eaae95fe3ca365da238a5dd";

type SeasonDriver = Awaited<ReturnType<typeof getSeasonDrivers>>[number];

function EscuderiasLoading() {
  return (
    <main
      aria-label="Cargando escuderías"
      className="min-h-screen bg-[#090a0e] px-4 py-6 text-white sm:px-8 sm:py-9"
    >
      <div className="mx-auto max-w-6xl animate-pulse">
        <div className="mb-8 border-b border-white/10 pb-8">
          <div className="h-4 w-28 rounded bg-white/10" />
          <div className="mt-6 h-10 w-64 rounded bg-white/10" />
          <div className="mt-4 h-5 w-80 max-w-full rounded bg-white/10" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }, (_, index) => (
            <div
              className="h-80 rounded-2xl border border-white/10 bg-[#111217]"
              key={index}
            />
          ))}
        </div>
      </div>
    </main>
  );
}

export default function EscuderiasPage() {
  return (
    <Suspense fallback={<EscuderiasLoading />}>
      <EscuderiasContent />
    </Suspense>
  );
}

async function EscuderiasContent() {
  await connection();

  let drivers: SeasonDriver[] = [];
  let error: string | null = null;

  try {
    drivers = await getSeasonDrivers(season);
  } catch (cause) {
    console.error(`Error cargando los pilotos de las escuderías ${season}:`, cause);
    error =
      "No se pudieron cargar los pilotos de esta temporada. Intentá nuevamente más tarde.";
  }

  const teams = teamLogos.map((team) => {
    const teamDrivers = drivers
      .filter((driver) => findTeamLogo(driver.team)?.slug === team.slug)
      .slice(0, 2);

    return {
      ...team,
      color: teamDrivers[0]?.teamColor ?? team.color,
      drivers: teamDrivers,
      carImage: `https://raw.githubusercontent.com/TracingInsights/2026/${carImageRevision}/images/cars/${encodeURIComponent(team.carFile)}`,
    };
  });

  return (
    <main className="min-h-screen bg-[#090a0e] px-4 py-6 text-white sm:px-8 sm:py-9">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 border-b border-white/10 pb-8">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <Link
                className="text-sm font-semibold text-red-300 transition-colors hover:text-red-200"
                href="/"
              >
                ← Volver al calendario
              </Link>
              <p className="mb-3 mt-6 text-sm font-semibold uppercase tracking-[0.24em] text-red-400">
                F1 Stats
              </p>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Escuderías
              </h1>
              <p className="mt-3 max-w-xl text-base leading-7 text-slate-300">
                Autos y pilotos de la temporada {season}.
              </p>
            </div>
            <p className="text-sm text-slate-400">{teams.length} escuderías</p>
          </div>
        </header>

        <nav aria-label="Secciones relacionadas" className="mb-6 flex flex-wrap gap-3">
          <Link
            className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-slate-200 transition-colors hover:border-red-400/40 hover:text-white"
            href="/corredores?year=2026"
          >
            Corredores
          </Link>
          <Link
            className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-slate-200 transition-colors hover:border-red-400/40 hover:text-white"
            href="/constructores?year=2026"
          >
            Campeonato de constructores
          </Link>
        </nav>

        {error && (
          <p
            className="mb-5 rounded-xl border border-amber-400/25 bg-amber-400/[0.07] px-4 py-3 text-sm text-amber-200"
            role="alert"
          >
            {error}
          </p>
        )}

        <ul className="grid gap-4 sm:grid-cols-2">
          {teams.map((team, index) => (
            <li
              className="overflow-hidden rounded-2xl border border-white/10 shadow-xl shadow-black/20"
              key={team.slug}
            >
              <div
                className="relative flex min-h-36 items-start justify-between gap-4 px-5 py-5 sm:px-7"
                style={{
                  background: `linear-gradient(110deg, ${team.color} 0%, ${team.color}e8 100%)`,
                }}
              >
                <div className="min-w-0">
                  <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                    {team.name}
                  </h2>
                  {team.drivers.length > 0 ? (
                    <ul
                      aria-label={`Pilotos de ${team.name}`}
                      className="mt-3 flex flex-wrap gap-x-4 gap-y-2"
                    >
                      {team.drivers.map((driver) => (
                        <li
                          className="flex items-center gap-2 text-sm text-white"
                          key={driver.code}
                        >
                          {driver.headshotUrl ? (
                            <Image
                              alt=""
                              className="size-7 shrink-0 rounded-full border border-white/40 object-cover"
                              height={28}
                              sizes="28px"
                              src={driver.headshotUrl}
                              width={28}
                            />
                          ) : (
                            <span
                              aria-hidden="true"
                              className="flex size-7 shrink-0 items-center justify-center rounded-full border border-white/40 bg-black/20 text-[9px] font-bold"
                            >
                              {driver.code}
                            </span>
                          )}
                          <span className="whitespace-nowrap">
                            {driver.firstName}{" "}
                            <strong className="font-extrabold uppercase">
                              {driver.lastName}
                            </strong>
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-3 text-sm text-white/80">
                      {error
                        ? "Pilotos no disponibles"
                        : "Todavía no hay pilotos cargados"}
                    </p>
                  )}
                </div>
                <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-black/25 sm:size-16">
                  <TeamMark size="md" team={team.name} />
                </span>
              </div>
              <div
                className="relative isolate overflow-hidden"
                style={{ backgroundColor: team.color }}
              >
                <div
                  aria-hidden="true"
                  className="absolute inset-0 opacity-30"
                  style={{
                    backgroundImage: `radial-gradient(${team.color} 1px, transparent 1.5px)`,
                    backgroundSize: "5px 5px",
                  }}
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-white/10"
                />
                <div className="relative h-44 sm:h-48">
                  <Image
                    alt={`Auto de ${team.name}, temporada ${season}`}
                    className="object-contain object-center mix-blend-multiply"
                    fill
                    loading={index < 2 ? "eager" : "lazy"}
                    sizes="(max-width: 640px) 100vw, 50vw"
                    src={team.carImage}
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>

        <p className="mt-8 text-center text-xs text-slate-500">
          Autos de{" "}
          <a
            className="underline decoration-slate-500 underline-offset-2 hover:text-white"
            href="https://github.com/TracingInsights/2026"
            rel="noreferrer"
            target="_blank"
          >
            TracingInsights
          </a>{" "}
          · Pilotos e imágenes proporcionados por OpenF1.
        </p>
      </div>
    </main>
  );
}
