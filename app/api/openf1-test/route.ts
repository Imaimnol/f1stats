import { NextResponse } from "next/server";
import { connection } from "next/server";
import { getOpenF1 } from "@/lib/openf1";

export async function GET() {
  await connection();

  try {
    const meetings = await getOpenF1<
      Array<{
        meeting_key: number;
        meeting_name: string;
        year: number;
        location: string;
        country_name: string;
        circuit_short_name: string;
        date_start: string;
      }>
    >("meetings", { year: "2026" });

    return NextResponse.json({
      success: true,
      count: meetings.length,
      meetings,
    });
  } catch (error) {
    console.error("Error consultando OpenF1:", error);

    return NextResponse.json(
      {
        success: false,
        message: "No se pudo consultar OpenF1",
        error:
          error instanceof Error
            ? error.message
            : "Error desconocido",
      },
      { status: 502 }
    );
  }
}