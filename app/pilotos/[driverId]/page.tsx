import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { getDriverProfile } from "@/lib/services/drivers";

const pointsFormatter = new Intl.NumberFormat("es-AR", {
  maximumFractionDigits: 2,
});

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-bold text-white">{value}</p>
    </div>
  );
}

export default async function DriverPage({
  params,
}: {
  params: Promise<{ driverId: string }>;
}) {
  await connection();
  const { driverId } = await params;
  const driver = await getDriverProfile(driverId);

  if (!driver) {
    notFound();
  }

  const driverName = `${driver.firstName} ${driver.lastName}`;

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-10 text-white sm:px-8 sm:py-14">
      <div className="mx-auto max-w-5xl">
        <header className="mb-10 border-b border-white/10 pb-8">
          <Link
            href="/estadisticas"
            className="text-sm font-semibold text-red-300 transition-colors hover:text-red-200"
          >
            ← Volver a campeonatos
          </Link>
          <p className="mb-3 mt-6 text-sm font-semibold uppercase tracking-[0.24em] text-red-400">
            Perfil de piloto
          </p>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                {driverName}
              </h1>
              <p className="mt-3 text-slate-300">
                {[driver.code, driver.nationality]
                  .filter(Boolean)
                  .join(" · ") || "Datos de piloto"}
                {driver.permanentNumber !== null &&
                  ` · #${driver.permanentNumber}`}
              </p>
            </div>
            <span className="rounded-full border border-red-400/40 bg-red-400/10 px-4 py-2 text-sm font-semibold text-red-200">
              Trayectoria registrada
            </span>
          </div>
        </header>

        {driver.results.length === 0 ? (
          <section className="rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-12 text-center">
            <h2 className="text-xl font-semibold">Todavía no hay resultados</h2>
            <p className="mt-2 leading-7 text-slate-300">
              Aún no se importaron resultados de carreras para este piloto.
            </p>
          </section>
        ) : (
          <>
            <section
              aria-label="Estadísticas de trayectoria"
              className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
            >
              <StatCard label="Carreras" value={String(driver.stats.races)} />
              <StatCard
                label="Puntos"
                value={pointsFormatter.format(driver.stats.points)}
              />
              <StatCard label="Victorias" value={String(driver.stats.wins)} />
              <StatCard label="Podios" value={String(driver.stats.podiums)} />
            </section>

            <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
              <div className="border-b border-white/10 px-5 py-4">
                <h2 className="text-lg font-semibold">Resultados por carrera</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="text-xs uppercase tracking-wider text-slate-400">
                    <tr>
                      <th className="px-5 py-3 font-medium">Temporada</th>
                      <th className="px-5 py-3 font-medium">Carrera</th>
                      <th className="px-5 py-3 font-medium">Circuito</th>
                      <th className="px-5 py-3 font-medium">Equipo</th>
                      <th className="px-5 py-3 text-right font-medium">
                        Posición
                      </th>
                      <th className="px-5 py-3 text-right font-medium">
                        Vueltas
                      </th>
                      <th className="px-5 py-3 text-right font-medium">
                        Puntos
                      </th>
                      <th className="px-5 py-3 font-medium">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {driver.results.map((result) => (
                      <tr
                        key={`${result.race.season}-${result.race.round}`}
                        className="text-slate-200"
                      >
                        <td className="px-5 py-4">{result.race.season}</td>
                        <td className="px-5 py-4">
                          <p className="font-semibold text-white">
                            {result.race.name}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            Ronda {result.race.round}
                          </p>
                        </td>
                        <td className="px-5 py-4">{result.race.circuit.name}</td>
                        <td className="px-5 py-4">{result.team.name}</td>
                        <td className="px-5 py-4 text-right font-semibold">
                          {result.position ?? "—"}
                        </td>
                        <td className="px-5 py-4 text-right">
                          {result.laps ?? "—"}
                        </td>
                        <td className="px-5 py-4 text-right">
                          {pointsFormatter.format(result.points)}
                        </td>
                        <td className="px-5 py-4">
                          {result.status ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
