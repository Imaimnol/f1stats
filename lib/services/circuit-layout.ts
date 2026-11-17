type CircuitCorner = {
  number: number;
  length: number;
  trackPosition: {
    x: number;
    y: number;
  };
};

type CircuitLayoutResponse = {
  corners: CircuitCorner[];
};

function isCircuitLayoutResponse(
  value: unknown
): value is CircuitLayoutResponse {
  if (
    typeof value !== "object" ||
    value === null ||
    !("corners" in value) ||
    !Array.isArray(value.corners)
  ) {
    return false;
  }

  return value.corners.every(
    (corner: unknown) =>
      typeof corner === "object" &&
      corner !== null &&
      "number" in corner &&
      typeof corner.number === "number" &&
      Number.isFinite(corner.number) &&
      "length" in corner &&
      typeof corner.length === "number" &&
      Number.isFinite(corner.length) &&
      "trackPosition" in corner &&
      typeof corner.trackPosition === "object" &&
      corner.trackPosition !== null &&
      "x" in corner.trackPosition &&
      typeof corner.trackPosition.x === "number" &&
      Number.isFinite(corner.trackPosition.x) &&
      "y" in corner.trackPosition &&
      typeof corner.trackPosition.y === "number" &&
      Number.isFinite(corner.trackPosition.y)
  );
}

export async function getCircuitLayout(circuitKey: number, season: number) {
  if (
    !Number.isSafeInteger(circuitKey) ||
    circuitKey < 1 ||
    !Number.isSafeInteger(season) ||
    season < 1950
  ) {
    throw new Error("El circuito y la temporada deben ser valores válidos");
  }

  const response = await fetch(
    `https://api.multiviewer.app/api/v1/circuits/${circuitKey}/${season}`,
    {
      headers: { Accept: "application/json" },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(
      `MultiViewer respondió con error ${response.status} al cargar el trazado`
    );
  }

  const payload: unknown = await response.json();
  if (!isCircuitLayoutResponse(payload) || payload.corners.length < 4) {
    throw new Error("MultiViewer devolvió un trazado de circuito inválido");
  }

  return payload.corners
    .map((corner) => ({
      ...corner.trackPosition,
      length: corner.length,
    }))
    .sort((left, right) => left.length - right.length)
    .map(({ x, y }) => ({ x, y }));
}
