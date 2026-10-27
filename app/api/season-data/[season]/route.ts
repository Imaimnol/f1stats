import { connection, NextResponse } from "next/server";
import { getSeasonStandings } from "@/lib/services/standings";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ season: string }> }
) {
  await connection();

  const { season: seasonParam } = await params;
  const season = Number(seasonParam);

  if (!Number.isInteger(season) || season < 2023) {
    return NextResponse.json(
      { success: false, message: "La temporada debe ser un año válido desde 2023" },
      { status: 400 }
    );
  }

  const standings = await getSeasonStandings(season);

  return NextResponse.json(standings);
}
