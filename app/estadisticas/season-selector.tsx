"use client";

export default function SeasonSelector({
  seasons,
  season,
}: {
  seasons: number[];
  season: number;
}) {
  return (
    <form
      action="/estadisticas"
      className="flex flex-wrap items-end gap-3"
      method="get"
    >
      <div>
        <label
          className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400"
          htmlFor="season"
        >
          Temporada
        </label>
        <select
          className="rounded-full border border-white/15 bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          defaultValue={season}
          id="season"
          name="year"
          onChange={(event) => event.currentTarget.form?.requestSubmit()}
        >
          {seasons.map((availableSeason) => (
            <option key={availableSeason} value={availableSeason}>
              {availableSeason}
            </option>
          ))}
        </select>
      </div>
      <button
        className="rounded-full bg-red-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-400"
        type="submit"
      >
        Ver temporada
      </button>
    </form>
  );
}
