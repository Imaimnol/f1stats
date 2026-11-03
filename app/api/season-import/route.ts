import { connection, NextResponse } from "next/server";
import {
  importSeason,
  importSeasonsFromYear,
} from "@/lib/services/f1-import";

export async function GET(request: Request) {
  await connection();

  const yearParam = new URL(request.url).searchParams.get("year");
  const startYear = yearParam ? Number(yearParam) : 2023;

  if (!Number.isInteger(startYear) || startYear < 2023) {
    return NextResponse.json(
      {
        success: false,
        message: "Debe indicar un año válido desde 2023",
      },
      { status: 400 }
    );
  }

  try {
    const result =
      yearParam && /^\d{4}$/.test(yearParam)
        ? await importSeason(startYear)
        : await importSeasonsFromYear(startYear);

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error("Error importando temporadas desde OpenF1:", error);

    return NextResponse.json(
      {
        success: false,
        message: "No se pudo importar la información de OpenF1",
        error:
          error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 502 }
    );
  }
}

export async function POST(request: Request) {
  return GET(request);
}
