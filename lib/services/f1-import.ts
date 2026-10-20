import { getOpenF1 } from "@/lib/openf1";
import { prisma } from "@/lib/prisma";

type OpenF1Session = {
  session_key: number;
  session_name: string;
  session_type: string;
  meeting_key: number;
  circuit_key: number;
  circuit_short_name: string;
  country_name: string;
  location: string;
  date_start: string;
  year: number;
  is_cancelled: boolean;
};

type OpenF1Meeting = {
  meeting_key: number;
  meeting_name: string;
  year: number;
  location: string;
  country_name: string;
};

type OpenF1Driver = {
  driver_number: number;
  name_acronym: string;
  first_name: string;
  last_name: string;
  country_code: string | null;
  team_name: string | null;
};

type OpenF1Result = {
  position: number | null;
  driver_number: number;
  number_of_laps: number;
  points?: number;
  dnf: boolean;
  dns: boolean;
  dsq: boolean;
};

function normalizeExternalId(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function normalizeName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

function hasSameName(first: string, second: string): boolean {
  return normalizeName(first) === normalizeName(second);
}

export async function importRaceBySessionKey(
  sessionKey: number
) {
  const matchingSessions = await getOpenF1<OpenF1Session[]>(
    "sessions",
    { session_key: String(sessionKey) }
  );

  const session = matchingSessions.find(
    (item) =>
      item.session_key === sessionKey &&
      item.session_type === "Race" &&
      !item.is_cancelled
  );

  if (!session) {
    throw new Error(
      `No se encontró una carrera válida para la sesión ${sessionKey}`
    );
  }

  const [meetings, drivers, results, seasonSessions] = await Promise.all([
    getOpenF1<OpenF1Meeting[]>("meetings", {
      year: String(session.year),
    }),
    getOpenF1<OpenF1Driver[]>("drivers", {
      session_key: String(sessionKey),
    }),
    getOpenF1<OpenF1Result[]>("session_result", {
      session_key: String(sessionKey),
    }),
    getOpenF1<OpenF1Session[]>("sessions", {
      year: String(session.year),
      session_name: "Race",
    }),
  ]);

  if (drivers.length === 0 || results.length === 0) {
    throw new Error(
      `La sesión ${sessionKey} no tiene pilotos o resultados para importar`
    );
  }

  const meeting = meetings.find(
    (item) => item.meeting_key === session.meeting_key
  );

  if (!meeting) {
    throw new Error(
      `No se encontró la reunión ${session.meeting_key}`
    );
  }

  const raceSessions = seasonSessions
    .filter(
      (item) =>
        item.meeting_key !== undefined &&
        item.session_type === "Race" &&
        !item.is_cancelled
    )
    .sort(
      (a, b) =>
        new Date(a.date_start).getTime() -
        new Date(b.date_start).getTime()
    );

  const round =
    raceSessions.findIndex(
      (item) => item.session_key === sessionKey
    ) + 1;

  if (round === 0) {
    throw new Error("No se pudo determinar la ronda de la carrera");
  }

  const driverByNumber = new Map<number, OpenF1Driver>();
  for (const driver of drivers) {
    if (driverByNumber.has(driver.driver_number)) {
      throw new Error(
        `OpenF1 devolvió el número de piloto ${driver.driver_number} más de una vez`
      );
    }
    driverByNumber.set(driver.driver_number, driver);
  }

  const resultByDriverNumber = new Map<number, OpenF1Result>();
  for (const result of results) {
    if (resultByDriverNumber.has(result.driver_number)) {
      throw new Error(
        `OpenF1 devolvió más de un resultado para el piloto ${result.driver_number}`
      );
    }
    if (!driverByNumber.has(result.driver_number)) {
      throw new Error(
        `El resultado del piloto ${result.driver_number} no tiene un piloto asociado en la sesión`
      );
    }
    resultByDriverNumber.set(result.driver_number, result);
  }

  const driverExternalIds = new Set<string>();
  const constructorNamesByExternalId = new Map<string, string>();
  for (const sourceDriver of drivers) {
    const acronym = sourceDriver.name_acronym?.trim();
    const result = resultByDriverNumber.get(sourceDriver.driver_number);

    if (!acronym) {
      if (result) {
        throw new Error(
          `El piloto ${sourceDriver.driver_number} tiene resultado pero no tiene acrónimo`
        );
      }
      continue;
    }

    const driverExternalId = `openf1-driver-${acronym.toLowerCase()}`;
    if (driverExternalIds.has(driverExternalId)) {
      throw new Error(
        `El acrónimo ${acronym} identifica a más de un piloto en la sesión`
      );
    }
    driverExternalIds.add(driverExternalId);

    if (result && !sourceDriver.team_name?.trim()) {
      throw new Error(
        `El piloto ${acronym} tiene resultado pero no tiene equipo asociado`
      );
    }

    const teamName = sourceDriver.team_name?.trim();
    if (!teamName) {
      continue;
    }

    const constructorExternalId =
      `openf1-team-${normalizeExternalId(teamName)}`;
    if (constructorExternalId === "openf1-team-") {
      throw new Error(
        `No se pudo generar un identificador para el equipo "${teamName}"`
      );
    }
    const existingTeamName =
      constructorNamesByExternalId.get(constructorExternalId);
    if (
      existingTeamName &&
      normalizeName(existingTeamName) !== normalizeName(teamName)
    ) {
      throw new Error(
        `Los equipos "${existingTeamName}" y "${teamName}" generan el mismo identificador externo`
      );
    }
    constructorNamesByExternalId.set(constructorExternalId, teamName);
  }

  const [existingCircuit, existingRace, existingDrivers, existingConstructors] =
    await Promise.all([
      prisma.circuit.findUnique({
        where: {
          externalId: `openf1-circuit-${session.circuit_key}`,
        },
      }),
      prisma.race.findUnique({
        where: {
          season_round: {
            season: session.year,
            round,
          },
        },
        include: {
          circuit: true,
        },
      }),
      prisma.driver.findMany({
        where: {
          externalId: {
            in: [...driverExternalIds],
          },
        },
      }),
      prisma.constructor.findMany({
        where: {
          externalId: {
            in: [...constructorNamesByExternalId.keys()],
          },
        },
      }),
    ]);

  if (
    existingCircuit &&
    (!hasSameName(existingCircuit.name, session.circuit_short_name) ||
      (existingCircuit.country &&
        !hasSameName(existingCircuit.country, session.country_name)) ||
      (existingCircuit.locality &&
        !hasSameName(existingCircuit.locality, session.location)))
  ) {
    throw new Error(
      `El circuito OpenF1 ${session.circuit_key} ya está asociado a datos diferentes`
    );
  }

  if (
    existingRace &&
    (existingRace.circuit.externalId !==
      `openf1-circuit-${session.circuit_key}` ||
      !hasSameName(existingRace.name, meeting.meeting_name) ||
      existingRace.date.getTime() !==
        new Date(session.date_start).getTime())
  ) {
    throw new Error(
      `La temporada ${session.year}, ronda ${round} ya está asociada a otra carrera`
    );
  }

  for (const existingDriver of existingDrivers) {
    const sourceDriver = drivers.find(
      (driver) =>
        `openf1-driver-${driver.name_acronym?.trim().toLowerCase()}` ===
        existingDriver.externalId
    );
    if (
      sourceDriver &&
      (!hasSameName(existingDriver.firstName, sourceDriver.first_name) ||
        !hasSameName(existingDriver.lastName, sourceDriver.last_name))
    ) {
      throw new Error(
        `El acrónimo ${sourceDriver.name_acronym} ya está asociado a otro piloto`
      );
    }
  }

  for (const existingConstructor of existingConstructors) {
    const sourceName = constructorNamesByExternalId.get(
      existingConstructor.externalId
    );
    if (sourceName && !hasSameName(existingConstructor.name, sourceName)) {
      throw new Error(
        `El equipo "${sourceName}" colisiona con el equipo ya guardado "${existingConstructor.name}"`
      );
    }
  }

  const circuit = await prisma.circuit.upsert({
    where: {
      externalId: `openf1-circuit-${session.circuit_key}`,
    },
    update: {
      name: session.circuit_short_name,
      locality: session.location,
      country: session.country_name,
    },
    create: {
      externalId: `openf1-circuit-${session.circuit_key}`,
      name: session.circuit_short_name,
      locality: session.location,
      country: session.country_name,
    },
  });

  const race = await prisma.race.upsert({
    where: {
      season_round: {
        season: session.year,
        round,
      },
    },
    update: {
      name: meeting.meeting_name,
      date: new Date(session.date_start),
      circuitId: circuit.id,
    },
    create: {
      season: session.year,
      round,
      name: meeting.meeting_name,
      date: new Date(session.date_start),
      circuitId: circuit.id,
    },
  });

  let importedDrivers = 0;
  let importedResults = 0;

  for (const sourceDriver of drivers) {
    const acronym = sourceDriver.name_acronym?.trim();

    if (!acronym) {
      continue;
    }

    const driverExternalId =
      `openf1-driver-${acronym.toLowerCase()}`;

    const driver = await prisma.driver.upsert({
      where: {
        externalId: driverExternalId,
      },
      update: {
        firstName: sourceDriver.first_name,
        lastName: sourceDriver.last_name,
        nationality: sourceDriver.country_code,
        permanentNumber: sourceDriver.driver_number,
        code: acronym,
      },
      create: {
        externalId: driverExternalId,
        firstName: sourceDriver.first_name,
        lastName: sourceDriver.last_name,
        nationality: sourceDriver.country_code,
        permanentNumber: sourceDriver.driver_number,
        code: acronym,
      },
    });

    importedDrivers++;

    const teamName = sourceDriver.team_name?.trim();
    if (!teamName) {
      continue;
    }

    const constructorExternalId =
      `openf1-team-${normalizeExternalId(teamName)}`;

    const constructor = await prisma.constructor.upsert({
      where: {
        externalId: constructorExternalId,
      },
      update: {
        name: teamName,
      },
      create: {
        externalId: constructorExternalId,
        name: teamName,
      },
    });

    const result = resultByDriverNumber.get(sourceDriver.driver_number);

    if (!result) {
      continue;
    }

    await prisma.raceResult.upsert({
      where: {
        raceId_driverId: {
          raceId: race.id,
          driverId: driver.id,
        },
      },
      update: {
        constructorId: constructor.id,
        position: result.position,
        grid: null,
        points: result.points ?? 0,
        laps: result.number_of_laps,
        status: result.dsq
          ? "Disqualified"
          : result.dns
            ? "Did not start"
            : result.dnf
              ? "Did not finish"
              : "Finished",
      },
      create: {
        raceId: race.id,
        driverId: driver.id,
        constructorId: constructor.id,
        position: result.position,
        grid: null,
        points: result.points ?? 0,
        laps: result.number_of_laps,
        status: result.dsq
          ? "Disqualified"
          : result.dns
            ? "Did not start"
            : result.dnf
              ? "Did not finish"
              : "Finished",
      },
    });

    importedResults++;
  }

  return {
    success: true,
    season: session.year,
    round,
    race: meeting.meeting_name,
    sessionKey,
    drivers: importedDrivers,
    results: importedResults,
  };
}