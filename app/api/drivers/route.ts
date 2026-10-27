import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    message: "Ruta base de pilotos. Usá /api/drivers/[driverId].",
  });
}
