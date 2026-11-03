import { connection, NextResponse } from "next/server";
import { importSeason } from "@/lib/services/f1-import";
import { getRaceResults } from "@/lib/services/race-results";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ season: string; round: string }> }
) {
  await connection();

  const { season: seasonParam, round: roundParam } = await params;
  const season = Number(seasonParam);
  const round = Number(roundParam);

  if (!Number.isInteger(season) || season < 2023 || !Number.isInteger(round)) {
    return NextResponse.json(
      { success: false, message: "La temporada y la ronda deben ser válidas" },
      { status: 400 }
    );
  }

  let race = await getRaceResults(season, round).catch(() => null);

  if (!race) {
    try {
      await importSeason(season);
      race = await getRaceResults(season, round);
    } catch (error) {
      console.error("Error importando la temporada desde OpenF1:", error);
      return NextResponse.json(
        {
          success: false,
          message: "No se pudo importar la temporada solicitada",
          error:
            error instanceof Error ? error.message : "Error desconocido",
        },
        { status: 502 }
      );
    }
  }

  if (!race) {
    return NextResponse.json(
      { success: false, message: "No se encontró la carrera solicitada" },
      { status: 404 }
    );
  }

  return NextResponse.json(race);
}
