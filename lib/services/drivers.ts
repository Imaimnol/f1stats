import { prisma } from "@/lib/prisma";

export async function getDriverCareerProfile(code: string) {
  const driver = await prisma.driver.findUnique({
    where: { externalId: `openf1-driver-${code.toLowerCase()}` },
    select: {
      firstName: true,
      lastName: true,
      code: true,
      permanentNumber: true,
      nationality: true,
      results: {
        orderBy: {
          race: { date: "desc" },
        },
        select: {
          position: true,
          grid: true,
          points: true,
          laps: true,
          status: true,
          team: {
            select: { name: true },
          },
          race: {
            select: {
              season: true,
              round: true,
              name: true,
              date: true,
              circuit: {
                select: { name: true },
              },
            },
          },
        },
      },
    },
  });

  if (!driver) {
    return null;
  }

  const finishes = driver.results
    .map((result) => result.position)
    .filter((position): position is number => position !== null && position > 0);

  return {
    ...driver,
    stats: {
      races: driver.results.length,
      points: driver.results.reduce((total, result) => total + result.points, 0),
      wins: driver.results.filter((result) => result.position === 1).length,
      podiums: driver.results.filter(
        (result) =>
          result.position !== null &&
          result.position >= 1 &&
          result.position <= 3
      ).length,
      poles: driver.results.filter((result) => result.grid === 1).length,
      bestFinish: finishes.length > 0 ? Math.min(...finishes) : null,
    },
  };
}

export async function getDriverProfile(driverId: string) {
  const driver = await prisma.driver.findUnique({
    where: { id: driverId },
    select: {
      firstName: true,
      lastName: true,
      code: true,
      permanentNumber: true,
      nationality: true,
      results: {
        orderBy: {
          race: { date: "desc" },
        },
        select: {
          position: true,
          points: true,
          laps: true,
          status: true,
          team: {
            select: { name: true },
          },
          race: {
            select: {
              season: true,
              round: true,
              name: true,
              circuit: {
                select: { name: true },
              },
            },
          },
        },
      },
    },
  });

  if (!driver) {
    return null;
  }

  return {
    ...driver,
    stats: {
      races: driver.results.length,
      points: driver.results.reduce((total, result) => total + result.points, 0),
      wins: driver.results.filter((result) => result.position === 1).length,
      podiums: driver.results.filter(
        (result) =>
          result.position !== null &&
          result.position >= 1 &&
          result.position <= 3
      ).length,
    },
  };
}
