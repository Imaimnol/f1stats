import Link from "next/link";
import { connection } from "next/server";

import { getPredictionLeaderboard } from "@/lib/services/predictions";

const pointsFormatter = new Intl.NumberFormat("es-AR");

export default async function RankingPage() {
  await connection();
  const { leaderboard, isDemo, error } = await getPredictionLeaderboard();

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-10 text-white sm:px-8 sm:py-14">
      <div className="mx-auto max-w-4xl">
        <header className="mb-10 border-b border-white/10 pb-8">
          <Link
            href="/"
            className="text-sm font-semibold text-red-300 transition-colors hover:text-red-200"
          >
            ← Volver al calendario
          </Link>
          <p className="mb-4 mt-6 text-sm font-semibold uppercase tracking-[0.24em] text-red-400">
            F1 Stats
          </p>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Ranking de predicciones
          </h1>
          <p className="mt-3 text-slate-300">
            Puntos acumulados por acertar el podio de cada carrera.
          </p>
          <Link
            href="/prediccion"
            className="mt-5 inline-flex rounded-full bg-red-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-400"
          >
            Hacer mi predicción
          </Link>
        </header>

        {isDemo && (
          <p
            className={`mb-6 rounded-xl border px-4 py-3 text-sm ${
              error
                ? "border-amber-400/30 bg-amber-400/10 text-amber-200"
                : "border-white/10 bg-white/[0.04] text-slate-300"
            }`}
            role={error ? "alert" : "status"}
          >
            {error ??
              "Todavía no hay puntos de predicciones. Se muestra un usuario de prueba con 1 punto como ejemplo."}
          </p>
        )}

        {leaderboard.length > 0 ? (
          <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] text-left text-sm">
                <thead className="text-xs uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="px-5 py-3 font-medium">Pos.</th>
                    <th className="px-5 py-3 font-medium">Usuario</th>
                    <th className="px-5 py-3 text-right font-medium">
                      Predicciones
                    </th>
                    <th className="px-5 py-3 text-right font-medium">
                      Puntos
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {leaderboard.map((user, index) => (
                    <tr key={user.id} className="text-slate-200">
                      <td className="px-5 py-4 font-semibold text-red-300">
                        {index + 1}
                      </td>
                      <td className="px-5 py-4 font-semibold text-white">
                        {user.username}
                      </td>
                      <td className="px-5 py-4 text-right">
                        {user.predictions}
                      </td>
                      <td className="px-5 py-4 text-right font-semibold text-white">
                        {pointsFormatter.format(user.points)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : (
          <section className="rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-12 text-center">
            <h2 className="text-xl font-semibold">Todavía no hay usuarios</h2>
            <p className="mt-2 text-slate-300">
              Registrate para participar cuando empiecen las predicciones.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
