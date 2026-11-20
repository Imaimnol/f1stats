import Image from "next/image";
import Link from "next/link";

import { champions } from "@/app/campeones/champions";

export default function ChampionsPage() {
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
            Campeones del mundo
          </h1>
          <p className="mt-3 max-w-xl text-base leading-7 text-slate-300">
            Una galería de los campeones de Fórmula 1, con fotos de licencia
            abierta y sus créditos.
          </p>
        </header>

        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {champions.map((champion, index) => (
            <li
              className="overflow-hidden rounded-2xl border border-white/10 bg-[#111217]"
              key={champion.name}
            >
              <div className="relative aspect-[16/10] bg-slate-900">
                <Image
                  alt={champion.name}
                  className="object-cover"
                  fill
                  loading={index < 3 ? "eager" : "lazy"}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  src={champion.image}
                  unoptimized
                />
              </div>
              <div className="border-t border-white/[0.06] px-5 py-4">
                <h2 className="text-lg font-bold text-white">{champion.name}</h2>
                <p className="mt-1 text-xs leading-5 text-slate-400">
                  Foto: {champion.artist} · {champion.license} ·{" "}
                  <a
                    className="underline decoration-white/30 underline-offset-2 transition-colors hover:text-white"
                    href={champion.source}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Wikimedia Commons
                  </a>
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
