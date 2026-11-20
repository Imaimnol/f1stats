import Image from "next/image";

import { findTeamLogo } from "@/lib/team-logos";

export default function TeamMark({
  team,
  size = "sm",
}: {
  team: string | null | undefined;
  size?: "sm" | "md" | "lg";
}) {
  if (!team) {
    return null;
  }

  const normalizedName = team.toLowerCase();
  const teamLogo = findTeamLogo(normalizedName);

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

  const dimensions = size === "lg" ? 56 : size === "md" ? 40 : 32;
  const logoColor = teamLogo.slug === "mercedes" ? "brightness-0 invert" : "";

  return (
    <Image
      alt={`${team} logo`}
      className={`shrink-0 object-contain ${logoColor}`}
      height={dimensions}
      src={`/team-logos/${teamLogo.slug}.webp`}
      width={dimensions}
    />
  );
}
