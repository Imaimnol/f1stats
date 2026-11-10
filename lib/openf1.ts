
const OPENF1_BASE_URL = "https://api.openf1.org/v1";
const OPENF1_MAX_RETRIES = 5;

type OpenF1DriverInfo = {
  name_acronym: string;
  driver_number: number;
  team_colour: string | null;
};

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getLatestDriverInfo() {
  const drivers = await getOpenF1<OpenF1DriverInfo[]>(
    "drivers",
    { session_key: "latest" },
    1
  );
  const driverInfo = new Map<
    string,
    { number: number; teamColor: string | null }
  >();

  for (const driver of drivers) {
    const acronym = driver.name_acronym?.trim().toUpperCase();
    if (!acronym || !Number.isInteger(driver.driver_number)) {
      continue;
    }

    const teamColor =
      driver.team_colour && /^[\da-f]{6}$/i.test(driver.team_colour)
        ? `#${driver.team_colour}`
        : null;
    driverInfo.set(acronym, {
      number: driver.driver_number,
      teamColor,
    });
  }

  return driverInfo;
}

export async function getOpenF1<T>(
  endpoint: string,
  params: Record<string, string> = {},
  retries = OPENF1_MAX_RETRIES
): Promise<T> {
  const url = new URL(`${OPENF1_BASE_URL}/${endpoint}`);

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  for (let attempt = 0; attempt <= retries; attempt++) {
    const response = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (response.ok) {
      return response.json() as Promise<T>;
    }

    const retryAfterHeader = response.headers.get("Retry-After");
    const retryAfterSeconds = Number(retryAfterHeader ?? "");
    const isRateLimited = response.status === 429;
    const shouldRetry =
      (isRateLimited || response.status >= 500) &&
      attempt < retries;

    if (!shouldRetry) {
      throw new Error(
        `OpenF1 respondió con error ${response.status}: ${endpoint}`
      );
    }

    const delayMs =
      Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0
        ? retryAfterSeconds * 1000
        : 1000 * 2 ** attempt;

    await wait(delayMs);
  }

  throw new Error(`OpenF1 respondió con error final: ${endpoint}`);
}
