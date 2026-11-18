import StandingsPage from "@/app/standings-page";

export default function ConstructorsChampionshipPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string | string[] }>;
}) {
  return <StandingsPage championship="constructors" searchParams={searchParams} />;
}
