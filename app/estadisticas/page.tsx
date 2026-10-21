import Link from "next/link";
import { connection } from "next/server";
import { getSeasonStandings } from "@/lib/services/standings";

const pointsFormatter = new Intl.NumberFormat("es-AR", {
  maximumFractionDigits: 2,
});

type Standing = {
  id: string;
  name: string;
  detail: string | null;
  points: number;
  wins: number;
  podiums: number;
  starts: number;
};

function StandingsTable({
  title,
  rows,
}: {
  title: string;
  rows: Standing[];
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
                  <p className="font-semibold text-white">{row.name}</p>
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

export default async function StatisticsPage() {
  await connection();

  const season = new Date().getFullYear();
  const standings = await getSeasonStandings(season);

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
            <span className="w-fit rounded-full border border-red-400/40 bg-red-400/10 px-4 py-2 text-sm font-semibold text-red-200">
              Temporada {season}
            </span>
          </div>
        </header>

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
              <StandingsTable title="Pilotos" rows={standings.drivers} />
              <StandingsTable
                title="Constructores"
                rows={standings.constructors}
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
