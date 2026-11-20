"use client";

import { useState } from "react";
import Link from "next/link";

import TeamMark from "@/app/team-mark";
import { findTeamLogo, teamLogos } from "@/lib/team-logos";

type IconName =
  | "bolt"
  | "calendar"
  | "camera"
  | "check"
  | "flag"
  | "heart"
  | "lock"
  | "medal"
  | "pencil"
  | "sliders"
  | "trophy"
  | "user";

type DriverOption = {
  id: string;
  firstName: string;
  lastName: string;
  code: string | null;
};

type TeamOption = { id: string; name: string };
type CircuitOption = { id: string; name: string; country: string | null };

type ProfileData = {
  username: string;
  email: string;
  displayName: string | null;
  bio: string | null;
  avatar: string;
  accent: string;
  accentColor: string;
  favoriteTeamColor?: string;
  createdAt: string;
  favoriteDriver: DriverOption | null;
  favoriteTeam: TeamOption | null;
  favoriteCircuit: CircuitOption | null;
};

type PredictionRow = {
  id: string;
  race: string;
  season: number;
  round: number;
  raceDate: string;
  updatedAt: string;
  hasResult: boolean;
  points: number;
  perfect: boolean;
  predictedPodium: string[];
  actualPodium: string[];
  exactPositions: number;
  evaluatedPositions: number;
};

type ProfileDashboardProps = {
  profile: ProfileData;
  options: {
    drivers: DriverOption[];
    teams: TeamOption[];
    circuits: CircuitOption[];
  };
  stats: {
    predictions: number;
    completed: number;
    perfect: number;
    preferences: number;
    points: number;
    exactPicks: number;
    evaluatedPicks: number;
  };
  predictions: PredictionRow[];
  query: { updated?: string; favorites?: string; error?: string };
};

const avatarOptions = [
  { value: "car", legacyValue: "🏎️", icon: "user" as const, label: "Piloto" },
  { value: "flag", legacyValue: "🏁", icon: "flag" as const, label: "Bandera" },
  { value: "trophy", legacyValue: "🏆", icon: "trophy" as const, label: "Trofeo" },
  { value: "bolt", legacyValue: "⚡", icon: "bolt" as const, label: "Rayo" },
  { value: "flame", legacyValue: "🔥", icon: "heart" as const, label: "Fuego" },
];

const accentOptions = [
  { value: "red", color: "#e10600", label: "Rojo" },
  { value: "cyan", color: "#22d3ee", label: "Cian" },
  { value: "lime", color: "#a3e635", label: "Verde" },
  { value: "violet", color: "#a78bfa", label: "Violeta" },
];

function Icon({
  name,
  className = "h-5 w-5",
}: {
  name: IconName;
  className?: string;
}) {
  const paths: Record<IconName, React.ReactNode> = {
    bolt: <path d="m13 2-3 8h7l-6 12 1-9H5l8-11Z" />,
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 11h18" />
      </>
    ),
    camera: (
      <>
        <path d="M14 5h-4l-2 2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2-2Z" />
        <circle cx="12" cy="13" r="3" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    flag: (
      <>
        <path d="M4 22V4m0 1c6-4 10 4 16 0v11c-6 4-10-4-16 0" />
      </>
    ),
    heart: (
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />
    ),
    lock: (
      <>
        <rect x="4" y="10" width="16" height="11" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3m-4 4v3" />
      </>
    ),
    medal: (
      <>
        <circle cx="12" cy="8" r="5" />
        <path d="m8.2 12-1.4 9 5.2-3 5.2 3-1.4-9" />
      </>
    ),
    pencil: (
      <>
        <path d="m16 4 4 4M4 20l4-.8L19 8a2.1 2.1 0 0 0-3-3L5 16l-1 4Z" />
      </>
    ),
    sliders: (
      <>
        <path d="M4 21v-7m0-4V3m8 18v-9m0-4V3m8 18v-5m0-4V3M2 14h4m4-6h4m4 8h4" />
      </>
    ),
    trophy: (
      <>
        <path d="M8 21h8m-4-4v4m-5-17h10v5a5 5 0 0 1-10 0V4ZM7 6H4v2a4 4 0 0 0 4 4m9-6h3v2a4 4 0 0 1-4 4" />
      </>
    ),
    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M5 21a7 7 0 0 1 14 0" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.7"
      viewBox="0 0 24 24"
    >
      {paths[name]}
    </svg>
  );
}

