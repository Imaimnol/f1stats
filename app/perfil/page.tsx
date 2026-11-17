import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const accents = {
  red: {
    label: "Rojo racing",
    border: "border-red-400/30",
    text: "text-red-200",
    ring: "ring-red-400",
    background: "from-red-500/20 via-slate-900 to-slate-900",
    swatch: "bg-red-500",
  },
  cyan: {
    label: "Azul eléctrico",
    border: "border-cyan-400/30",
    text: "text-cyan-200",
    ring: "ring-cyan-400",
    background: "from-cyan-500/20 via-slate-900 to-slate-900",
    swatch: "bg-cyan-400",
  },
  lime: {
    label: "Verde bandera",
    border: "border-lime-400/30",
    text: "text-lime-200",
    ring: "ring-lime-400",
    background: "from-lime-500/20 via-slate-900 to-slate-900",
    swatch: "bg-lime-400",
  },
  violet: {
    label: "Violeta noche",
    border: "border-violet-400/30",
    text: "text-violet-200",
    ring: "ring-violet-400",
    background: "from-violet-500/20 via-slate-900 to-slate-900",
    swatch: "bg-violet-400",
  },
} as const;

const avatars = ["🏎️", "🏁", "🏆", "⚡", "🔥"];

const dateFormatter = new Intl.DateTimeFormat("es-AR", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

export default async function PerfilPage({
  searchParams,
}: {
  searchParams: Promise<{
    updated?: string;
    favorites?: string;
    error?: string;
  }>;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const query = await searchParams;
  const [profileUser, drivers, teams, circuits, predictions] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        bio: true,
        profileAccent: true,
        profileAvatar: true,
        createdAt: true,
        favoriteDriver: {
          select: { id: true, firstName: true, lastName: true, code: true },
        },
        favoriteTeam: { select: { id: true, name: true } },
        favoriteCircuit: {
          select: { id: true, name: true, country: true },
        },
      },
    }),
    prisma.driver.findMany({
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      select: { id: true, firstName: true, lastName: true, code: true },
    }),
    prisma.team.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.circuit.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, country: true },
    }),
    prisma.racePrediction.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        firstDriverId: true,
        secondDriverId: true,
        thirdDriverId: true,
        updatedAt: true,
        race: {
          select: {
            name: true,
            results: {
              select: { driverId: true, position: true },
            },
          },
        },
      },
    }),
  ]);

  if (!profileUser) {
    redirect("/login");
  }

  const accent =
    accents[profileUser.profileAccent as keyof typeof accents] ?? accents.red;
  const avatar = avatars.includes(profileUser.profileAvatar)
    ? profileUser.profileAvatar
    : avatars[0];
  const favoriteCount = [
    profileUser.favoriteDriver,
    profileUser.favoriteTeam,
    profileUser.favoriteCircuit,
  ].filter(Boolean).length;

  const scoredPredictions = predictions.map((prediction) => {
    const predictedDrivers = [
      prediction.firstDriverId,
      prediction.secondDriverId,
      prediction.thirdDriverId,
    ];
    const exactPositions = predictedDrivers.reduce((count, driverId, index) => {
      const actual = prediction.race.results.find(
        (result) => result.position === index + 1
      );
      return count + Number(actual?.driverId === driverId);
    }, 0);

    return {
      ...prediction,
      exactPositions,
      hasResult: prediction.race.results.length > 0,
      points: exactPositions * 3 + (exactPositions === 3 ? 6 : 0),
    };
  });
  const totalPredictionPoints = scoredPredictions.reduce(
    (total, prediction) => total + prediction.points,
    0
  );
  const completedPredictions = scoredPredictions.filter(
    (prediction) => prediction.hasResult
  ).length;
  const perfectPodiums = scoredPredictions.filter(
    (prediction) => prediction.exactPositions === 3
  ).length;
  const achievements = [
    {
      title: "Primer pronóstico",
      description: "Guarda tu primer podio.",
      progress: Math.min(predictions.length, 1),
      goal: 1,
      icon: "🎯",
      accent: "border-red-400/25 bg-red-500/[0.06] text-red-200",
    },
    {
      title: "Estratega",
      description: "Participa en cinco pronósticos.",
      progress: Math.min(predictions.length, 5),
      goal: 5,
      icon: "🧠",
      accent: "border-cyan-400/25 bg-cyan-500/[0.06] text-cyan-200",
    },
    {
      title: "Podio perfecto",
      description: "Acierta los tres puestos en orden.",
      progress: Math.min(perfectPodiums, 1),
      goal: 1,
      icon: "🏆",
      accent: "border-amber-400/25 bg-amber-500/[0.06] text-amber-200",
    },
    {
      title: "Fan de paddock",
      description: "Elige piloto, equipo y circuito favoritos.",
      progress: favoriteCount,
      goal: 3,
      icon: "🏎️",
      accent: "border-violet-400/25 bg-violet-500/[0.06] text-violet-200",
    },
  ];
  const recentPredictions = scoredPredictions.slice(0, 4);

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-8 text-white sm:px-8 sm:py-12">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 flex items-center justify-between gap-4">
          <Link
            className="text-sm font-semibold text-slate-300 transition-colors hover:text-white"
            href="/"
          >
            ← F1 Stats
          </Link>
          <form action="/api/auth/logout" method="post">
            <button
              className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-slate-200 transition-colors hover:border-red-400/40 hover:text-white"
              type="submit"
            >
              Cerrar sesión
            </button>
          </form>
        </header>

        {query.updated === "1" && (
          <p
            className="mb-5 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200"
            role="status"
          >
            Tu perfil se guardó correctamente.
          </p>
        )}
        {query.favorites === "1" && (
          <p
            className="mb-5 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200"
            role="status"
          >
            Tus favoritos se actualizaron.
          </p>
        )}
        {query.error && (
          <p
            className="mb-5 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-200"
            role="alert"
          >
            {query.error === "length"
              ? "El nombre visible admite hasta 32 caracteres y la presentación hasta 160."
              : query.error === "favorite"
                ? "No se pudo guardar un favorito porque ya no existe. Actualiza la página e intenta de nuevo."
                : "No se pudieron validar las opciones del perfil. Revisa los cambios e intenta de nuevo."}
          </p>
        )}

        <section
          className={`relative mb-6 overflow-hidden rounded-3xl border ${accent.border} bg-gradient-to-br ${accent.background} p-6 sm:p-8`}
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-10 -top-20 size-64 rounded-full border border-white/[0.06]"
          />
          <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
            <div className="flex items-center gap-5">
              <div
                className={`flex size-20 shrink-0 items-center justify-center rounded-3xl border ${accent.border} bg-slate-950/60 text-4xl shadow-lg`}
              >
                {avatar}
              </div>
              <div className="min-w-0">
                <p className={`text-xs font-bold uppercase tracking-[0.2em] ${accent.text}`}>
                  Perfil de piloto
                </p>
                <h1 className="mt-1 truncate text-3xl font-black tracking-tight sm:text-4xl">
                  {profileUser.displayName || profileUser.username}
                </h1>
                <p className="mt-1 text-sm text-slate-300">
                  @{profileUser.username} · En el paddock desde{" "}
                  {dateFormatter.format(profileUser.createdAt)}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:min-w-64">
              <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                <p className="text-2xl font-black tabular-nums">
                  {predictions.length}
                </p>
                <p className="mt-1 text-xs text-slate-400">Pronósticos</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                <p className="text-2xl font-black tabular-nums">
                  {totalPredictionPoints}
                </p>
                <p className="mt-1 text-xs text-slate-400">Puntos F1</p>
              </div>
            </div>
          </div>
          <p className="relative mt-6 max-w-2xl text-sm leading-6 text-slate-300">
            {profileUser.bio || "Todavía no agregaste una presentación. Contale al paddock qué te mueve de la F1."}
          </p>
        </section>

        <section className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Carreras pronosticadas",
              value: predictions.length,
              detail: "podios enviados",
              icon: "📋",
            },
            {
              label: "Resultados puntuados",
              value: completedPredictions,
              detail: "carreras con resultado",
              icon: "🏁",
            },
            {
              label: "Podios perfectos",
              value: perfectPodiums,
              detail: "tres aciertos en orden",
              icon: "🥇",
            },
            {
              label: "Preferencias",
              value: `${favoriteCount}/3`,
              detail: "piloto · equipo · circuito",
              icon: "❤️",
            },
          ].map((stat) => (
            <article
              className="rounded-2xl border border-white/10 bg-white/[0.04] p-5"
              key={stat.label}
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {stat.label}
                </p>
                <span aria-hidden="true" className="text-lg">
                  {stat.icon}
                </span>
              </div>
              <p className="mt-3 text-3xl font-black tabular-nums">
                {stat.value}
              </p>
              <p className="mt-1 text-xs text-slate-500">{stat.detail}</p>
            </article>
          ))}
        </section>

        <section className="mb-6 rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-7">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Progreso
              </p>
              <h2 className="mt-1 text-2xl font-bold">Insignias del paddock</h2>
            </div>
            <p className="text-sm text-slate-400">
              {achievements.filter((item) => item.progress >= item.goal).length}{" "}
              de {achievements.length} desbloqueadas
            </p>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {achievements.map((achievement) => {
              const isUnlocked = achievement.progress >= achievement.goal;
              const progressPercent = Math.min(
                100,
                (achievement.progress / achievement.goal) * 100
              );

              return (
                <article
                  className={`rounded-2xl border p-4 transition-colors ${
                    isUnlocked
                      ? achievement.accent
                      : "border-white/10 bg-slate-950/40 text-slate-300"
                  }`}
                  key={achievement.title}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span
                      aria-hidden="true"
                      className={`flex size-11 items-center justify-center rounded-xl text-xl ${
                        isUnlocked ? "bg-white/[0.08]" : "bg-white/[0.04] grayscale"
                      }`}
                    >
                      {achievement.icon}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider ${
                        isUnlocked ? "" : "text-slate-500"
                      }`}
                    >
                      {isUnlocked ? "Desbloqueada" : "Bloqueada"}
                    </span>
                  </div>
                  <h3 className="mt-4 font-bold">{achievement.title}</h3>
                  <p className="mt-1 min-h-10 text-xs leading-5 text-slate-400">
                    {achievement.description}
                  </p>
                  <div className="mt-3">
                    <div className="mb-1.5 flex justify-between text-[10px] text-slate-500">
                      <span>Progreso</span>
                      <span>
                        {achievement.progress}/{achievement.goal}
                      </span>
                    </div>
                    <div
                      aria-label={`${achievement.progress} de ${achievement.goal}`}
                      className="h-1.5 overflow-hidden rounded-full bg-white/10"
                      role="progressbar"
                      aria-valuemax={achievement.goal}
                      aria-valuemin={0}
                      aria-valuenow={achievement.progress}
                    >
                      <div
                        className={`h-full rounded-full transition-all ${
                          isUnlocked ? "bg-current" : "bg-slate-500"
                        }`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="space-y-6">
            <form
              action="/api/profile"
              className="rounded-3xl border border-white/10 bg-white/[0.04] p-6"
              method="post"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Personalización
              </p>
              <h2 className="mt-1 text-2xl font-bold">Dale tu estilo</h2>

              <label className="mt-5 block text-sm font-medium text-slate-200" htmlFor="displayName">
                Nombre visible
              </label>
              <input
                autoComplete="nickname"
                className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-red-400"
                id="displayName"
                maxLength={32}
                name="displayName"
                placeholder={profileUser.username}
                defaultValue={profileUser.displayName ?? ""}
              />
              <p className="mt-1 text-xs text-slate-500">
                Tu nombre de usuario @{profileUser.username} no cambia.
              </p>

              <label className="mt-4 block text-sm font-medium text-slate-200" htmlFor="bio">
                Presentación
              </label>
              <textarea
                className="mt-2 min-h-24 w-full resize-y rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-red-400"
                id="bio"
                maxLength={160}
                name="bio"
                placeholder="¿Piloto, escudería o circuito favorito? Contalo en una línea."
                defaultValue={profileUser.bio ?? ""}
              />
              <p className="mt-1 text-xs text-slate-500">Hasta 160 caracteres.</p>

              <fieldset className="mt-5">
                <legend className="text-sm font-medium text-slate-200">
                  Avatar
                </legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  {avatars.map((option) => (
                    <label className="cursor-pointer" key={option}>
                      <input
                        className="peer sr-only"
                        defaultChecked={avatar === option}
                        name="profileAvatar"
                        type="radio"
                        value={option}
                      />
                      <span className="flex size-12 items-center justify-center rounded-xl border border-white/10 bg-slate-900 text-2xl transition peer-checked:border-red-400 peer-checked:bg-red-500/10 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-red-400">
                        {option}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <fieldset className="mt-5">
                <legend className="text-sm font-medium text-slate-200">
                  Color del perfil
                </legend>
                <div className="mt-3 flex flex-wrap gap-3">
                  {Object.entries(accents).map(([key, option]) => (
                    <label
                      className="flex cursor-pointer items-center gap-2 text-xs text-slate-300"
                      key={key}
                    >
                      <input
                        className={`size-4 accent-current ${option.text}`}
                        defaultChecked={profileUser.profileAccent === key}
                        name="profileAccent"
                        type="radio"
                        value={key}
                      />
                      <span
                        aria-hidden="true"
                        className={`size-3 rounded-full ${option.swatch}`}
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
              </fieldset>

              <button
                className="mt-6 w-full rounded-xl bg-red-500 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-red-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-300"
                type="submit"
              >
                Guardar mi perfil
              </button>
            </form>

            <form
              action="/api/user-preferences"
              className="rounded-3xl border border-white/10 bg-white/[0.04] p-6"
              method="post"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Mi garaje
              </p>
              <h2 className="mt-1 text-2xl font-bold">Mis favoritos</h2>
              <div className="mt-5 space-y-4">
                <label className="block text-sm font-medium text-slate-200" htmlFor="favoriteDriverId">
                  Piloto
                  <select
                    className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-red-400"
                    defaultValue={profileUser.favoriteDriver?.id ?? ""}
                    id="favoriteDriverId"
                    name="favoriteDriverId"
                  >
                    <option value="">Elegir piloto</option>
                    {drivers.map((driver) => (
                      <option key={driver.id} value={driver.id}>
                        {driver.firstName} {driver.lastName}
                        {driver.code ? ` (${driver.code})` : ""}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm font-medium text-slate-200" htmlFor="favoriteTeamId">
                  Escudería
                  <select
                    className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-red-400"
                    defaultValue={profileUser.favoriteTeam?.id ?? ""}
                    id="favoriteTeamId"
                    name="favoriteTeamId"
                  >
                    <option value="">Elegir escudería</option>
                    {teams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm font-medium text-slate-200" htmlFor="favoriteCircuitId">
                  Circuito
                  <select
                    className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none focus:border-red-400"
                    defaultValue={profileUser.favoriteCircuit?.id ?? ""}
                    id="favoriteCircuitId"
                    name="favoriteCircuitId"
                  >
                    <option value="">Elegir circuito</option>
                    {circuits.map((circuit) => (
                      <option key={circuit.id} value={circuit.id}>
                        {circuit.name}
                        {circuit.country ? ` · ${circuit.country}` : ""}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <button
                className="mt-6 w-full rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold text-white transition-colors hover:border-red-400/40 hover:bg-white/[0.04]"
                type="submit"
              >
                Guardar favoritos
              </button>
            </form>
          </div>

          <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Desde la parrilla
                </p>
                <h2 className="mt-1 text-2xl font-bold">Mis pronósticos</h2>
              </div>
              <Link
                className={`text-sm font-semibold ${accent.text} transition-opacity hover:opacity-80`}
                href="/ranking"
              >
                Ver ranking →
              </Link>
            </div>
            {recentPredictions.length ? (
              <ol className="mt-5 space-y-3">
                {recentPredictions.map((prediction) => (
                  <li
                    className="rounded-2xl border border-white/10 bg-slate-950/50 p-4"
                    key={prediction.id}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-white">
                          {prediction.race.name}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Actualizado el {dateFormatter.format(prediction.updatedAt)}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-bold ${
                          prediction.hasResult
                            ? `${accent.border} ${accent.text}`
                            : "border-white/10 text-slate-400"
                        }`}
                      >
                        {prediction.hasResult
                          ? `${prediction.points} pts`
                          : "Pendiente"}
                      </span>
                    </div>
                    {prediction.exactPositions === 3 && (
                      <p className="mt-3 text-xs font-semibold text-amber-200">
                        🏆 ¡Podio perfecto!
                      </p>
                    )}
                  </li>
                ))}
              </ol>
            ) : (
              <div className="mt-5 rounded-2xl border border-dashed border-white/15 bg-slate-950/30 p-6 text-center">
                <p aria-hidden="true" className="text-3xl">🏁</p>
                <p className="mt-3 font-semibold text-white">
                  Tu temporada empieza acá
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-400">
                  Pronostica el próximo podio y suma puntos para desbloquear insignias.
                </p>
                <Link
                  className="mt-4 inline-flex rounded-full bg-red-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-400"
                  href="/prediccion"
                >
                  Hacer un pronóstico
                </Link>
              </div>
            )}
          </section>
        </div>
        <p className="mt-8 text-center text-xs text-slate-600">
          {profileUser.email} · F1 Stats
        </p>
      </div>
    </main>
  );
}
