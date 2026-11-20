"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import { useEffect, useState, useSyncExternalStore } from "react";

const subscribeToMount = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export default function HomeMenu({
  currentUser,
}: {
  currentUser: { username: string } | null;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const portalReady = useSyncExternalStore(
    subscribeToMount,
    getClientSnapshot,
    getServerSnapshot
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  return (
    <>
      <div className="flex shrink-0 items-center gap-3">
        <button
          aria-controls="home-navigation-drawer"
          aria-expanded={isOpen}
          aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
          className="flex shrink-0 items-center gap-3 rounded-xl border border-white/15 bg-[#111217] px-4 py-3 text-sm font-semibold text-white transition-colors hover:border-red-400/50"
          onClick={() => setIsOpen((open) => !open)}
          type="button"
        >
          <span aria-hidden="true" className="flex w-5 flex-col gap-1">
            <span className="h-0.5 w-5 rounded-full bg-current" />
            <span className="h-0.5 w-5 rounded-full bg-current" />
            <span className="h-0.5 w-5 rounded-full bg-current" />
          </span>
          <span className="hidden sm:inline">Menú</span>
        </button>
        <Link
          aria-label={currentUser ? "Mi perfil" : "Iniciar sesión"}
          className="flex size-11 shrink-0 items-center justify-center rounded-full border border-white/15 bg-[#111217] text-slate-200 transition-colors hover:border-red-400/50 hover:text-white"
          href={currentUser ? "/perfil" : "/login"}
          title={currentUser ? "Mi perfil" : "Iniciar sesión"}
        >
          <svg
            aria-hidden="true"
            className="size-5"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
            viewBox="0 0 24 24"
          >
            <circle cx="12" cy="8" r="4" />
            <path d="M5 21a7 7 0 0 1 14 0" />
          </svg>
        </Link>
      </div>

      {portalReady &&
        createPortal(
          <div
            aria-hidden={!isOpen}
            className={`fixed inset-0 z-[100] overflow-hidden ${
              isOpen ? "" : "pointer-events-none"
            }`}
            id="home-navigation-drawer"
            inert={!isOpen}
          >
            <button
              aria-label="Cerrar menú"
              className={`absolute inset-0 size-full bg-black/60 transition-opacity duration-300 ${
                isOpen ? "opacity-100" : "opacity-0"
              }`}
              onClick={() => setIsOpen(false)}
              tabIndex={isOpen ? 0 : -1}
              type="button"
            />
            <aside
              aria-label="Menú de navegación"
              className={`absolute inset-y-0 right-0 flex w-[min(24rem,88vw)] flex-col overflow-y-auto border-l border-white/10 bg-[#111217] p-6 shadow-2xl shadow-black/50 transition-transform duration-300 ease-out ${
                isOpen ? "translate-x-0" : "translate-x-full"
              }`}
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-red-400">
                    F1 Stats
                  </p>
                  <h2 className="mt-1 text-lg font-semibold text-white">
                    Navegación
                  </h2>
                </div>
                <button
                  aria-label="Cerrar menú"
                  className="flex size-10 items-center justify-center rounded-full border border-white/15 text-xl text-slate-200 transition-colors hover:border-red-400/50 hover:text-white"
                  onClick={() => setIsOpen(false)}
                  type="button"
                >
                  ×
                </button>
              </div>

              <nav
                aria-label="Navegación principal"
                className="mt-5 grid gap-2"
              >
                {[
                  { href: "/estadisticas", label: "Temporadas" },
                  { href: "/constructores", label: "Constructores" },
                  { href: "/ranking", label: "Ranking" },
                  { href: "/corredores", label: "Corredores" },
                  { href: "/equipos", label: "Equipos" },
                  { href: "/campeones", label: "Campeones" },
                  { href: "/prediccion", label: "Mi predicción" },
                ].map((item) => (
                  <Link
                    className="rounded-xl px-4 py-3 text-base font-medium text-slate-200 transition-colors hover:bg-white/[0.06] hover:text-white"
                    href={item.href}
                    key={item.href}
                    onClick={() => setIsOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
                {currentUser ? (
                  <>
                    <Link
                      className="rounded-xl px-4 py-3 text-base font-medium text-slate-200 transition-colors hover:bg-white/[0.06] hover:text-white"
                      href="/perfil"
                      onClick={() => setIsOpen(false)}
                    >
                      Mi perfil
                    </Link>
                    <div className="mt-2 flex items-center justify-between gap-3 border-t border-white/10 px-4 pt-5">
                      <span className="min-w-0 truncate text-sm font-semibold text-red-100">
                        Hola, {currentUser.username}
                      </span>
                      <form action="/api/auth/logout" method="post">
                        <button
                          className="rounded-full border border-white/15 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-slate-200 transition-colors hover:border-red-400/40 hover:text-white"
                          type="submit"
                        >
                          Salir
                        </button>
                      </form>
                    </div>
                  </>
                ) : (
                  <div className="mt-2 border-t border-white/10 pt-5">
                    <Link
                      className="block rounded-full bg-red-500 px-3 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-red-400"
                      href="/register"
                      onClick={() => setIsOpen(false)}
                    >
                      Registrarse
                    </Link>
                  </div>
                )}
              </nav>
            </aside>
          </div>,
          document.body
        )}
    </>
  );
}
