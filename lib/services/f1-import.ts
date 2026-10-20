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

export async function importRaceBySessionKey(
  sessionKey: number
) {
  const sessions = await getOpenF1<OpenF1Session[]>(
    "sessions",
    { year: "2023", session_name: "Race" }
  );

  const session = sessions.find(
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

  const [meetings, drivers, results] = await Promise.all([
    getOpenF1<OpenF1Meeting[]>("meetings", {
      year: String(session.year),
    }),
    getOpenF1<OpenF1Driver[]>("drivers", {
      session_key: String(sessionKey),
    }),
    getOpenF1<OpenF1Result[]>("session_result", {
      session_key: String(sessionKey),
    }),
  ]);

  const meeting = meetings.find(
    (item) => item.meeting_key === session.meeting_key
  );

  if (!meeting) {
    throw new Error(
      `No se encontró la reunión ${session.meeting_key}`
    );
  }

  const raceSessions = sessions
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

  const driverByNumber = new Map(
    drivers.map((driver) => [driver.driver_number, driver])
  );

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

    if (!sourceDriver.team_name) {
      continue;
    }

    const constructorExternalId =
      `openf1-team-${normalizeExternalId(sourceDriver.team_name)}`;

    const constructor = await prisma.constructor.upsert({
      where: {
        externalId: constructorExternalId,
      },
      update: {
        name: sourceDriver.team_name,
      },
      create: {
        externalId: constructorExternalId,
        name: sourceDriver.team_name,
      },
    });

    const result = results.find(
      (item) => item.driver_number === sourceDriver.driver_number
    );

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