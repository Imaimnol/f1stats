
const OPENF1_BASE_URL = "https://api.openf1.org/v1";
const OPENF1_MAX_RETRIES = 5;

type OpenF1DriverHeadshot = {
  name_acronym: string;
  headshot_url: string | null;
};

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getLatestDriverHeadshots() {
  const drivers = await getOpenF1<OpenF1DriverHeadshot[]>(
    "drivers",
    { session_key: "latest" },
    1
  );
  const headshots = new Map<string, string>();

  for (const driver of drivers) {
    const acronym = driver.name_acronym?.trim().toUpperCase();
    if (!acronym || !driver.headshot_url) {
      continue;
    }

    try {
      const url = new URL(driver.headshot_url);
      if (url.protocol === "https:" && url.hostname === "media.formula1.com") {
        headshots.set(acronym, url.toString());
      }
    } catch {
      continue;
    }
  }

  return headshots;
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
