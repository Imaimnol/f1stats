import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({
      success: true,
      message: "Conexión con PostgreSQL exitosa",
    });
  } catch (error) {
    console.error("Error de conexión con PostgreSQL:", error);

    return NextResponse.json(
      {
        success: false,
        message: "No se pudo conectar con PostgreSQL",
      },
      { status: 500 }
    );
  }
}