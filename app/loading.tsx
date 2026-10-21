export default function Loading() {
  return (
    <main
      aria-label="Cargando calendario"
      className="min-h-screen bg-slate-950 px-5 py-10 text-white sm:px-8 sm:py-14"
    >
      <div className="mx-auto max-w-5xl animate-pulse">
        <div className="mb-10 border-b border-white/10 pb-8 sm:mb-12 sm:pb-10">
          <div className="h-4 w-20 rounded bg-white/10" />
          <div className="mt-6 h-10 w-3/4 max-w-lg rounded bg-white/10" />
          <div className="mt-4 h-5 w-full max-w-xl rounded bg-white/10" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 6 }, (_, index) => (
            <div
              key={index}
              className="h-36 rounded-2xl border border-white/10 bg-white/[0.04]"
            />
          ))}
        </div>
      </div>
    </main>
  );
}
