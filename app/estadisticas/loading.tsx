export default function StatisticsLoading() {
  return (
    <main
      aria-label="Cargando campeonatos"
      className="min-h-screen bg-slate-950 px-5 py-10 text-white sm:px-8 sm:py-14"
    >
      <div className="mx-auto max-w-5xl animate-pulse">
        <div className="mb-10 border-b border-white/10 pb-8 sm:mb-12 sm:pb-10">
          <div className="h-4 w-32 rounded bg-white/10" />
          <div className="mt-6 h-10 w-3/4 max-w-lg rounded bg-white/10" />
          <div className="mt-4 h-5 w-full max-w-xl rounded bg-white/10" />
        </div>
        <div className="space-y-6">
          {Array.from({ length: 2 }, (_, sectionIndex) => (
            <section
              key={sectionIndex}
              className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]"
            >
              <div className="border-b border-white/10 px-5 py-4">
                <div className="h-5 w-32 rounded bg-white/10" />
              </div>
              <div className="space-y-4 px-5 py-5">
                {Array.from({ length: 4 }, (_, rowIndex) => (
                  <div
                    key={rowIndex}
                    className="h-8 rounded bg-white/[0.06]"
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
