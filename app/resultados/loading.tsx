export default function RaceResultsLoading() {
  return (
    <main
      aria-label="Cargando resultados de carrera"
      className="min-h-screen bg-slate-950 px-5 py-10 text-white sm:px-8 sm:py-14"
    >
      <div className="mx-auto max-w-5xl animate-pulse">
        <div className="mb-10 border-b border-white/10 pb-8 sm:mb-12 sm:pb-10">
          <div className="h-4 w-40 rounded bg-white/10" />
          <div className="mt-8 h-10 w-3/4 max-w-lg rounded bg-white/10" />
          <div className="mt-4 h-5 w-full max-w-xl rounded bg-white/10" />
        </div>
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-5">
          <div className="mb-5 h-6 w-36 rounded bg-white/10" />
          <div className="space-y-4">
            {Array.from({ length: 8 }, (_, index) => (
              <div key={index} className="h-8 rounded bg-white/[0.06]" />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
