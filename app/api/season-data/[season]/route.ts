import { connection, NextResponse } from "next/server";
import { importSeason } from "@/lib/services/f1-import";
import { getSeasonStandings } from "@/lib/services/standings";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ season: string }> }
) {
  await connection();

  const { season: seasonParam } = await params;
  const season = Number(seasonParam);

  if (
    !Number.isInteger(season) ||
    season < 2023 ||
    season > new Date().getFullYear()
  ) {
    return NextResponse.json(
      { success: false, message: "La temporada debe ser un año válido desde 2023" },
      { status: 400 }
    );
  }

  let standings = await getSeasonStandings(season);
  if (standings.races === 0) {
    try {
      await importSeason(season);
      standings = await getSeasonStandings(season);
    } catch (error) {
      console.error("Error importando la temporada desde OpenF1:", error);
      return NextResponse.json(
        {
          success: false,
          message: "No se pudieron cargar los resultados de la temporada",
          error:
            error instanceof Error ? error.message : "Error desconocido",
        },
        { status: 502 }
      );
    }
  }

  return NextResponse.json(standings);
}
