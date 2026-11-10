import Link from "next/link";
import { connection } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import {
  getPredictionDrivers,
  getUserRacePrediction,
  preparePredictionRace,
} from "@/lib/services/predictions";
import { getSeasonRaceCalendar } from "@/lib/services/f1-import";

const raceDateFormatter = new Intl.DateTimeFormat("es-AR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "UTC",
});

export default async function PredictionPage({
  searchParams,
}: {
  searchParams: Promise<{ prediction?: string | string[] }>;
}) {
  await connection();

  const [user, query] = await Promise.all([getCurrentUser(), searchParams]);
  const result =
    typeof query.prediction === "string" ? query.prediction : null;
  const season = new Date().getFullYear();
  let raceName: string | null = null;
  let raceDate: Date | null = null;
  let raceId: string | null = null;
  let drivers: Awaited<ReturnType<typeof getPredictionDrivers>> = [];
  let prediction: Awaited<ReturnType<typeof getUserRacePrediction>> = null;
  let loadError: string | null = null;

  try {
    const calendar = await getSeasonRaceCalendar(season);
    const nextRace = calendar.races.find(
      (race) => new Date(race.dateStart).getTime() > new Date().getTime()
    );

    if (nextRace) {
      raceName = nextRace.circuitShortName;
      raceDate = new Date(nextRace.dateStart);
      const race = await preparePredictionRace(season, nextRace);
      raceId = race.id;

      if (user) {
        [drivers, prediction] = await Promise.all([
          getPredictionDrivers(season),
          getUserRacePrediction(user.id, race.id),
        ]);
      }
    }
  } catch (error) {
    console.error("Error cargando la página de predicciones:", error);
    loadError =
      "No se pudo cargar la próxima carrera o sus pilotos. Intentá nuevamente más tarde.";
  }

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-10 text-white sm:px-8 sm:py-14">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8 border-b border-white/10 pb-8">
          <Link
            href="/ranking"
            className="text-sm font-semibold text-red-300 transition-colors hover:text-red-200"
          >
            ← Volver al ranking
          </Link>
          <p className="mb-4 mt-6 text-sm font-semibold uppercase tracking-[0.24em] text-red-400">
            F1 Stats
          </p>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Mi predicción
          </h1>
          <p className="mt-3 text-slate-300">
            Elegí el podio de la próxima carrera. Podés cambiar tu pronóstico
            hasta que empiece.
          </p>
        </header>

        {result && (
          <p
            className={`mb-6 rounded-xl border px-4 py-3 text-sm ${
              result === "saved"
                ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
                : "border-amber-400/30 bg-amber-400/10 text-amber-200"
            }`}
            role={result === "saved" ? "status" : "alert"}
          >
            {result === "saved"
              ? "Tu predicción quedó guardada."
              : result === "closed"
                ? "El plazo para predecir esta carrera ya terminó."
                : "No se pudo guardar la predicción. Elegí tres pilotos distintos y probá de nuevo."}
          </p>
        )}

        {loadError ? (
          <section
            className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-6 text-amber-100"
            role="alert"
          >
            {loadError}
          </section>
        ) : !raceId || !raceName || !raceDate ? (
          <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
            <h2 className="text-xl font-semibold">
              No hay una próxima carrera disponible
            </h2>
            <p className="mt-2 text-slate-300">
              Cuando se publique una nueva fecha, vas a poder dejar tu
              predicción desde acá.
            </p>
          </section>
        ) : (
          <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-300">
              Temporada {season}
            </p>
            <h2 className="mt-2 text-2xl font-bold">{raceName}</h2>
            <p className="mt-2 text-sm text-slate-300">
              {raceDateFormatter.format(raceDate)} (UTC)
            </p>

            <div className="mt-6 rounded-xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-100">
              Cada posición exacta suma 3 puntos. Si acertás el podio completo
              en orden, sumás 6 puntos extra: 15 en total.
            </div>

            {!user ? (
              <p className="mt-6 text-slate-300">
                <Link
                  href="/login"
                  className="font-semibold text-red-300 hover:text-red-200"
                >
                  Iniciá sesión
                </Link>{" "}
                para guardar tu predicción.
              </p>
            ) : drivers.length === 0 ? (
              <p className="mt-6 text-amber-200">
                Todavía no hay pilotos cargados para esta temporada.
              </p>
            ) : (
              <form
                action="/api/predictions"
                className="mt-6 grid gap-4 sm:grid-cols-3"
                method="post"
              >
                <input name="raceId" type="hidden" value={raceId} />
                {[
                  {
                    field: "firstDriverId",
                    label: "1.º puesto",
                    value: prediction?.firstDriverId,
                  },
                  {
                    field: "secondDriverId",
                    label: "2.º puesto",
                    value: prediction?.secondDriverId,
                  },
                  {
                    field: "thirdDriverId",
                    label: "3.º puesto",
                    value: prediction?.thirdDriverId,
                  },
                ].map((position) => (
                  <label
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-400"
                    htmlFor={position.field}
                    key={position.field}
                  >
                    {position.label}
                    <select
                      className="mt-2 block w-full rounded-xl border border-white/15 bg-slate-900 px-3 py-3 text-sm font-medium normal-case tracking-normal text-white"
                      defaultValue={position.value ?? ""}
                      id={position.field}
                      name={position.field}
                      required
                    >
                      <option disabled value="">
                        Elegí un piloto
                      </option>
                      {drivers.map((driver) => (
                        <option key={driver.id} value={driver.id}>
                          {driver.firstName} {driver.lastName}
                          {driver.code ? ` (${driver.code})` : ""}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
                <button
                  className="rounded-full bg-red-500 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-400 sm:col-span-3 sm:justify-self-start"
                  type="submit"
                >
                  {prediction ? "Actualizar predicción" : "Guardar predicción"}
                </button>
              </form>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
