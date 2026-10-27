import { connection, NextResponse } from "next/server";
import { getAvailableSeasons } from "@/lib/services/standings";

const MIN_SEASON = 2023;

export async function GET(request: Request) {
  await connection();

  const currentSeason = Number(
    new URL(request.url).searchParams.get("currentSeason") ??
      new Date().getFullYear()
  );

  const seasons = (await getAvailableSeasons(currentSeason)).filter(
    (season) => season >= MIN_SEASON
  );

  return NextResponse.json({
    seasons,
    minSeason: MIN_SEASON,
    currentSeason,
  });
}
