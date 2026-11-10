import Link from "next/link";

import LoginForm from "./login-form";

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

        <LoginForm />

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
