import { connection, NextResponse } from "next/server";
import { getDriverProfile } from "@/lib/services/drivers";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ driverId: string }> }
) {
  await connection();

  const { driverId } = await params;
  const driver = await getDriverProfile(driverId);

  if (!driver) {
    return NextResponse.json(
      { success: false, message: "Piloto no encontrado" },
      { status: 404 }
    );
  }

  return NextResponse.json(driver);
}
