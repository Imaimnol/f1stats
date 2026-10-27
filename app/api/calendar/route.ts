import { connection, NextResponse } from "next/server";
import { getSeasonRaceCalendar } from "@/lib/services/f1-import";

export async function GET(request: Request) {
  await connection();

  const yearParam = new URL(request.url).searchParams.get("year");
  if (!yearParam || !/^\d{4}$/.test(yearParam)) {
    return NextResponse.json(
      { success: false, message: "Debe indicar un año válido" },
      { status: 400 }
    );
  }

  const year = Number(yearParam);
  const calendar = await getSeasonRaceCalendar(year);

  return NextResponse.json({
    success: true,
    ...calendar,
  });
}
