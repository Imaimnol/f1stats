import { getOpenF1 } from "@/lib/openf1";
import { getSeasonRaceCalendar } from "@/lib/services/f1-import";

type OpenF1Driver = {
  driver_number: number;
  first_name: string;
  last_name: string;
  name_acronym: string | null;
  team_name: string;
  team_colour: string;
  headshot_url: string | null;
};

function hasDriverCode(
  driver: OpenF1Driver
): driver is OpenF1Driver & { name_acronym: string } {
  return (
    Number.isSafeInteger(driver.driver_number) &&
    driver.first_name.trim().length > 0 &&
    driver.last_name.trim().length > 0 &&
    Boolean(driver.name_acronym?.trim())
  );
}

export async function getSeasonDrivers(season: number) {
  const calendar = await getSeasonRaceCalendar(season);
  const now = new Date().getTime();
  const session =
    [...calendar.races]
      .reverse()
      .find((race) => new Date(race.dateStart).getTime() <= now) ??
    calendar.races[0];

  if (!session) {
    return [];
  }

  const drivers = await getOpenF1<OpenF1Driver[]>("drivers", {
    session_key: String(session.sessionKey),
  });

  return drivers
    .filter(hasDriverCode)
    .map((driver) => {
      let headshotUrl: string | null = null;
      if (driver.headshot_url) {
        try {
          const parsedUrl = new URL(driver.headshot_url);
          if (parsedUrl.protocol === "https:" && parsedUrl.hostname === "media.formula1.com") {
            headshotUrl = parsedUrl
              .toString()
              .replace("/1col/", "/4col/");
          }
        } catch {
          headshotUrl = null;
        }
      }

      return {
        number: driver.driver_number,
        firstName: driver.first_name.trim(),
        lastName: driver.last_name.trim(),
        code: driver.name_acronym.trim(),
        team: driver.team_name?.trim() || "Equipo no disponible",
        teamColor: /^[\da-fA-F]{6}$/.test(driver.team_colour ?? "")
          ? `#${driver.team_colour}`
          : "#64748b",
        headshotUrl,
      };
    })
    .sort((left, right) => left.number - right.number);
}
