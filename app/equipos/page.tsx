import Link from "next/link";

import TeamCar from "@/app/team-car";

const teams = [
  { name: "Alpine", color: "#0093cc" },
  { name: "Aston Martin", color: "#00665e" },
  { name: "Audi", color: "#d5001c" },
  { name: "Cadillac", color: "#c5a85c" },
  { name: "Ferrari", color: "#e8002d" },
  { name: "Haas", color: "#d6001c" },
  { name: "McLaren", color: "#ff8000" },
  { name: "Mercedes", color: "#00d7b3" },
  { name: "Racing Bulls", color: "#6692ff" },
  { name: "Red Bull", color: "#3671c6" },
  { name: "Williams", color: "#1868db" },
];

export default function TeamsPage() {
  return (
    <main className="min-h-screen bg-[#090a0e] px-4 py-6 text-white sm:px-8 sm:py-9">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 border-b border-white/10 pb-8">
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
            Equipos
          </h1>
          <p className="mt-3 max-w-xl text-base leading-7 text-slate-300">
            Los autos de la parrilla, representados con ilustraciones originales
            y sin sponsors.
          </p>
        </header>

        <nav aria-label="Secciones relacionadas" className="mb-6 flex flex-wrap gap-3">
          <Link
            className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-slate-200 transition-colors hover:border-red-400/40 hover:text-white"
            href="/corredores"
          >
            Corredores
          </Link>
          <Link
            className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-slate-200 transition-colors hover:border-red-400/40 hover:text-white"
            href="/constructores"
          >
            Campeonato de constructores
          </Link>
        </nav>

        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <li
              className="overflow-hidden rounded-2xl border bg-[#111217] transition-transform duration-200 hover:-translate-y-1"
              key={team.name}
              style={{ borderColor: `${team.color}70` }}
            >
              <div
                className="flex aspect-[16/9] items-center justify-center bg-gradient-to-br from-white/[0.04] to-transparent p-3"
                style={{ backgroundColor: `${team.color}12` }}
              >
                <TeamCar color={team.color} name={team.name} />
              </div>
              <h2
                className="border-t border-white/[0.06] px-5 py-4 text-lg font-bold"
                style={{ color: team.color }}
              >
                {team.name}
              </h2>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
