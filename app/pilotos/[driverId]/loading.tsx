export default function DriverLoading() {
  return (
    <main
      aria-label="Cargando perfil del piloto"
      className="min-h-screen bg-slate-950 px-5 py-10 text-white sm:px-8 sm:py-14"
    >
      <div className="mx-auto max-w-5xl animate-pulse">
        <div className="mb-10 border-b border-white/10 pb-8">
          <div className="h-4 w-36 rounded bg-white/10" />
          <div className="mt-8 h-12 w-3/4 max-w-lg rounded bg-white/10" />
          <div className="mt-4 h-5 w-48 rounded bg-white/10" />
        </div>
        <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div
              key={index}
              className="h-24 rounded-2xl border border-white/10 bg-white/[0.04]"
            />
          ))}
        </div>
        <div className="h-80 rounded-2xl border border-white/10 bg-white/[0.04]" />
      </div>
    </main>
  );
}
