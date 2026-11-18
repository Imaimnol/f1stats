const teamColors: Array<[string, string, string]> = [
  ["alpine", "#ff87bc", "ALP"],
  ["aston martin", "#00a19c", "AM"],
  ["audi", "#c7c7c7", "AUD"],
  ["cadillac", "#d8b15c", "CAD"],
  ["ferrari", "#e8002d", "SF"],
  ["haas", "#e10600", "H"],
  ["mclaren", "#ff8000", "MCL"],
  ["mercedes", "#27f4d2", "AMG"],
  ["racing bulls", "#6692ff", "RB"],
  ["red bull", "#3671c6", "RB"],
  ["williams", "#64c4ff", "W"],
];

export default function TeamMark({
  team,
  size = "sm",
}: {
  team: string | null | undefined;
  size?: "sm" | "md";
}) {
  if (!team) {
    return (
      <span
        aria-hidden="true"
        className={`inline-flex shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 ${
          size === "md" ? "size-9" : "size-7"
        }`}
      />
    );
  }

  const normalizedName = team.toLowerCase();
  const [, color, monogram] =
    teamColors.find(([name]) => normalizedName.includes(name)) ??
    ([team, "#94a3b8", team.slice(0, 3).toUpperCase()] as const);
  const dimensions = size === "md" ? "size-9 text-[9px]" : "size-7 text-[8px]";

  return (
    <span
      aria-label={`${team} logo`}
      className={`inline-flex shrink-0 items-center justify-center rounded-lg border font-black italic tracking-tight ${dimensions}`}
      role="img"
      style={{
        borderColor: `${color}66`,
        backgroundColor: `${color}16`,
        color,
      }}
    >
      {monogram}
    </span>
  );
}
