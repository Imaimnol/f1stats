import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const recentActivity = [
  "Revisaste el calendario de la temporada actual.",
  "Guardaste tus preferencias de perfil para personalizar la experiencia.",
  "Marcaste el Gran Premio más cercano de tu calendario favorito.",
];

const badgeConfig = [
  { title: "Fan de la temporada", tone: "bg-red-500/15 text-red-100 border-red-400/30" },
  { title: "Analista de datos", tone: "bg-amber-500/15 text-amber-100 border-amber-400/30" },
  { title: "Aficionado de circuitos", tone: "bg-cyan-500/15 text-cyan-100 border-cyan-400/30" },
];

export default async function PerfilPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const [profileUser, drivers, teams, circuits] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        username: true,
        email: true,
        favoriteDriver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            code: true,
          },
        },
        favoriteTeam: {
          select: {
            id: true,
            name: true,
          },
        },
        favoriteCircuit: {
          select: {
            id: true,
            name: true,
            country: true,
          },
        },
      },
    }),
    prisma.driver.findMany({
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      select: {
        id: true,
        firstName: true,
        lastName: true,
        code: true,
      },
    }),
    prisma.team.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
      },
    }),
    prisma.circuit.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        country: true,
      },
    }),
  ]);

  const favoriteDriver = profileUser?.favoriteDriver;
  const favoriteTeam = profileUser?.favoriteTeam;
  const favoriteCircuit = profileUser?.favoriteCircuit;

  const profileHighlights = [
    {
      label: "Piloto favorito",
      value: favoriteDriver
        ? `${favoriteDriver.firstName} ${favoriteDriver.lastName}${favoriteDriver.code ? ` (${favoriteDriver.code})` : ""}`
        : "Sin configurar",
      accent: "text-red-200",
    },
    {
      label: "Equipo favorito",
      value: favoriteTeam ? favoriteTeam.name : "Sin configurar",
      accent: "text-red-200",
    },
    {
      label: "Circuito favorito",
      value: favoriteCircuit ? `${favoriteCircuit.name}${favoriteCircuit.country ? ` · ${favoriteCircuit.country}` : ""}` : "Sin configurar",
      accent: "text-red-200",
    },
    {
      label: "Temporada activa",
      value: String(new Date().getFullYear()),
      accent: "text-red-200",
    },
  ];

  const quickStats = [
    { label: "Pilotos favoritos", value: favoriteDriver ? "1" : "0" },
    { label: "Equipo favorito", value: favoriteTeam ? "1" : "0" },
    { label: "Circuito favorito", value: favoriteCircuit ? "1" : "0" },
    { label: "Perfil listo", value: "100%" },
  ];

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-10 text-white sm:px-8 sm:py-14">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-red-300">
              Perfil
            </p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight text-white">
              Bienvenido, {profileUser?.username}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/"
              className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-slate-200 transition-colors hover:border-red-400/40 hover:text-white"
            >
              Inicio
            </Link>
            <form action="/api/auth/logout" method="post">
              <button
                type="submit"
                className="rounded-full bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-400"
              >
                Cerrar sesión
              </button>
            </form>
          </div>
        </div>

        <section className="mb-8 grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
          <div className="rounded-3xl border border-red-500/20 bg-gradient-to-br from-red-500/10 via-slate-900 to-slate-900 p-6 shadow-[0_0_30px_rgba(239,68,68,0.08)]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                  Cuenta
                </p>
                <h2 className="mt-2 text-2xl font-bold text-white">
                  Resumen del usuario
                </h2>
              </div>
              <div className="flex size-14 items-center justify-center rounded-full border border-red-400/40 bg-red-500/15 text-xl font-bold text-red-100">
                {profileUser?.username.slice(0, 1).toUpperCase()}
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Usuario
                </p>
                <p className="mt-2 text-xl font-semibold text-white">{profileUser?.username}</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Email
                </p>
                <p className="mt-2 truncate text-lg font-semibold text-white">{profileUser?.email}</p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Estado
              </p>
              <p className="mt-3 text-base text-slate-200">
                Tu perfil está personalizando la experiencia F1 en tiempo real.
              </p>
            </div>
          </div>

          <aside className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-red-300">
              Perfil F1
            </p>
            <h2 className="mt-2 text-2xl font-bold text-white">Tu estilo</h2>

            <div className="mt-6 space-y-4">
              {profileHighlights.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3"
                >
                  <span className="text-sm text-slate-300">{item.label}</span>
                  <span className={`text-sm font-semibold ${item.accent}`}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </aside>
        </section>

        <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {quickStats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-white/10 bg-white/[0.04] p-5"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                {stat.label}
              </p>
              <p className="mt-3 text-3xl font-bold text-white">{stat.value}</p>
            </div>
          ))}
        </section>

        <section className="mb-8 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Logros
              </p>
              <h3 className="mt-2 text-2xl font-bold text-white">Insignias del fan</h3>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {badgeConfig.map((badge) => (
              <span
                key={badge.title}
                className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] ${badge.tone}`}
              >
                {badge.title}
              </span>
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Actividad reciente
                </p>
                <h3 className="mt-2 text-2xl font-bold text-white">Tu recorrido</h3>
              </div>
              <Link
                href="/estadisticas"
                className="rounded-full border border-red-400/30 bg-red-500/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-red-100 transition-colors hover:border-red-300 hover:text-red-50"
              >
                Ver rankings
              </Link>
            </div>

            <ul className="mt-6 space-y-4">
              {recentActivity.map((item) => (
                <li
                  key={item}
                  className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-slate-200"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <form
            action="/api/user-preferences"
            className="rounded-3xl border border-white/10 bg-white/[0.04] p-6"
            method="post"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Preferencias
            </p>
            <h3 className="mt-2 text-2xl font-bold text-white">Configura tus favoritos</h3>

            <div className="mt-6 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="favoriteDriverId">
                  Piloto favorito
                </label>
                <select
                  className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-red-400"
                  defaultValue={favoriteDriver?.id ?? ""}
                  id="favoriteDriverId"
                  name="favoriteDriverId"
                >
                  <option value="">Sin configurar</option>
                  {drivers.map((driver) => (
                    <option key={driver.id} value={driver.id}>
                      {driver.firstName} {driver.lastName} {driver.code ? `(${driver.code})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="favoriteTeamId">
                  Equipo favorito
                </label>
                <select
                  className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-red-400"
                  defaultValue={favoriteTeam?.id ?? ""}
                  id="favoriteTeamId"
                  name="favoriteTeamId"
                >
                  <option value="">Sin configurar</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="favoriteCircuitId">
                  Circuito favorito
                </label>
                <select
                  className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-red-400"
                  defaultValue={favoriteCircuit?.id ?? ""}
                  id="favoriteCircuitId"
                  name="favoriteCircuitId"
                >
                  <option value="">Sin configurar</option>
                  {circuits.map((circuit) => (
                    <option key={circuit.id} value={circuit.id}>
                      {circuit.name}{circuit.country ? ` · ${circuit.country}` : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                className="rounded-full bg-red-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-400"
                type="submit"
              >
                Guardar preferencias
              </button>
              <Link
                href="/"
                className="rounded-full border border-white/15 px-4 py-3 text-sm font-semibold text-slate-200 transition-colors hover:border-red-400/40 hover:text-white"
              >
                Volver al inicio
              </Link>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
