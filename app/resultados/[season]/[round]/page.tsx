import Link from "next/link";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { fetchApiJson } from "@/lib/services/app-api";

const dateFormatter = new Intl.DateTimeFormat("es-AR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

function translateStatus(status: string | null) {
  switch (status) {
    case "Finished":
      return "Finalizó";
    case "Did not finish":
      return "No finalizó";
    case "Did not start":
      return "No tomó la salida";
    case "Disqualified":
      return "Descalificado";
    default:
      return status ?? "Sin estado";
  }
}

export default async function RaceResultsPage({
  params,
}: PageProps<"/resultados/[season]/[round]">) {
  await connection();

  const { season: seasonParam, round: roundParam } = await params;
  if (
    !/^\d{4}$/.test(seasonParam) ||
    !/^[1-9]\d*$/.test(roundParam)
  ) {
    notFound();
  }

  const season = Number(seasonParam);
  const round = Number(roundParam);
  if (
    !Number.isSafeInteger(season) ||
    season < 1950 ||
    !Number.isSafeInteger(round)
  ) {
    notFound();
  }

  const race = await fetchApiJson<{
    season: number;
    round: number;
    name: string;
    date: string;
    circuit: {
      name: string;
      locality: string | null;
      country: string | null;
    };
    results: Array<{
      position: number | null;
      grid: number | null;
      points: number;
      laps: number | null;
      status: string | null;
      driver: {
        firstName: string;
        lastName: string;
        code: string | null;
      };
      team: {
        name: string;
      };
    }>;
  }>(`/api/season-data/${season}/${round}`).catch(() => null);

  if (!race || race.results.length === 0) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-10 text-white sm:px-8 sm:py-14">
      <div className="mx-auto max-w-5xl">
        <header className="mb-10 border-b border-white/10 pb-8 sm:mb-12 sm:pb-10">
          <Link
            href={`/estadisticas?year=${race.season}`}
            className="text-sm font-semibold text-red-300 transition-colors hover:text-red-200"
          >
            ← Volver al campeonato {race.season}
          </Link>
          <div className="mt-6">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.24em] text-red-400">
              F1 Stats · Ronda {race.round}
            </p>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              {race.name}
            </h1>
            <p className="mt-3 text-base leading-7 text-slate-300">
              {race.circuit.name}
              {race.circuit.locality ? ` · ${race.circuit.locality}` : ""}
              {race.circuit.country ? `, ${race.circuit.country}` : ""}
              {" · "}
              {dateFormatter.format(new Date(race.date))}
            </p>
          </div>
        </header>

        <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <h2 className="text-lg font-semibold">Clasificación</h2>
            <p className="text-sm text-slate-400">
              {race.results.length} pilotos
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-5 py-3 font-medium">Pos.</th>
                  <th className="px-5 py-3 font-medium">Piloto</th>
                  <th className="px-5 py-3 font-medium">Equipo</th>
                  <th className="px-5 py-3 text-right font-medium">Grilla</th>
                  <th className="px-5 py-3 text-right font-medium">Vueltas</th>
                  <th className="px-5 py-3 text-right font-medium">Puntos</th>
                  <th className="px-5 py-3 text-right font-medium">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {race.results.map((result, index) => (
                  <tr
                    key={`${result.driver.code ?? result.driver.lastName}-${index}`}
                    className="text-slate-200"
                  >
                    <td className="px-5 py-4 font-semibold text-red-300">
                      {result.position ?? "—"}
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-white">
                        {result.driver.firstName} {result.driver.lastName}
                      </p>
                      {result.driver.code && (
                        <p className="mt-1 text-xs text-slate-400">
                          {result.driver.code}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-4">{result.team.name}</td>
                    <td className="px-5 py-4 text-right">
                      {result.grid ?? "—"}
                    </td>
                    <td className="px-5 py-4 text-right">
                      {result.laps ?? "—"}
                    </td>
                    <td className="px-5 py-4 text-right font-semibold text-white">
                      {result.points}
                    </td>
                    <td className="px-5 py-4 text-right">
                      {translateStatus(result.status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <p className="mt-8 text-center text-xs text-slate-500">
          Resultados guardados para esta carrera en F1 Stats.
        </p>
      </div>
    </main>
  );
}
