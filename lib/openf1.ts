
const OPENF1_BASE_URL = "https://api.openf1.org/v1";

export async function getOpenF1<T>(
  endpoint: string,
  params: Record<string, string> = {}
): Promise<T> {
  const url = new URL(`${OPENF1_BASE_URL}/${endpoint}`);

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `OpenF1 respondió con error ${response.status}: ${endpoint}`
    );
  }

  return response.json() as Promise<T>;
}
