export const teamLogos = [
  {
    name: "Alpine",
    slug: "alpine",
    color: "#0093cc",
    aliases: ["alpine"],
    carFile: "Alpine.webp",
  },
  {
    name: "Aston Martin",
    slug: "aston-martin",
    color: "#00665e",
    aliases: ["aston martin"],
    carFile: "Aston Martin.webp",
  },
  {
    name: "Audi",
    slug: "audi",
    color: "#d5001c",
    aliases: ["audi"],
    carFile: "Audi.webp",
  },
  {
    name: "Cadillac",
    slug: "cadillac",
    color: "#c5a85c",
    aliases: ["cadillac"],
    carFile: "Cadillac.webp",
  },
  {
    name: "Ferrari",
    slug: "ferrari",
    color: "#e8002d",
    aliases: ["ferrari"],
    carFile: "Ferrari.webp",
  },
  {
    name: "Haas F1 Team",
    slug: "haas",
    color: "#d6001c",
    aliases: ["haas"],
    carFile: "Haas F1 Team.webp",
  },
  {
    name: "McLaren",
    slug: "mclaren",
    color: "#ff8000",
    aliases: ["mclaren"],
    carFile: "McLaren.webp",
  },
  {
    name: "Mercedes",
    slug: "mercedes",
    color: "#00d7b3",
    aliases: ["mercedes"],
    carFile: "Mercedes.webp",
  },
  {
    name: "Racing Bulls",
    slug: "racing-bulls",
    color: "#6692ff",
    aliases: ["racing bulls"],
    carFile: "Racing Bulls.webp",
  },
  {
    name: "Red Bull Racing",
    slug: "red-bull",
    color: "#3671c6",
    aliases: ["red bull"],
    carFile: "Red Bull Racing.webp",
  },
  {
    name: "Williams",
    slug: "williams",
    color: "#1868db",
    aliases: ["williams"],
    carFile: "Williams.webp",
  },
] as const;

export type TeamLogoSlug = (typeof teamLogos)[number]["slug"];

export function findTeamLogo(teamName: string | null | undefined) {
  const normalizedName = teamName?.toLowerCase();

  if (!normalizedName) {
    return undefined;
  }

  return teamLogos.find((team) =>
    team.aliases.some((alias) => normalizedName.includes(alias))
  );
}
