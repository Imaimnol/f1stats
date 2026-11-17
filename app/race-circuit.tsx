type Point = { x: number; y: number };

function getCircuitPath(points: Point[]) {
  const initialWidth =
    Math.max(...points.map((point) => point.x)) -
    Math.min(...points.map((point) => point.x));
  const initialHeight =
    Math.max(...points.map((point) => point.y)) -
    Math.min(...points.map((point) => point.y));
  const oriented =
    initialHeight > initialWidth
      ? points.map((point) => ({ x: point.y, y: point.x }))
      : points;
  const xs = oriented.map((point) => point.x);
  const ys = oriented.map((point) => point.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const width = maxX - minX;
  const height = maxY - minY;
  const scale = Math.min(168 / width, 88 / height);
  const offsetX = (200 - width * scale) / 2;
  const offsetY = (120 - height * scale) / 2;
  const fitted = oriented.map((point) => ({
    x: offsetX + (point.x - minX) * scale,
    y: offsetY + (maxY - point.y) * scale,
  }));
  const path = fitted.map((point, index) => {
    const previous = fitted[(index - 1 + fitted.length) % fitted.length];
    const next = fitted[(index + 1) % fitted.length];
    const afterNext = fitted[(index + 2) % fitted.length];
    const controlOne = {
      x: point.x + (next.x - previous.x) / 6,
      y: point.y + (next.y - previous.y) / 6,
    };
    const controlTwo = {
      x: next.x - (afterNext.x - point.x) / 6,
      y: next.y - (afterNext.y - point.y) / 6,
    };

    return `C ${controlOne.x} ${controlOne.y}, ${controlTwo.x} ${controlTwo.y}, ${next.x} ${next.y}`;
  });

  return {
    path: `M ${fitted[0].x} ${fitted[0].y} ${path.join(" ")} Z`,
  };
}

export default function RaceCircuit({
  circuit,
  points,
}: {
  circuit: string;
  points: Point[] | null;
}) {
  if (!points?.length) {
    return (
      <p className="max-w-36 text-right text-xs text-slate-500" role="status">
        Trazado de {circuit} no disponible
      </p>
    );
  }

  const { path } = getCircuitPath(points);

  return (
    <svg
      aria-label={`Trazado del circuito de ${circuit}`}
      className="race-circuit-drawing"
      fill="none"
      viewBox="0 0 200 120"
      role="img"
    >
      <path className="race-circuit-glow" d={path} />
      <path className="race-circuit-line" d={path} />
    </svg>
  );
}
