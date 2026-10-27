import { prisma } from "@/lib/prisma";

type Standing = {
  id: string;
  name: string;
  detail: string | null;
  points: number;
  wins: number;
  podiums: number;
  starts: number;
  finishes: number[];
};

function compareStandings(left: Standing, right: Standing) {
  const pointsDifference = right.points - left.points;
  if (pointsDifference !== 0) {
    return pointsDifference;
  }

  const finishCount = Math.max(left.finishes.length, right.finishes.length);
  for (let index = 0; index < finishCount; index++) {
    const finishDifference =
      (left.finishes[index] ?? Number.POSITIVE_INFINITY) -
      (right.finishes[index] ?? Number.POSITIVE_INFINITY);
    if (finishDifference !== 0) {
      return finishDifference;
    }
  }

  return left.name.localeCompare(right.name);
}

function rankStandings(rows: Standing[]): Omit<Standing, "finishes">[] {
  const rankedRows = rows
    .map((row) => ({
      ...row,
      finishes: [...row.finishes].sort((left, right) => left - right),
    }))
    .sort(compareStandings);

  return rankedRows.map((row) => ({
    id: row.id,
    name: row.name,
    detail: row.detail,
    points: row.points,
    wins: row.wins,
    podiums: row.podiums,
    starts: row.starts,
  }));
}

export async function getAvailableSeasons(currentSeason: number) {
  const races = await prisma.race.findMany({
    where: {
      results: { some: {} },
    },
    select: {
      season: true,
    },
    distinct: ["season"],
    orderBy: {
      season: "desc",
    },
  });

  return [...new Set([currentSeason, ...races.map((race) => race.season)])].sort(
    (left, right) => right - left
  );
}

export async function getSeasonStandings(season: number) {
  if (!Number.isInteger(season)) {
    throw new Error("El año de temporada debe ser un número entero");
  }

  const results = await prisma.raceResult.findMany({
    where: {
      race: { season },
    },
    select: {
      raceId: true,
      position: true,
      points: true,
      race: {
        select: {
          round: true,
          name: true,
          date: true,
          circuit: {
            select: {
              name: true,
            },
          },
        },
      },
      driver: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          code: true,
          nationality: true,
        },
      },
      team: {
        select: {
          id: true,
          name: true,
          nationality: true,
        },
      },
    },
  });

  const drivers = new Map<string, Standing>();
  const constructors = new Map<string, Standing>();
  const races = new Set<string>();
  const raceDetails = new Map<
    string,
    {
      round: number;
      name: string;
      date: Date;
      circuit: { name: string };
    }
  >();
  const constructorRaces = new Map<string, Set<string>>();

  for (const result of results) {
    races.add(result.raceId);
    raceDetails.set(result.raceId, result.race);

    const driver = drivers.get(result.driver.id) ?? {
      id: result.driver.id,
      name: `${result.driver.firstName} ${result.driver.lastName}`,
      detail: result.driver.code ?? result.driver.nationality,
      points: 0,
      wins: 0,
      podiums: 0,
      starts: 0,
      finishes: [],
    };
    driver.points += result.points;
    driver.wins += result.position === 1 ? 1 : 0;
    driver.podiums +=
      result.position !== null &&
      result.position >= 1 &&
      result.position <= 3
        ? 1
        : 0;
    driver.starts++;
    if (result.position !== null && result.position >= 1) {
      driver.finishes.push(result.position);
    }
    drivers.set(driver.id, driver);

    const constructor = constructors.get(result.team.id) ?? {
      id: result.team.id,
      name: result.team.name,
      detail: result.team.nationality,
      points: 0,
      wins: 0,
      podiums: 0,
      starts: 0,
      finishes: [],
    };
    constructor.points += result.points;
    constructor.wins += result.position === 1 ? 1 : 0;
    constructor.podiums +=
      result.position !== null &&
      result.position >= 1 &&
      result.position <= 3
        ? 1
        : 0;
    if (result.position !== null && result.position >= 1) {
      constructor.finishes.push(result.position);
    }
    const constructorSeasonRaces =
      constructorRaces.get(constructor.id) ?? new Set<string>();
    constructorSeasonRaces.add(result.raceId);
    constructor.starts = constructorSeasonRaces.size;
    constructorRaces.set(constructor.id, constructorSeasonRaces);
    constructors.set(constructor.id, constructor);
  }

  return {
    season,
    races: races.size,
    raceDetails: [...raceDetails.values()].sort(
      (left, right) => left.round - right.round
    ),
    drivers: rankStandings([...drivers.values()]),
    constructors: rankStandings([...constructors.values()]),
  };
}
