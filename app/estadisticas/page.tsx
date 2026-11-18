import StandingsPage from "@/app/standings-page";

export default function DriversChampionshipPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string | string[] }>;
}) {
  return <StandingsPage championship="drivers" searchParams={searchParams} />;
}
