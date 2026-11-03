"use client";

import { useState } from "react";

export default function FavoriteButton({
  driverId,
  initialFavorite,
}: {
  driverId: string;
  initialFavorite: boolean;
}) {
  const [isFavorite, setIsFavorite] = useState(initialFavorite);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggleFavorite() {
    setIsPending(true);
    setError(null);

    try {
      const response = await fetch("/api/user-preferences", {
        method: isFavorite ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ driverId }),
      });
      const result: { error?: string; favorite?: boolean } =
        await response.json();

      if (!response.ok || typeof result.favorite !== "boolean") {
        throw new Error(result.error ?? "No se pudo actualizar el favorito.");
      }

      setIsFavorite(result.favorite);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "No se pudo actualizar el favorito."
      );
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div>
      <button
        aria-pressed={isFavorite}
        className="rounded-full border border-red-400/40 bg-red-400/10 px-4 py-2 text-sm font-semibold text-red-200 transition-colors hover:bg-red-400/20 disabled:cursor-wait disabled:opacity-60"
        disabled={isPending}
        onClick={toggleFavorite}
        type="button"
      >
        {isPending
          ? "Guardando..."
          : isFavorite
            ? "Quitar de favoritos"
            : "Agregar a favoritos"}
      </button>
      {error && (
        <p className="mt-2 text-sm text-red-300" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
