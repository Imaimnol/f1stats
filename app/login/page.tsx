import Link from "next/link";

import LoginForm from "./login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#090a0e] px-4 py-8 text-white sm:px-8">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#111217] p-6 shadow-2xl shadow-red-950/20 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-red-300">
          F1 Stats
        </p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight">Iniciá sesión</h1>
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