function driverName(driver: DriverOption | null) {
  return driver ? `${driver.firstName} ${driver.lastName}` : "Elegí tu piloto";
}

function TeamAvatar({
  name,
  size = "md",
}: {
  name: string;
  size?: "md" | "lg";
}) {
  return <TeamMark size={size} team={name} />;
}

export default function ProfileDashboard({
  profile,
  options,
  stats,
  predictions,
  query,
}: ProfileDashboardProps) {
  const [activeTab, setActiveTab] = useState<"summary" | "history" | "favorites">(
    query.favorites === "1" || query.error === "favorite" ? "favorites" : "summary"
  );
  const [editing, setEditing] = useState(false);
  const displayName = profile.displayName || profile.username;
  const heroColor = profile.favoriteTeamColor || profile.accentColor;
  const accuracy = stats.evaluatedPicks
    ? Math.round((stats.exactPicks / stats.evaluatedPicks) * 100)
    : 0;
  const selectedAvatar = avatarOptions.find(
    (option) => option.value === profile.avatar || option.legacyValue === profile.avatar
  );
  const selectedAvatarTeam = profile.avatar.startsWith("team:")
    ? options.teams.find((team) => `team:${team.id}` === profile.avatar)
    : undefined;
  const selectedAvatarTeamLogo = teamLogos.find(
    (team) => `team-logo:${team.slug}` === profile.avatar
  );
  const selectedAvatarTeamName =
    selectedAvatarTeamLogo?.name ?? selectedAvatarTeam?.name;
  const legacyAvatarTeamSlug = selectedAvatarTeam
    ? findTeamLogo(selectedAvatarTeam.name)?.slug
    : undefined;

  const kpis = [
    { label: "Pronósticos enviados", value: stats.predictions, icon: "flag" as const },
    { label: "Carreras con resultado", value: stats.completed, icon: "calendar" as const },
    { label: "Podios perfectos", value: stats.perfect, icon: "trophy" as const },
    { label: "Puntos de pronóstico", value: stats.points, icon: "medal" as const },
  ];

  return (
    <main className="min-h-screen bg-[#090a0e] px-4 py-6 text-slate-100 sm:px-8 sm:py-9">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <Link
            className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-300 transition hover:text-white"
            href="/"
          >
            <span aria-hidden="true">←</span>
            F1 Stats
          </Link>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            Área de piloto
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Mi perfil
          </h1>
        </div>

        {(query.updated === "1" || query.favorites === "1") && (
          <p
            className="mb-4 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200"
            role="status"
          >
            {query.favorites === "1"
              ? "Tus preferencias se guardaron correctamente."
              : "Tu perfil se actualizó correctamente."}
          </p>
        )}
        {query.error && (
          <p
            className="mb-4 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200"
            role="alert"
          >
            {query.error === "favorite"
              ? "No se pudo guardar una de las preferencias. Revisá las opciones e intentá de nuevo."
              : query.error === "length"
                ? "El nombre o la biografía superan el límite permitido."
                : "No se pudo actualizar el perfil. Revisá los datos e intentá de nuevo."}
          </p>
        )}

        <section
          aria-label="Resumen del perfil"
          className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#111217] p-5 shadow-2xl shadow-black/20 sm:p-6"
          style={{
            borderTopColor: heroColor,
            borderTopWidth: 3,
            boxShadow: `0 18px 55px -36px ${heroColor}99`,
          }}
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-20 -top-32 h-72 w-72 rounded-full opacity-[0.09] blur-3xl"
            style={{ backgroundColor: heroColor }}
          />
          <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4 sm:gap-6">
              <button
                aria-label="Editar avatar y perfil"
                className="group relative grid h-20 w-20 shrink-0 place-items-center rounded-full border border-white/15 bg-white/5 text-3xl text-white transition hover:border-white/40 sm:h-24 sm:w-24"
                onClick={() => setEditing(true)}
                style={{ boxShadow: `0 0 30px -14px ${heroColor}` }}
                type="button"
              >
                {selectedAvatarTeamName ? (
                  <TeamAvatar name={selectedAvatarTeamName} size="lg" />
                ) : (
                  <Icon
                    className="h-10 w-10 text-slate-100"
                    name={selectedAvatar?.icon ?? "user"}
                  />
                )}
                <span className="absolute inset-0 grid place-items-center rounded-full bg-black/55 opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
                  <Icon className="h-6 w-6" name="camera" />
                </span>
              </button>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Perfil de piloto
                </p>
                <h2 className="mt-1 truncate text-2xl font-bold sm:text-3xl">
                  {displayName}
                </h2>
                <p className="mt-1 text-sm text-slate-300">@{profile.username}</p>
                <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">
                  {profile.bio || "Todavía no agregaste una presentación."}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center md:justify-end">
              <div className="flex gap-2">
                <button
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/15 px-4 text-sm font-semibold text-white transition hover:bg-white/10"
                  onClick={() => setEditing(true)}
                  type="button"
                >
                  <Icon className="h-4 w-4" name="pencil" />
                  Editar perfil
                </button>
                <form action="/api/auth/logout" method="post">
                  <button
                    className="min-h-11 rounded-xl bg-white px-4 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
                    type="submit"
                  >
                    Cerrar sesión
                  </button>
                </form>
              </div>
            </div>
          </div>
          {profile.favoriteTeam && (
            <div className="relative mt-6 flex items-center gap-2 border-t border-white/10 pt-4 text-sm text-slate-300">
              <span
                aria-hidden="true"
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: profile.favoriteTeamColor || heroColor }}
              />
              Escudería favorita
              <span className="font-semibold text-white">
                {profile.favoriteTeam.name}
              </span>
            </div>
          )}
        </section>

        <section
          aria-label="Estadísticas del perfil"
          className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4"
        >
          {kpis.map((kpi) => (
            <article
              className="rounded-2xl border border-white/10 bg-[#111217] p-4 sm:p-5"
              key={kpi.label}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-slate-200">
                <Icon className="h-5 w-5" name={kpi.icon} />
              </div>
              <p className="mt-4 font-mono text-3xl font-bold tabular-nums text-white sm:text-4xl">
                {kpi.value}
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-300 sm:text-sm">
                {kpi.label}
              </p>
            </article>
          ))}
        </section>

        <div className="mt-8 border-b border-white/10">
          <div
            aria-label="Secciones del perfil"
            className="flex flex-wrap gap-x-5 gap-y-2"
            role="tablist"
          >
            {[
              { id: "summary", label: "Resumen de temporada" },
              { id: "history", label: "Historial de pronósticos" },
              { id: "favorites", label: "Favoritos" },
            ].map((tab) => (
              <button
                aria-controls={`profile-panel-${tab.id}`}
                aria-selected={activeTab === tab.id}
                className={`-mb-px shrink-0 border-b-2 px-1 pb-3 text-sm font-semibold transition ${
                  activeTab === tab.id
                    ? "border-red-500 text-white"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
                id={`profile-tab-${tab.id}`}
                key={tab.id}
                onClick={() =>
                  setActiveTab(tab.id as "summary" | "history" | "favorites")
                }
                role="tab"
                type="button"
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <section
          aria-labelledby={`profile-tab-${activeTab}`}
          className="pt-6"
          id={`profile-panel-${activeTab}`}
          role="tabpanel"
          tabIndex={0}
        >
          {activeTab === "summary" && (
            <div>
              <div className="mb-4">
                <h2 className="text-xl font-bold">Tu temporada en pista</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Un repaso de tus pronósticos frente a los resultados oficiales.
                </p>
              </div>
              <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
                <article className="rounded-2xl border border-white/10 bg-[#111217] p-5 sm:p-6">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Precisión de podio
                  </p>
                  <p className="mt-3 font-mono text-4xl font-bold tabular-nums text-white">
                    {stats.evaluatedPicks
                      ? `${accuracy}%`
                      : "—"}
                  </p>
                  <p className="mt-1 text-sm text-slate-300">
                    {stats.exactPicks} puestos acertados de {stats.evaluatedPicks} evaluados
                  </p>
                  <div
                    aria-label={`${accuracy}% de acierto en puestos de podio`}
                    className="mt-5 h-2 overflow-hidden rounded-full bg-white/10"
                    role="progressbar"
                    aria-valuemax={100}
                    aria-valuemin={0}
                    aria-valuenow={accuracy}
                  >
                    <div
                      className="h-full rounded-full bg-red-500 transition-[width]"
                      style={{ width: `${accuracy}%` }}
                    />
                  </div>
                  <div className="mt-6 grid grid-cols-2 gap-3 border-t border-white/10 pt-4">
                    <div>
                      <p className="font-mono text-2xl font-bold text-white">{stats.perfect}</p>
                      <p className="text-xs text-slate-400">Podios perfectos</p>
                    </div>
                    <div>
                      <p className="font-mono text-2xl font-bold text-white">{stats.points}</p>
                      <p className="text-xs text-slate-400">Puntos sumados</p>
                    </div>
                  </div>
                </article>
                <article className="rounded-2xl border border-white/10 bg-[#111217] p-5 sm:p-6">
                  <div className="flex flex-wrap items-end justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Últimos Grandes Premios
                      </p>
                      <h3 className="mt-1 text-lg font-bold text-white">
                        {predictions.some((prediction) => prediction.hasResult)
                          ? "Tu ritmo reciente"
                          : "Todavía no hay resultados"}
                      </h3>
                    </div>
                    <button
                      className="text-sm font-semibold text-slate-300 transition hover:text-white"
                      onClick={() => setActiveTab("history")}
                      type="button"
                    >
                      Ver historial →
                    </button>
                  </div>
                  {predictions.filter((prediction) => prediction.hasResult).length ? (
                    <div className="mt-4 divide-y divide-white/[0.07]">
                      {predictions
                        .filter((prediction) => prediction.hasResult)
                        .slice(0, 4)
                        .map((prediction) => (
                          <div
                            className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                            key={prediction.id}
                          >
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-white">
                                {prediction.race}
                              </p>
                              <p className="mt-1 text-xs text-slate-400">
                                {prediction.exactPositions}/3 puestos acertados
                              </p>
                            </div>
                            <span className="shrink-0 rounded-lg bg-white/5 px-3 py-2 font-mono text-sm font-bold tabular-nums text-white">
                              +{prediction.points} pts
                            </span>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="mt-4 text-sm leading-6 text-slate-300">
                      Cuando se publiquen resultados de tus pronósticos, vas a ver acá
                      cómo te fue en cada fecha.
                    </p>
                  )}
                </article>
              </div>
              <div className="mt-6 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/10 bg-[#111217] px-5 py-4 text-sm">
                <span className="text-slate-300">Miembro desde {profile.createdAt}</span>
                <span className="font-mono tabular-nums text-slate-300">
                  {stats.preferences}/3 favoritos configurados
                </span>
              </div>
            </div>
          )}

          {activeTab === "history" && (
            <div>
              <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold">Historial de pronósticos</h2>
                  <p className="mt-1 text-sm text-slate-400">
                    Compará el podio que elegiste con el resultado real.
                  </p>
                </div>
                <p className="font-mono text-sm tabular-nums text-slate-300">
                  {stats.points} puntos acumulados
                </p>
              </div>
              {predictions.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-[#111217] px-5 py-12 text-center">
                  <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-white/5 text-slate-300">
                    <Icon className="h-6 w-6" name="flag" />
                  </div>
                  <h3 className="mt-4 font-semibold">Todavía no hay pronósticos</h3>
                  <p className="mt-1 text-sm text-slate-400">
                    Cuando envíes uno, vas a poder seguirlo desde acá.
                  </p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#111217]">
                  <div className="hidden grid-cols-[1.1fr_1fr_1fr_auto] gap-4 border-b border-white/10 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-400 lg:grid">
                    <span>Gran Premio</span>
                    <span>Tu podio</span>
                    <span>Resultado real</span>
                    <span className="text-right">Puntos</span>
                  </div>
                  <div className="divide-y divide-white/[0.07]">
                    {predictions.map((prediction) => (
                      <article
                        className="grid gap-4 px-4 py-5 sm:px-5 lg:grid-cols-[1.1fr_1fr_1fr_auto] lg:items-center"
                        key={prediction.id}
                      >
                        <div>
                          <p className="font-semibold text-white">{prediction.race}</p>
                          <p className="mt-1 text-xs text-slate-400">
                            R{prediction.round} · {prediction.season} · {prediction.raceDate}
                          </p>
                        </div>
                        <div>
                          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400 lg:hidden">
                            Tu podio
                          </p>
                          <Podium names={prediction.predictedPodium} />
                        </div>
                        <div>
                          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400 lg:hidden">
                            Resultado real
                          </p>
                          {prediction.hasResult ? (
                            <Podium names={prediction.actualPodium} />
                          ) : (
                            <p className="text-sm text-slate-400">Aún sin resultado</p>
                          )}
                        </div>
                        <div className="flex items-center justify-between lg:justify-end">
                          <span className="text-xs text-slate-400 lg:hidden">Puntos</span>
                          <span className="rounded-lg bg-white/5 px-3 py-2 font-mono text-sm font-bold tabular-nums text-white">
                            {prediction.hasResult ? `+${prediction.points}` : "—"}
                            {prediction.perfect && (
                              <span
                                aria-label="Podio perfecto"
                                className="ml-1 inline-flex text-amber-200"
                                title="Podio perfecto"
                              >
                                <Icon className="h-4 w-4" name="trophy" />
                              </span>
                            )}
                          </span>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "favorites" && (
            <div>
              <div className="mb-4">
                <h2 className="text-xl font-bold">Mis favoritos</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Elegí tu piloto, escudería y circuito para personalizar tu paddock.
                </p>
              </div>
              <div className="mb-4 grid gap-3 sm:grid-cols-3">
                <FavoriteCard
                  icon="user"
                  label="Piloto"
                  value={driverName(profile.favoriteDriver)}
                  onClick={() =>
                    document.getElementById("favorite-driver")?.focus()
                  }
                />
                <FavoriteCard
                  icon="heart"
                  label="Escudería"
                  value={profile.favoriteTeam?.name || "Elegí tu escudería"}
                  color={profile.favoriteTeamColor}
                  onClick={() =>
                    document.getElementById("favorite-team")?.focus()
                  }
                />
                <FavoriteCard
                  icon="flag"
                  label="Circuito"
                  value={profile.favoriteCircuit?.name || "Elegí tu circuito"}
                  onClick={() =>
                    document.getElementById("favorite-circuit")?.focus()
                  }
                />
              </div>
              <form
                action="/api/user-preferences"
                className="rounded-2xl border border-white/10 bg-[#111217] p-5 sm:p-6"
                method="post"
              >
                <div className="grid gap-4 md:grid-cols-3">
                  <label className="text-sm font-medium text-slate-200">
                    Piloto favorito
                    <select
                      className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-[#090a0e] px-3 text-sm text-white outline-none focus:border-cyan-300/60"
                      defaultValue={profile.favoriteDriver?.id ?? ""}
                      id="favorite-driver"
                      name="favoriteDriverId"
                    >
                      <option value="">Sin seleccionar</option>
                      {options.drivers.map((driver) => (
                        <option key={driver.id} value={driver.id}>
                          {driver.firstName} {driver.lastName}
                          {driver.code ? ` (${driver.code})` : ""}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-sm font-medium text-slate-200">
                    Escudería favorita
                    <select
                      className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-[#090a0e] px-3 text-sm text-white outline-none focus:border-cyan-300/60"
                      defaultValue={profile.favoriteTeam?.id ?? ""}
                      id="favorite-team"
                      name="favoriteTeamId"
                    >
                      <option value="">Sin seleccionar</option>
                      {options.teams.map((team) => (
                        <option key={team.id} value={team.id}>
                          {team.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-sm font-medium text-slate-200">
                    Circuito favorito
                    <select
                      className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-[#090a0e] px-3 text-sm text-white outline-none focus:border-cyan-300/60"
                      defaultValue={profile.favoriteCircuit?.id ?? ""}
                      id="favorite-circuit"
                      name="favoriteCircuitId"
                    >
                      <option value="">Sin seleccionar</option>
                      {options.circuits.map((circuit) => (
                        <option key={circuit.id} value={circuit.id}>
                          {circuit.name}
                          {circuit.country ? ` — ${circuit.country}` : ""}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
                  <p className="text-xs text-slate-400">
                    {stats.preferences}/3 preferencias configuradas
                  </p>
                  <button
                    className="inline-flex min-h-11 items-center justify-center rounded-xl bg-white px-5 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
                    type="submit"
                  >
                    Guardar favoritos
                  </button>
                </div>
              </form>
            </div>
          )}
        </section>

        <p className="mt-8 text-center text-xs text-slate-500">
          Sesión iniciada como {profile.email}
        </p>
      </div>

      {editing && (
        <div
          className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/75 p-4 backdrop-blur-sm"
          onClick={(event) => {
            if (event.target === event.currentTarget) setEditing(false);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") setEditing(false);
          }}
          role="presentation"
        >
          <section
            aria-labelledby="edit-profile-title"
            aria-modal="true"
            className="my-auto w-full max-w-xl rounded-2xl border border-white/10 bg-[#111217] p-5 shadow-2xl sm:p-7"
            role="dialog"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Personalización
                </p>
                <h2 className="mt-1 text-2xl font-bold" id="edit-profile-title">
                  Editar perfil
                </h2>
              </div>
              <button
                aria-label="Cerrar"
                className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white"
                onClick={() => setEditing(false)}
                type="button"
              >
                <span aria-hidden="true" className="text-2xl leading-none">×</span>
              </button>
            </div>

            <form action="/api/profile" className="mt-6 space-y-5" method="post">
              <label className="block text-sm font-medium text-slate-200">
                Nombre visible
                <input
                  className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-[#090a0e] px-3 text-white outline-none focus:border-cyan-300/60"
                  defaultValue={profile.displayName ?? ""}
                  maxLength={32}
                  name="displayName"
                  placeholder={profile.username}
                />
              </label>
              <label className="block text-sm font-medium text-slate-200">
                Presentación
                <textarea
                  className="mt-2 min-h-24 w-full resize-y rounded-xl border border-white/10 bg-[#090a0e] px-3 py-2 text-white outline-none focus:border-cyan-300/60"
                  defaultValue={profile.bio ?? ""}
                  maxLength={160}
                  name="bio"
                  placeholder="Contá algo sobre vos..."
                  rows={3}
                />
                <span className="mt-1 block text-xs text-slate-400">
                  Hasta 160 caracteres.
                </span>
              </label>

              <fieldset>
                <legend className="text-sm font-medium text-slate-200">
                  Icono de perfil
                </legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  {avatarOptions.map((option) => (
                    <label className="cursor-pointer" key={option.value}>
                      <input
                        className="peer sr-only"
                        defaultChecked={
                          profile.avatar === option.value ||
                          profile.avatar === option.legacyValue
                        }
                        name="profileAvatar"
                        type="radio"
                        value={option.value}
                      />
                      <span className="grid h-12 w-12 place-items-center rounded-xl border border-white/10 bg-[#090a0e] text-slate-300 transition peer-checked:border-cyan-300/60 peer-checked:bg-cyan-300/10 peer-checked:text-cyan-100 peer-focus-visible:ring-2 peer-focus-visible:ring-cyan-300">
                        <Icon className="h-6 w-6" name={option.icon} />
                      </span>
                      <span className="sr-only">{option.label}</span>
                    </label>
                  ))}
                  {teamLogos.map((team) => {
                    const value = `team-logo:${team.slug}`;
                    return (
                      <label className="group cursor-pointer" key={team.slug}>
                        <input
                          className="peer sr-only"
                          defaultChecked={
                            profile.avatar === value ||
                            legacyAvatarTeamSlug === team.slug
                          }
                          name="profileAvatar"
                          type="radio"
                          value={value}
                        />
                        <span className="grid min-h-12 min-w-12 place-items-center rounded-xl border border-white/10 bg-[#090a0e] px-1 transition peer-checked:border-cyan-300/60 peer-checked:bg-cyan-300/10 peer-focus-visible:ring-2 peer-focus-visible:ring-cyan-300">
                          <TeamAvatar name={team.name} />
                        </span>
                        <span className="sr-only">{team.name}</span>
                      </label>
                    );
                  })}
                  {selectedAvatarTeam && !legacyAvatarTeamSlug && (
                    <label className="group cursor-pointer">
                      <input
                        className="peer sr-only"
                        defaultChecked
                        name="profileAvatar"
                        type="radio"
                        value={`team:${selectedAvatarTeam.id}`}
                      />
                      <span className="grid min-h-12 min-w-12 place-items-center rounded-xl border border-white/10 bg-[#090a0e] px-1 transition peer-checked:border-cyan-300/60 peer-checked:bg-cyan-300/10 peer-focus-visible:ring-2 peer-focus-visible:ring-cyan-300">
                        <TeamAvatar name={selectedAvatarTeam.name} />
                      </span>
                      <span className="sr-only">
                        {selectedAvatarTeam.name}
                      </span>
                    </label>
                  )}
                </div>
              </fieldset>

              <fieldset>
                <legend className="text-sm font-medium text-slate-200">
                  Color de perfil
                </legend>
                <div className="mt-2 flex gap-3">
                  {accentOptions.map((option) => (
                    <label className="cursor-pointer" key={option.value}>
                      <input
                        className="peer sr-only"
                        defaultChecked={profile.accent === option.value}
                        name="profileAccent"
                        type="radio"
                        value={option.value}
                      />
                      <span
                        aria-label={option.label}
                        className="block h-8 w-8 rounded-full ring-offset-2 ring-offset-[#111217] transition peer-checked:ring-2 peer-checked:ring-white peer-focus-visible:ring-2"
                        style={{ backgroundColor: option.color }}
                      />
                    </label>
                  ))}
                </div>
              </fieldset>

              <div className="flex justify-end gap-2 border-t border-white/10 pt-4">
                <button
                  className="min-h-11 rounded-xl px-4 text-sm font-semibold text-slate-300 hover:bg-white/5"
                  onClick={() => setEditing(false)}
                  type="button"
                >
                  Cancelar
                </button>
                <button
                  className="min-h-11 rounded-xl bg-white px-5 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
                  type="submit"
                >
                  Guardar cambios
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}

function Podium({ names }: { names: string[] }) {
  return (
    <ol className="space-y-1">
      {[0, 1, 2].map((position) => (
        <li
          className="flex items-center gap-2 text-sm text-slate-200"
          key={position}
        >
          <span className="w-4 font-mono text-xs tabular-nums text-slate-500">
            {position + 1}
          </span>
          <span className="truncate">{names[position] || "—"}</span>
        </li>
      ))}
    </ol>
  );
}

function FavoriteCard({
  icon,
  label,
  value,
  color,
  onClick,
}: {
  icon: IconName;
  label: string;
  value: string;
  color?: string;
  onClick: () => void;
}) {
  return (
    <button
      className="flex min-w-0 items-center gap-3 rounded-2xl border border-white/10 bg-[#111217] p-4 text-left transition hover:border-white/20 hover:bg-white/[0.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300"
      onClick={onClick}
      type="button"
    >
      <div
        className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/5 text-slate-200"
        style={color ? { color } : undefined}
      >
        <Icon className="h-5 w-5" name={icon} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-400">{label}</p>
        <p className="truncate text-sm font-semibold text-white">{value}</p>
      </div>
    </button>
  );
}
