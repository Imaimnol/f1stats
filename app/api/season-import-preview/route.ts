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

  try {
    const calendar = await getSeasonRaceCalendar(Number(yearParam));

    return NextResponse.json({
      success: true,
      ...calendar,
    });
  } catch (error) {
    console.error("Error consultando el calendario de OpenF1:", error);

    return NextResponse.json(
      {
        success: false,
        message: "No se pudo consultar el calendario de OpenF1",
        error:
          error instanceof Error
            ? error.message
            : "Error desconocido",
      },
      { status: 502 }
    );
  }
}
