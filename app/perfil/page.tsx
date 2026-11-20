import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { findTeamLogo, teamLogos } from "@/lib/team-logos";
import ProfileDashboard from "./profile-dashboard";

const avatars = ["🏎️", "🏁", "🏆", "⚡", "🔥"];

const accents = {
  red: "#e10600",
  cyan: "#22d3ee",
  lime: "#a3e635",
  violet: "#a78bfa",
} as const;

const dateFormatter = new Intl.DateTimeFormat("es-AR", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

export default async function PerfilPage({
  searchParams,
}: {
  searchParams: Promise<{
    updated?: string;
    favorites?: string;
    error?: string;
  }>;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const query = await searchParams;
  const [profileUser, drivers, teams, circuits, predictions] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        bio: true,
        profileAccent: true,
        profileAvatar: true,
        createdAt: true,
        favoriteDriver: {
          select: { id: true, firstName: true, lastName: true, code: true },
        },
        favoriteTeam: { select: { id: true, name: true } },
        favoriteCircuit: {
          select: { id: true, name: true, country: true },
        },
      },
    }),
    prisma.driver.findMany({
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      select: { id: true, firstName: true, lastName: true, code: true },
    }),
    prisma.team.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.circuit.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, country: true },
    }),
    prisma.racePrediction.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        firstDriverId: true,
        secondDriverId: true,
        thirdDriverId: true,
        updatedAt: true,
        firstDriver: {
          select: { firstName: true, lastName: true, code: true },
        },
        secondDriver: {
          select: { firstName: true, lastName: true, code: true },
        },
        thirdDriver: {
          select: { firstName: true, lastName: true, code: true },
        },
        race: {
          select: {
            name: true,
            season: true,
            round: true,
            date: true,
            results: {
              orderBy: { position: "asc" },
              select: {
                driverId: true,
                position: true,
                driver: {
                  select: { firstName: true, lastName: true, code: true },
                },
              },
            },
          },
        },
      },
    }),
  ]);

  if (!profileUser) {
    redirect("/login");
  }

  const profileAccent =
    accents[profileUser.profileAccent as keyof typeof accents] ?? accents.red;
  const isTeamAvatar =
    profileUser.profileAvatar.startsWith("team:") &&
    teams.some(
      (team) => `team:${team.id}` === profileUser.profileAvatar
    );
  const isTeamLogoAvatar = teamLogos.some(
    (team) => `team-logo:${team.slug}` === profileUser.profileAvatar
  );
  const selectedAvatar =
    avatars.includes(profileUser.profileAvatar) ||
    isTeamAvatar ||
    isTeamLogoAvatar
      ? profileUser.profileAvatar
      : avatars[0];
  const favoriteCount = [
    profileUser.favoriteDriver,
    profileUser.favoriteTeam,
    profileUser.favoriteCircuit,
  ].filter(Boolean).length;

  const scoredPredictions = predictions.map((prediction) => {
    const predictedDrivers = [
      prediction.firstDriver,
      prediction.secondDriver,
      prediction.thirdDriver,
    ];
    const predictedDriverIds = [
      prediction.firstDriverId,
      prediction.secondDriverId,
      prediction.thirdDriverId,
    ];
    const actualPodiumPositions = [1, 2, 3].map(
      (position) =>
        prediction.race.results.find((result) => result.position === position) ??
        null
    );
    const exactPositions = predictedDriverIds.reduce((count, driverId, index) => {
      return count + Number(actualPodiumPositions[index]?.driverId === driverId);
    }, 0);
    const hasResult = prediction.race.results.length > 0;
    const actualPodium = actualPodiumPositions.filter(
      (result): result is NonNullable<typeof result> => result !== null
    );

    return {
      id: prediction.id,
      race: prediction.race.name,
      season: prediction.race.season,
      round: prediction.race.round,
      raceDate: dateFormatter.format(prediction.race.date),
      updatedAt: dateFormatter.format(prediction.updatedAt),
      hasResult,
      points: hasResult ? exactPositions * 3 + (exactPositions === 3 ? 6 : 0) : 0,
      perfect: hasResult && exactPositions === 3,
      predictedPodium: predictedDrivers.map((driver) =>
        [driver.firstName, driver.lastName].filter(Boolean).join(" ")
      ),
      actualPodium: actualPodium.map((result) =>
        [result.driver.firstName, result.driver.lastName]
          .filter(Boolean)
          .join(" ")
      ),
      exactPositions,
      evaluatedPositions: actualPodium.length,
    };
  });
  const completedPredictions = scoredPredictions.filter(
    (prediction) => prediction.hasResult
  ).length;
  const perfectPodiums = scoredPredictions.filter(
    (prediction) => prediction.perfect
  ).length;
  const totalPredictionPoints = scoredPredictions.reduce(
    (total, prediction) => total + prediction.points,
    0
  );
  const exactPicks = scoredPredictions.reduce(
    (total, prediction) => total + (prediction.hasResult ? prediction.exactPositions : 0),
    0
  );
  const evaluatedPicks = scoredPredictions.reduce(
    (total, prediction) => total + prediction.evaluatedPositions,
    0
  );
  const favoriteTeamColor = profileUser.favoriteTeam
    ? findTeamLogo(profileUser.favoriteTeam.name)?.color
    : undefined;

  return (
    <ProfileDashboard
      profile={{
        username: profileUser.username,
        email: profileUser.email,
        displayName: profileUser.displayName,
        bio: profileUser.bio,
        avatar: selectedAvatar,
        accent: profileUser.profileAccent,
        accentColor: profileAccent,
        favoriteTeamColor,
        createdAt: dateFormatter.format(profileUser.createdAt),
        favoriteDriver: profileUser.favoriteDriver,
        favoriteTeam: profileUser.favoriteTeam,
        favoriteCircuit: profileUser.favoriteCircuit,
      }}
      options={{ drivers, teams, circuits }}
      stats={{
        predictions: predictions.length,
        completed: completedPredictions,
        perfect: perfectPodiums,
        preferences: favoriteCount,
        points: totalPredictionPoints,
        exactPicks,
        evaluatedPicks,
      }}
      predictions={scoredPredictions}
      query={query}
    />
  );
}
