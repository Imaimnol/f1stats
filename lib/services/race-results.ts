import { prisma } from "@/lib/prisma";

export async function getSeasonRoundsWithResults(season: number) {
  if (!Number.isInteger(season) || season < 1950) {
    throw new Error("La temporada debe ser un año válido");
  }

  const races = await prisma.race.findMany({
    where: {
      season,
      results: { some: {} },
    },
    select: {
      round: true,
    },
  });

  return races.map((race) => race.round);
}

export async function getRaceResults(season: number, round: number) {
  if (
    !Number.isInteger(season) ||
    !Number.isInteger(round) ||
    season < 1950 ||
    round < 1
  ) {
    throw new Error("La temporada y la ronda deben ser valores válidos");
  }

  return prisma.race.findUnique({
    where: {
      season_round: {
        season,
        round,
      },
    },
    select: {
      season: true,
      round: true,
      name: true,
      date: true,
      circuit: {
        select: {
          name: true,
          locality: true,
          country: true,
        },
      },
      results: {
        orderBy: [
          { position: "asc" },
          { driver: { lastName: "asc" } },
        ],
        select: {
          position: true,
          grid: true,
          points: true,
          laps: true,
          status: true,
          driver: {
            select: {
              firstName: true,
              lastName: true,
              code: true,
            },
          },
          team: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });
}
