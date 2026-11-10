import Link from "next/link";
import { connection } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  getSeasonRaceCalendar,
  importSeason,
} from "@/lib/services/f1-import";
import { getSeasonRoundsWithResults } from "@/lib/services/race-results";
import {
  getPredictionDrivers,
  getUserRacePrediction,
  preparePredictionRace,
} from "@/lib/services/predictions";

const dateFormatter = new Intl.DateTimeFormat("es-AR", {
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});

const dayAndDateFormatter = new Intl.DateTimeFormat("es-AR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});

const timeFormatter = new Intl.DateTimeFormat("es-AR", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "UTC",
});

const firstAvailableSeason = 2023;

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{
    year?: string | string[];
    prediction?: string | string[];
  }>;
}) {
  await connection();

  const serverNow = new Date().getTime();
  const currentYear = new Date().getFullYear();
  const query = await searchParams;
  const requestedSeason =
    typeof query.year === "string" ? Number(query.year) : currentYear;
  const isValidSeason =
    typeof query.year === "string" &&
    /^\d{4}$/.test(query.year) &&
    requestedSeason >= firstAvailableSeason &&
    requestedSeason <= currentYear;
  const hasInvalidSeason = query.year !== undefined && !isValidSeason;
  const season = isValidSeason ? requestedSeason : currentYear;
  const seasons = Array.from(
    { length: Math.max(0, currentYear - firstAvailableSeason + 1) },
    (_, index) => currentYear - index
  );
  const currentUser = await getCurrentUser();
  const predictionResult =
    typeof query.prediction === "string" ? query.prediction : null;

  let roundsWithResults = await getSeasonRoundsWithResults(season);
  let importError: string | null = null;

  if (roundsWithResults.size === 0 && season >= firstAvailableSeason) {
    try {
      const summary = await importSeason(season);
      roundsWithResults = await getSeasonRoundsWithResults(season);
      if (summary.failures.length > 0) {
        importError = `No se pudieron importar ${summary.failures.length} carreras.`;
      }
    } catch (error) {
      console.error("Error importando la temporada desde OpenF1:", error);
      importError =
        error instanceof Error
          ? error.message
          : "No se pudo importar la temporada desde OpenF1.";
    }
  }

  const calendar = await getSeasonRaceCalendar(season).catch(
    (error: unknown) => {
      console.error("Error cargando el calendario de la temporada:", error);
      return null;
    }
  );

  const nextRace =
    calendar?.races.find(
      (race) => new Date(race.dateStart).getTime() >= serverNow
    ) ?? null;
  const nextRaceDate = nextRace ? new Date(nextRace.dateStart) : null;
  const countdownDays = nextRaceDate
    ? Math.max(
        0,
        Math.ceil((nextRaceDate.getTime() - serverNow) / (1000 * 60 * 60 * 24))
      )
    : null;

  let predictionSetup: {
      race: Awaited<ReturnType<typeof preparePredictionRace>>;
      drivers: Awaited<ReturnType<typeof getPredictionDrivers>>;
      prediction: Awaited<ReturnType<typeof getUserRacePrediction>>;
  } | null = null;
  let predictionLoadError: string | null = null;

  if (currentUser && nextRace) {
    try {
      const predictionRace = await preparePredictionRace(season, nextRace);
      const [drivers, prediction] = await Promise.all([
        getPredictionDrivers(season),
        getUserRacePrediction(currentUser.id, predictionRace.id),
      ]);
      predictionSetup = {
        race: predictionRace,
        drivers,
        prediction,
      };
    } catch (error) {
      console.error(
        "Error preparando la predicción de la próxima carrera:",
        error
      );
      predictionLoadError =
        "No se pudo cargar el formulario de predicción. Intentá recargar la página.";
    }
  }

  if (!calendar) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-5 py-10 text-white">
        <section className="w-full max-w-lg rounded-2xl border border-white/10 bg-white/[0.04] p-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-red-400">
            F1 Stats
          </p>
          <h1 className="mt-4 text-2xl font-bold">
            No se pudo cargar el calendario
          </h1>
          <p className="mt-3 leading-7 text-slate-300">
            No logramos consultar los datos de OpenF1. Intenta recargar la
            página en unos momentos.
          </p>
          <form action="/" method="get" className="mt-6">
            <button
              className="rounded-full bg-red-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-400"
              type="submit"
            >
              Intentar de nuevo
            </button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-10 text-white sm:px-8 sm:py-14">
      <div className="mx-auto max-w-5xl">
        <header className="mb-10 border-b border-white/10 pb-8 sm:mb-12 sm:pb-10">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.24em] text-red-400">
            F1 Stats
          </p>
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                Calendario de carreras
              </h1>
              <p className="mt-3 max-w-xl text-base leading-7 text-slate-300">
                Todas las carreras de la temporada, con fechas, circuitos y
                resultados disponibles.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/estadisticas"
                className="w-fit rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-slate-200 transition-colors hover:border-red-400/40 hover:text-white"
              >
                Ver campeonatos
              </Link>
              <Link
                href="/ranking"
                className="w-fit rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-slate-200 transition-colors hover:border-red-400/40 hover:text-white"
              >
                Ranking
              </Link>

              {currentUser ? (
                <>
                  <Link
                    className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-slate-200 transition-colors hover:border-red-400/40 hover:text-white"
                    href="/perfil"
                  >
                    Mi perfil
                  </Link>
                  <div className="flex items-center gap-3 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-2">
                    <span className="text-sm font-semibold text-red-100">
                      Hola, {currentUser.username}
                    </span>
                    <form action="/api/auth/logout" method="post">
                      <button
                        className="rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-slate-200 transition-colors hover:border-red-400/40 hover:text-white"
                        type="submit"
                      >
                        Salir
                      </button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    href="/login"
                    className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-slate-200 transition-colors hover:border-red-400/40 hover:text-white"
                  >
                    Ingresar
                  </Link>
                  <Link
                    href="/register"
                    className="rounded-full bg-red-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-400"
                  >
                    Registrarse
                  </Link>
                </div>
              )}

              <form action="/" className="flex items-center gap-2" method="get">
                <label className="sr-only" htmlFor="season">
                  Elegir temporada
                </label>
                <select
                  className="rounded-full border border-white/15 bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                  defaultValue={season}
                  id="season"
                  name="year"
                >
                  {seasons.map((availableSeason) => (
                    <option key={availableSeason} value={availableSeason}>
                      Temporada {availableSeason}
                    </option>
                  ))}
                </select>
                <button
                  className="rounded-full bg-red-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-400"
                  type="submit"
                >
                  Ver
                </button>
              </form>
            </div>
          </div>
        </header>

        {nextRace && nextRaceDate ? (
          <section className="mb-8 overflow-hidden rounded-3xl border border-red-500/20 bg-gradient-to-br from-red-500/10 via-slate-900 to-slate-900 p-6 shadow-[0_0_30px_rgba(239,68,68,0.08)]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-red-300">
                  Mi fin de semana de F1
                </p>
                <h2 className="mt-2 text-2xl font-bold text-white">
                  Próximo GP
                </h2>
              </div>
              <div className="inline-flex rounded-full border border-red-400/30 bg-red-500/10 px-3 py-1.5 text-sm font-semibold text-red-100">
                {countdownDays === 0 ? "Hoy" : `En ${countdownDays} días`}
              </div>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
              <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Ronda {nextRace.round}
                </p>
                <h3 className="mt-3 text-3xl font-bold tracking-tight text-white">
                  {nextRace.circuitShortName}
                </h3>
                <p className="mt-2 text-lg text-slate-200">
                  {nextRace.location}, {nextRace.countryName}
                </p>
                <p className="mt-4 text-sm text-slate-300">
                  {dayAndDateFormatter.format(nextRaceDate)}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Horario
                </p>
                <p className="mt-3 text-3xl font-bold text-white">
                  {timeFormatter.format(nextRaceDate)}
                </p>
                <p className="mt-2 text-sm text-slate-300">
                  Carrera principal (UTC)
                </p>
                <p className="mt-4 text-sm text-red-200">
                  {Math.max(0, countdownDays ?? 0)} días para vivir el fin de semana.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                { label: "Viernes", value: "Libres 1 y 2" },
                { label: "Sábado", value: "Libres 3 y clasificación" },
                { label: "Domingo", value: "Gran Premio" },
              ].map((slot) => (
                <div
                  key={slot.label}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    {slot.label}
                  </p>
                  <p className="mt-2 text-sm font-medium text-slate-100">
                    {slot.value}
                  </p>
                </div>
              ))}
            </div>
            <div
              className="mt-6 rounded-2xl border border-white/10 bg-slate-950/60 p-5"
              id="prediccion"
            >
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <h3 className="text-lg font-semibold">Predice el podio</h3>
                  <p className="mt-1 text-sm text-slate-300">
                    3 puntos por cada posición exacta y 6 puntos extra si
                    aciertas los tres en orden (15 puntos).
                  </p>
                </div>
                <Link
                  href="/ranking"
                  className="text-sm font-semibold text-red-300 transition-colors hover:text-red-200"
                >
                  Ver ranking →
                </Link>
              </div>

              {!currentUser ? (
                <p className="mt-4 text-sm text-slate-300">
                  <Link
                    href="/login"
                    className="font-semibold text-red-300 hover:text-red-200"
                  >
                    Inicia sesión
                  </Link>{" "}
                  para guardar tu predicción antes de que empiece la carrera.
                </p>
              ) : predictionLoadError ? (
                <p className="mt-4 text-sm text-amber-200" role="alert">
                  {predictionLoadError}
                </p>
              ) : predictionSetup?.drivers.length ? (
                <form
                  action="/api/predictions"
                  className="mt-5 grid gap-4 sm:grid-cols-3"
                  method="post"
                >
                  <input
                    name="raceId"
                    type="hidden"
                    value={predictionSetup.race.id}
                  />
                  {[
                    {
                      field: "firstDriverId",
                      label: "1.º puesto",
                      value: predictionSetup.prediction?.firstDriverId,
                    },
                    {
                      field: "secondDriverId",
                      label: "2.º puesto",
                      value: predictionSetup.prediction?.secondDriverId,
                    },
                    {
                      field: "thirdDriverId",
                      label: "3.º puesto",
                      value: predictionSetup.prediction?.thirdDriverId,
                    },
                  ].map((position) => (
                    <label
                      className="block text-xs font-semibold uppercase tracking-wider text-slate-400"
                      htmlFor={position.field}
                      key={position.field}
                    >
                      {position.label}
                      <select
                        className="mt-2 block w-full rounded-xl border border-white/15 bg-slate-900 px-3 py-2 text-sm font-medium normal-case tracking-normal text-white"
                        defaultValue={position.value ?? ""}
                        id={position.field}
                        name={position.field}
                        required
                      >
                        <option disabled value="">
                          Elegí un piloto
                        </option>
                        {predictionSetup.drivers.map((driver) => (
                          <option key={driver.id} value={driver.id}>
                            {driver.firstName} {driver.lastName}
                            {driver.code ? ` (${driver.code})` : ""}
                          </option>
                        ))}
                      </select>
                    </label>
                  ))}
                  <button
                    className="rounded-full bg-red-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-400 sm:col-span-3 sm:justify-self-start"
                    type="submit"
                  >
                    {predictionSetup.prediction
                      ? "Actualizar predicción"
                      : "Guardar predicción"}
                  </button>
                </form>
              ) : currentUser ? (
                <p className="mt-4 text-sm text-amber-200">
                  Todavía no hay pilotos cargados para armar una predicción.
                </p>
              ) : null}
            </div>
          </section>
        ) : (
          <section className="mb-8 rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
              Mi fin de semana de F1
            </p>
            <h2 className="mt-3 text-2xl font-bold text-white">
              Próximo GP no disponible
            </h2>
            <p className="mt-2 text-slate-300">
              Todavía no hay una carrera próxima en esta temporada.
            </p>
          </section>
        )}

        {predictionResult && (
          <p
            className={`mb-6 rounded-xl border px-4 py-3 text-sm ${
              predictionResult === "saved"
                ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
                : "border-amber-400/30 bg-amber-400/10 text-amber-200"
            }`}
            role={predictionResult === "saved" ? "status" : "alert"}
          >
            {predictionResult === "saved"
              ? "Tu predicción quedó guardada."
              : predictionResult === "closed"
                ? "El plazo para predecir esta carrera ya terminó."
                : "No se pudo guardar la predicción. Verifica que hayas elegido tres pilotos distintos."}
          </p>
        )}

        {hasInvalidSeason && (
          <p
            className="mb-6 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-200"
            role="alert"
          >
            La temporada solicitada no es válida. Elegí un año entre {firstAvailableSeason} y {currentYear}.
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

        {calendar.races.length === 0 ? (
          <section className="rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-12 text-center">
            <h2 className="text-xl font-semibold">
              Calendario todavía no disponible
            </h2>
            <p className="mt-2 text-slate-300">
              OpenF1 aún no publicó carreras para la temporada {calendar.season}.
            </p>
          </section>
        ) : (
          <>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                Temporada {calendar.season}
              </h2>
              <p className="text-sm text-slate-400">
                {calendar.races.length} carreras
              </p>
            </div>

            <ol className="grid gap-3 sm:grid-cols-2">
              {calendar.races.map((race) => {
                const hasResults = roundsWithResults.has(race.round);

                return (
                  <li
                    key={race.sessionKey}
                    className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition-colors hover:border-red-400/40 hover:bg-white/[0.07]"
                  >
                    <div className="flex min-w-0 items-start gap-4">
                      <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-red-500/15 text-sm font-bold text-red-300">
                        {String(race.round).padStart(2, "0")}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                          Ronda {race.round}
                        </p>
                        <h3 className="mt-1 truncate text-lg font-semibold">
                          {race.circuitShortName}
                        </h3>
                        <p className="mt-1 text-sm text-slate-300">
                          {race.location}, {race.countryName}
                        </p>
                      </div>
                    </div>
                    <div className="mt-5 border-t border-white/10 pt-4">
                      <p className="text-sm font-medium text-slate-200">
                        {dateFormatter.format(new Date(race.dateStart))}
                      </p>
                      {hasResults ? (
                        <Link
                          href={`/resultados/${season}/${race.round}`}
                          className="mt-3 inline-flex rounded-full border border-red-400/40 bg-red-500/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-red-200 transition-colors hover:border-red-300 hover:text-red-100"
                        >
                          Ver resultados
                        </Link>
                      ) : (
                        <p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                          Resultados todavía no disponibles
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          </>
        )}

        <p className="mt-8 text-center text-xs text-slate-500">
          Datos del calendario proporcionados por OpenF1.
        </p>
      </div>
    </main>
  );
}
