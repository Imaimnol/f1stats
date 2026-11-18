import Link from "next/link";
import { connection } from "next/server";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function FavoritesPage() {
  await connection();
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const favorites = await prisma.favoriteDriver.findMany({
    where: { userId: user.id },
    select: {
      driver: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          code: true,
          nationality: true,
          permanentNumber: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <main className="min-h-screen bg-[#090a0e] px-4 py-6 text-white sm:px-8 sm:py-9">
      <div className="mx-auto max-w-6xl">
        <header className="mb-10 border-b border-white/10 pb-8">
          <Link
            href="/"
            className="text-sm font-semibold text-red-300 transition-colors hover:text-red-200"
          >
            ← Volver al calendario
          </Link>
          <p className="mb-3 mt-6 text-sm font-semibold uppercase tracking-[0.24em] text-red-400">
            F1 Stats
          </p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Mis pilotos favoritos
          </h1>
          <p className="mt-3 text-slate-300">
            Hola, {user.username}. Acá tenés los pilotos que guardaste.
          </p>
        </header>

        {favorites.length === 0 ? (
          <section className="rounded-2xl border border-white/10 bg-[#111217] px-6 py-12 text-center">
            <h2 className="text-xl font-semibold">
              Todavía no agregaste pilotos
            </h2>
            <p className="mx-auto mt-2 max-w-lg leading-7 text-slate-300">
              Visitá el perfil de un piloto y usá “Agregar a favoritos” para
              guardarlo acá.
            </p>
            <Link
              href="/estadisticas"
              className="mt-6 inline-flex rounded-full bg-red-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-400"
            >
              Explorar pilotos
            </Link>
          </section>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {favorites.map(({ driver }) => (
              <li
                className="rounded-2xl border border-white/10 bg-[#111217] p-5"
                key={driver.id}
              >
                <Link
                  className="block transition-colors hover:text-red-200"
                  href={`/pilotos/${driver.id}`}
                >
                  <h2 className="text-lg font-semibold">
                    {driver.firstName} {driver.lastName}
                  </h2>
                  <p className="mt-1 text-sm text-slate-300">
                    {[driver.code, driver.nationality]
                      .filter(Boolean)
                      .join(" · ") || "Datos de piloto"}
                    {driver.permanentNumber !== null &&
                      ` · #${driver.permanentNumber}`}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
