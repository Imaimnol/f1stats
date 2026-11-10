import { prisma } from "@/lib/prisma";

type PredictionRace = {
  round: number;
  sessionKey: number;
  dateStart: string;
  circuitKey: number;
  circuitShortName: string;
  location: string;
  countryName: string;
};

export async function preparePredictionRace(
  season: number,
  race: PredictionRace
) {
  const date = new Date(race.dateStart);
  if (!Number.isFinite(date.getTime())) {
    throw new Error("La fecha de la carrera no es válida.");
  }

  const circuit = await prisma.circuit.upsert({
    where: { externalId: `openf1-circuit-${race.circuitKey}` },
    update: {},
    create: {
      externalId: `openf1-circuit-${race.circuitKey}`,
      name: race.circuitShortName,
      locality: race.location,
      country: race.countryName,
    },
  });

  return prisma.race.upsert({
    where: {
      season_round: {
        season,
        round: race.round,
      },
    },
    update: {},
    create: {
      season,
      round: race.round,
      name: `${race.circuitShortName} Grand Prix`,
      date,
      circuitId: circuit.id,
    },
  });
}

const driverSelect = {
  id: true,
  firstName: true,
  lastName: true,
  code: true,
} as const;

export async function getPredictionDrivers(season: number) {
  const seasonDrivers = await prisma.driver.findMany({
    where: {
      results: {
        some: {
          race: { season },
        },
      },
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    select: driverSelect,
  });

  if (seasonDrivers.length > 0) {
    return seasonDrivers;
  }

  return prisma.driver.findMany({
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    select: driverSelect,
  });
}

export async function getUserRacePrediction(userId: string, raceId: string) {
  return prisma.racePrediction.findUnique({
    where: {
      userId_raceId: {
        userId,
        raceId,
      },
    },
    select: {
      firstDriverId: true,
      secondDriverId: true,
      thirdDriverId: true,
    },
  });
}

function scorePrediction(
  prediction: {
    firstDriverId: string;
    secondDriverId: string;
    thirdDriverId: string;
  },
  results: Array<{ position: number | null; driverId: string }>
) {
  const predicted = [
    prediction.firstDriverId,
    prediction.secondDriverId,
    prediction.thirdDriverId,
  ];
  const exactPositionCount = predicted.reduce((count, driverId, index) => {
    const result = results.find((item) => item.position === index + 1);
    return count + Number(result?.driverId === driverId);
  }, 0);

  return exactPositionCount * 3 + (exactPositionCount === 3 ? 6 : 0);
}

export async function getPredictionLeaderboard() {
  const testEntry = {
    id: "demo",
    username: "Prueba",
    points: 1,
    predictions: 0,
  };

  try {
    const users = await prisma.user.findMany({
      orderBy: { username: "asc" },
      select: { id: true, username: true },
    });

    let predictions: Array<{
      userId: string;
      firstDriverId: string;
      secondDriverId: string;
      thirdDriverId: string;
      race: {
        results: Array<{ position: number | null; driverId: string }>;
      };
    }> = [];
    let errorMessage: string | null = null;

    try {
      predictions = await prisma.racePrediction.findMany({
        select: {
          userId: true,
          firstDriverId: true,
          secondDriverId: true,
          thirdDriverId: true,
          race: {
            select: {
              results: {
                select: {
                  position: true,
                  driverId: true,
                },
              },
            },
          },
        },
      });
    } catch (error) {
      console.error("Error cargando las predicciones del ranking:", error);
      errorMessage =
        "No se pudieron consultar las predicciones; los usuarios se muestran con 0 puntos.";
    }

    const predictionsByUser = new Map<string, typeof predictions>();
    for (const prediction of predictions) {
      const userPredictions = predictionsByUser.get(prediction.userId) ?? [];
      userPredictions.push(prediction);
      predictionsByUser.set(prediction.userId, userPredictions);
    }

    const leaderboard = users
      .map((user) => {
        const userPredictions = predictionsByUser.get(user.id) ?? [];
        return {
          id: user.id,
          username: user.username,
          points: userPredictions.reduce(
            (total, prediction) =>
              total + scorePrediction(prediction, prediction.race.results),
            0
          ),
          predictions: userPredictions.length,
        };
      })
      .sort(
        (left, right) =>
          right.points - left.points ||
          left.username.localeCompare(right.username)
      );
    const hasPoints = leaderboard.some((user) => user.points > 0);

    return {
      leaderboard: hasPoints
        ? leaderboard
        : [...leaderboard, testEntry].sort(
            (left, right) =>
              right.points - left.points ||
              left.username.localeCompare(right.username)
          ),
      isDemo: !hasPoints,
      error: errorMessage,
    };
  } catch (error) {
    console.error("Error cargando el ranking de predicciones:", error);
    return {
      leaderboard: [testEntry],
      isDemo: true,
      error:
        "No se pudieron consultar los datos reales del ranking. Mostramos un puntaje de prueba.",
    };
  }
}
