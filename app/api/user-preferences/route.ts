import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    enabled: false,
    favoriteDriverId: null,
    message:
      "La funcionalidad de pilotos favoritos queda reservada para cuando se creen usuarios y autenticación.",
  });
}
