export default function ConstructorsLoading() {
  return (
    <main
      aria-label="Cargando campeonato de constructores"
      className="min-h-screen bg-[#0B0E14] px-4 py-8 text-white sm:px-8 sm:py-12"
    >
      <div className="mx-auto max-w-6xl animate-pulse">
        <div className="mb-8 border-b border-white/10 pb-8">
          <div className="h-4 w-24 rounded bg-white/10" />
          <div className="mt-6 h-10 w-72 rounded bg-white/10" />
          <div className="mt-4 h-5 w-48 rounded bg-white/10" />
        </div>
        <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#11131b]">
          <div className="border-b border-white/10 px-5 py-4">
            <div className="h-4 w-64 rounded bg-white/10" />
          </div>
          <div className="space-y-4 px-5 py-5">
            {Array.from({ length: 5 }, (_, index) => (
              <div className="h-9 rounded bg-white/[0.06]" key={index} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
