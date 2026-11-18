import Image from "next/image";

const teams: Array<[string, string]> = [
  ["alpine", "alpine"],
  ["aston martin", "aston-martin"],
  ["audi", "audi"],
  ["cadillac", "cadillac"],
  ["ferrari", "ferrari"],
  ["haas", "haas"],
  ["mclaren", "mclaren"],
  ["mercedes", "mercedes"],
  ["racing bulls", "racing-bulls"],
  ["red bull", "red-bull"],
  ["williams", "williams"],
];

export default function TeamMark({
  team,
  size = "sm",
}: {
  team: string | null | undefined;
  size?: "sm" | "md";
}) {
  if (!team) {
    return null;
  }

  const normalizedName = team.toLowerCase();
  const teamLogo = teams.find(([name]) => normalizedName.includes(name));

  if (!teamLogo) {
    return (
      <span
        aria-label={`${team} logo`}
        className="inline-flex size-7 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/5 text-[8px] font-bold text-slate-400"
        role="img"
      >
        {team.slice(0, 3).toUpperCase()}
      </span>
    );
  }

  const [, logoName] = teamLogo;
  const dimensions = size === "md" ? 40 : 32;

  return (
    <Image
      alt={`${team} logo`}
      className="shrink-0 object-contain"
      height={dimensions}
      src={`/team-logos/${logoName}.webp`}
      width={dimensions}
    />
  );
}
