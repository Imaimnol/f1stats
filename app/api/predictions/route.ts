import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function redirectToPrediction(request: Request, result: string) {
  const url = new URL("/prediccion", request.url);
  url.searchParams.set("prediction", result);
  return NextResponse.redirect(url, 303);
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url), 303);
  }

  const formData = await request.formData();
  const raceId = formData.get("raceId");
  const firstDriverId = formData.get("firstDriverId");
  const secondDriverId = formData.get("secondDriverId");
  const thirdDriverId = formData.get("thirdDriverId");

  if (
    typeof raceId !== "string" ||
    typeof firstDriverId !== "string" ||
    typeof secondDriverId !== "string" ||
    typeof thirdDriverId !== "string" ||
    new Set([firstDriverId, secondDriverId, thirdDriverId]).size !== 3
  ) {
    return redirectToPrediction(request, "invalid");
  }

  const race = await prisma.race.findUnique({
    where: { id: raceId },
    select: {
      id: true,
      date: true,
      results: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!race || race.date.getTime() <= Date.now() || race.results.length > 0) {
    return redirectToPrediction(request, "closed");
  }

  const drivers = await prisma.driver.findMany({
    where: {
      id: {
        in: [firstDriverId, secondDriverId, thirdDriverId],
      },
    },
    select: { id: true },
  });

  if (drivers.length !== 3) {
    return redirectToPrediction(request, "invalid");
  }

  await prisma.racePrediction.upsert({
    where: {
      userId_raceId: {
        userId: user.id,
        raceId: race.id,
      },
    },
    update: {
      firstDriverId,
      secondDriverId,
      thirdDriverId,
    },
    create: {
      userId: user.id,
      raceId: race.id,
      firstDriverId,
      secondDriverId,
      thirdDriverId,
    },
  });

  return redirectToPrediction(request, "saved");
}
