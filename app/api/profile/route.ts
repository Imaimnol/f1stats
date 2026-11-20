import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { teamLogos } from "@/lib/team-logos";

const allowedAccents = new Set(["red", "cyan", "lime", "violet"]);
const avatarValues = {
  car: "🏎️",
  flag: "🏁",
  trophy: "🏆",
  bolt: "⚡",
  flame: "🔥",
} as const;
const allowedAvatars = new Set<string>(Object.values(avatarValues));

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { error: "Debés iniciar sesión para editar tu perfil." },
      { status: 401 }
    );
  }

  const formData = await request.formData();
  const displayName = String(formData.get("displayName") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  const profileAccent = String(formData.get("profileAccent") ?? "");
  const submittedAvatar = String(formData.get("profileAvatar") ?? "");
  const profileAvatar =
    Object.entries(avatarValues).find(([key]) => key === submittedAvatar)?.[1] ??
    submittedAvatar;
  const teamAvatarId = profileAvatar.startsWith("team:")
    ? profileAvatar.slice("team:".length)
    : null;

  if (displayName.length > 32 || bio.length > 160) {
    return NextResponse.redirect(
      new URL("/perfil?error=length", request.url),
      303
    );
  }

  const isExistingTeamAvatar = teamAvatarId
    ? Boolean(
        await prisma.team.findUnique({
          where: { id: teamAvatarId },
          select: { id: true },
        })
      )
    : false;
  const isTeamLogoAvatar = teamLogos.some(
    (team) => profileAvatar === `team-logo:${team.slug}`
  );

  if (
    !allowedAccents.has(profileAccent) ||
    (!allowedAvatars.has(profileAvatar) &&
      !isExistingTeamAvatar &&
      !isTeamLogoAvatar)
  ) {
    return NextResponse.redirect(
      new URL("/perfil?error=invalid", request.url),
      303
    );
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      displayName: displayName || null,
      bio: bio || null,
      profileAccent,
      profileAvatar,
    },
    select: { id: true },
  });

  return NextResponse.redirect(
    new URL("/perfil?updated=1", request.url),
    303
  );
}
