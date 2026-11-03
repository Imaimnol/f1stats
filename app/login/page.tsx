import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-5 py-12 text-white">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.04] p-8 shadow-2xl shadow-red-950/20">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-red-300">
          F1 Stats
        </p>
        <h1 className="mt-4 text-3xl font-bold">Iniciá sesión</h1>
        <p className="mt-2 text-sm text-slate-300">
          Accedé para guardar tus pilotos favoritos y personalizar tu experiencia.
        </p>

        <form action="/api/auth/login" className="mt-8 space-y-5" method="post">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="email">
              Email
            </label>
            <input
              className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-red-400"
              id="email"
              name="email"
              required
              type="email"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="password">
              Contraseña
            </label>
            <input
              className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-red-400"
              id="password"
              minLength={6}
              name="password"
              required
              type="password"
            />
          </div>

          <button
            className="w-full rounded-full bg-red-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-400"
            type="submit"
          >
            Entrar
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-300">
          ¿Todavía no tenés cuenta?{" "}
          <Link className="font-semibold text-red-300 hover:text-red-200" href="/register">
            Registrate
          </Link>
        </p>
      </div>
    </main>
  );
}
