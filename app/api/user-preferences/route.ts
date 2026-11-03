import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function pickString(value: FormDataEntryValue | null | undefined) {
  return typeof value === "string" ? value.trim() : "";
}

async function validateExistingId(
  model: "driver" | "team" | "circuit",
  id: string | null | undefined
) {
  if (!id) {
    return null;
  }

  if (model === "driver") {
    const driver = await prisma.driver.findUnique({ where: { id }, select: { id: true } });
    return driver ? id : null;
  }

  if (model === "team") {
    const team = await prisma.team.findUnique({ where: { id }, select: { id: true } });
    return team ? id : null;
  }

  const circuit = await prisma.circuit.findUnique({ where: { id }, select: { id: true } });
  return circuit ? id : null;
}

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { error: "Debés iniciar sesión para consultar tus favoritos." },
      { status: 401 }
    );
  }

  const profileUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      favoriteDriverId: true,
      favoriteTeamId: true,
      favoriteCircuitId: true,
      favorites: {
        select: { driverId: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  return NextResponse.json({
    enabled: true,
    favoriteDriverId: profileUser?.favoriteDriverId ?? null,
    favoriteTeamId: profileUser?.favoriteTeamId ?? null,
    favoriteCircuitId: profileUser?.favoriteCircuitId ?? null,
    favoriteDriverIds: profileUser?.favorites.map((favorite) => favorite.driverId) ?? [],
  });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { error: "Debés iniciar sesión para guardar tus preferencias." },
      { status: 401 }
    );
  }

  let formData: FormData | null = null;
  let payload: Record<string, unknown> | null = null;

  const isFormRequest = request.headers.get("content-type")?.includes("multipart/form-data") || request.headers.get("content-type")?.includes("application/x-www-form-urlencoded");

  if (isFormRequest) {
    formData = await request.formData();
  } else {
    try {
      payload = (await request.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json(
        { error: "El cuerpo de la solicitud debe ser JSON o formulario válido." },
        { status: 400 }
      );
    }
  }

  const driverId =
    formData !== null
      ? pickString(formData.get("favoriteDriverId")) || pickString(formData.get("driverId"))
      : typeof payload?.favoriteDriverId === "string"
        ? payload.favoriteDriverId
        : typeof payload?.driverId === "string"
          ? payload.driverId
          : null;

  const teamId =
    formData !== null
      ? pickString(formData.get("favoriteTeamId"))
      : typeof payload?.favoriteTeamId === "string"
        ? payload.favoriteTeamId
        : null;

  const circuitId =
    formData !== null
      ? pickString(formData.get("favoriteCircuitId"))
      : typeof payload?.favoriteCircuitId === "string"
        ? payload.favoriteCircuitId
        : null;

  const nextDriverId = await validateExistingId("driver", driverId || null);
  const nextTeamId = await validateExistingId("team", teamId || null);
  const nextCircuitId = await validateExistingId("circuit", circuitId || null);

  const currentUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      favoriteDriverId: true,
      favoriteTeamId: true,
      favoriteCircuitId: true,
    },
  });

  if (!currentUser) {
    return NextResponse.json({ error: "Usuario no encontrado." }, { status: 404 });
  }

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      favoriteDriverId: nextDriverId ?? currentUser.favoriteDriverId ?? null,
      favoriteTeamId: nextTeamId ?? currentUser.favoriteTeamId ?? null,
      favoriteCircuitId: nextCircuitId ?? currentUser.favoriteCircuitId ?? null,
    },
    select: {
      id: true,
      favoriteDriverId: true,
      favoriteTeamId: true,
      favoriteCircuitId: true,
    },
  });

  if (driverId && nextDriverId) {
    await prisma.favoriteDriver.upsert({
      where: {
        userId_driverId: {
          userId: user.id,
          driverId: nextDriverId,
        },
      },
      create: {
        userId: user.id,
        driverId: nextDriverId,
      },
      update: {},
    });
  }

  if (isFormRequest) {
    return NextResponse.redirect(new URL("/perfil", request.url));
  }

  return NextResponse.json({
    success: true,
    favoriteDriverId: updatedUser.favoriteDriverId,
    favoriteTeamId: updatedUser.favoriteTeamId,
    favoriteCircuitId: updatedUser.favoriteCircuitId,
  });
}

export async function DELETE(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { error: "Debés iniciar sesión para modificar tus favoritos." },
      { status: 401 }
    );
  }

  let payload: Record<string, unknown> | null = null;
  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { error: "El cuerpo de la solicitud debe ser JSON válido." },
      { status: 400 }
    );
  }

  if (
    typeof payload?.driverId === "string" &&
    payload.driverId.length > 0
  ) {
    await prisma.favoriteDriver.deleteMany({
      where: {
        userId: user.id,
        driverId: payload.driverId,
      },
    });
  }

  return NextResponse.json({ success: true, favorite: false });
}
