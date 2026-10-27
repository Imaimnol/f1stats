import { connection, NextResponse } from "next/server";
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

  const race = await getRaceResults(season, round);

  if (!race) {
    return NextResponse.json(
      { success: false, message: "No se encontró la carrera solicitada" },
      { status: 404 }
    );
  }

  return NextResponse.json(race);
}
