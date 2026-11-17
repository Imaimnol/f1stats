import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const allowedAccents = new Set(["red", "cyan", "lime", "violet"]);
const allowedAvatars = new Set(["🏎️", "🏁", "🏆", "⚡", "🔥"]);

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
  const profileAvatar = String(formData.get("profileAvatar") ?? "");

  if (displayName.length > 32 || bio.length > 160) {
    return NextResponse.redirect(new URL("/perfil?error=length", request.url));
  }

  if (!allowedAccents.has(profileAccent) || !allowedAvatars.has(profileAvatar)) {
    return NextResponse.redirect(new URL("/perfil?error=invalid", request.url));
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

  return NextResponse.redirect(new URL("/perfil?updated=1", request.url));
}
