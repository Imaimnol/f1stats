import Link from "next/link";

export default function SeasonSelector({
  seasons,
  season,
  championship,
}: {
  seasons: number[];
  season: number;
  championship: "drivers" | "constructors";
}) {
  const route = championship === "drivers" ? "/estadisticas" : "/constructores";

  return (
    <nav aria-label="Elegir temporada" className="flex flex-wrap gap-2">
      {seasons.map((availableSeason) => {
        const selected = availableSeason === season;

        return (
          <Link
            aria-current={selected ? "page" : undefined}
            className={`rounded-xl border px-4 py-2.5 text-sm font-bold tabular-nums transition ${
              selected
                ? "border-red-500 bg-red-500 text-white shadow-lg shadow-red-950/30"
                : "border-white/10 bg-white/[0.03] text-slate-400 hover:border-white/20 hover:bg-white/[0.07] hover:text-white"
            }`}
            href={`${route}?year=${availableSeason}`}
            key={availableSeason}
          >
            {availableSeason}
          </Link>
        );
      })}
    </nav>
  );
}
