import { NextResponse } from "next/server";
import { importRaceBySessionKey } from "@/lib/services/f1-import";

export async function GET() {
  try {
    const result = await importRaceBySessionKey(9141);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error importando carrera:", error);

    return NextResponse.json(
      {
        success: false,
        message: "No se pudo importar la carrera",
        error:
          error instanceof Error
            ? error.message
            : "Error desconocido",
      },
      { status: 500 }
    );
  }
}