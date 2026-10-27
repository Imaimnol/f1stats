import { prisma } from "@/lib/prisma";

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
