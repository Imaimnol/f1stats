import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { error: "Debés iniciar sesión para consultar tus favoritos." },
      { status: 401 }
    );
  }

  const favorites = await prisma.favoriteDriver.findMany({
    where: { userId: user.id },
    select: {
      driverId: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  return NextResponse.json({
    enabled: true,
    favoriteDriverIds: favorites.map((favorite) => favorite.driverId),
  });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { error: "Debés iniciar sesión para guardar favoritos." },
      { status: 401 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "El cuerpo de la solicitud debe ser JSON válido." },
      { status: 400 }
    );
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("driverId" in body) ||
    typeof body.driverId !== "string" ||
    body.driverId.length === 0
  ) {
    return NextResponse.json(
      { error: "Debés indicar un piloto válido." },
      { status: 400 }
    );
  }

  const driver = await prisma.driver.findUnique({
    where: { id: body.driverId },
    select: { id: true },
  });

  if (!driver) {
    return NextResponse.json(
      { error: "No se encontró el piloto solicitado." },
      { status: 404 }
    );
  }

  await prisma.favoriteDriver.upsert({
    where: {
      userId_driverId: {
        userId: user.id,
        driverId: driver.id,
      },
    },
    create: {
      userId: user.id,
      driverId: driver.id,
    },
    update: {},
  });

  return NextResponse.json({ success: true, favorite: true });
}

export async function DELETE(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { error: "Debés iniciar sesión para modificar tus favoritos." },
      { status: 401 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "El cuerpo de la solicitud debe ser JSON válido." },
      { status: 400 }
    );
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("driverId" in body) ||
    typeof body.driverId !== "string" ||
    body.driverId.length === 0
  ) {
    return NextResponse.json(
      { error: "Debés indicar un piloto válido." },
      { status: 400 }
    );
  }

  await prisma.favoriteDriver.deleteMany({
    where: {
      userId: user.id,
      driverId: body.driverId,
    },
  });

  return NextResponse.json({ success: true, favorite: false });
}
