export default function TeamCar({
  color,
  name,
}: {
  color: string;
  name: string;
}) {
  const gradientId = `team-car-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

  return (
    <svg
      aria-label={`Ilustración sin sponsors del auto de ${name}`}
      className="h-full w-full"
      role="img"
      viewBox="0 0 640 260"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.72" />
          <stop offset="0.5" stopColor={color} />
          <stop offset="1" stopColor={color} stopOpacity="0.72" />
        </linearGradient>
      </defs>
      <g fill="#07080b" stroke="#64748b" strokeWidth="3">
        <rect height="78" rx="20" width="46" x="157" y="12" />
        <rect height="78" rx="20" width="46" x="157" y="170" />
        <rect height="66" rx="18" width="42" x="443" y="22" />
        <rect height="66" rx="18" width="42" x="443" y="172" />
      </g>
      <g
        fill={`url(#${gradientId})`}
        stroke={color}
        strokeLinejoin="round"
        strokeWidth="4"
      >
        <path d="M68 104h83l31-13 57-4 49-18 83 2 38 14 56 5 38 13 44 12v24l-44 12-38 13-56 5-38 14-83 2-49-18-57-4-31-13H68l15-14-15-14Z" />
        <path d="M94 104h58v52H94l-25-26Z" />
        <path d="m532 111 42 8v22l-42 8Z" />
        <path d="M185 92h49l-14 20h-64Z" opacity=".8" />
        <path d="M185 168h49l-14-20h-64Z" opacity=".8" />
        <path d="M263 89h76l-8 22h-92Z" opacity=".65" />
        <path d="M263 171h76l-8-22h-92Z" opacity=".65" />
      </g>
      <g fill="#111318" stroke="#8993a5" strokeWidth="3">
        <path d="M78 83h83v14H78zM78 163h83v14H78z" />
        <path d="M548 82h58v15h-58zM548 163h58v15h-58z" />
      </g>
      <path
        d="M348 104c18-14 49-13 63 0l11 26-11 26c-14 13-45 14-63 0l-10-26Z"
        fill="#10131a"
        stroke="#dbe2ec"
        strokeOpacity=".65"
        strokeWidth="3"
      />
      <ellipse cx="371" cy="130" fill={color} rx="13" ry="15" />
      <path
        d="M339 103c22-20 62-20 82 0m-82 54c22 20 62 20 82 0"
        fill="none"
        stroke="#e2e8f0"
        strokeOpacity=".7"
        strokeWidth="4"
      />
      <path
        d="M219 119h94m-94 22h94"
        stroke="#fff"
        strokeOpacity=".25"
        strokeWidth="3"
      />
    </svg>
  );
}
