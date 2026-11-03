import { NextResponse } from "next/server";

import {
  AUTH_COOKIE_NAME,
  createSessionToken,
  hashPassword,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const formData = await request.formData();
  const username = String(formData.get("username") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!username || username.length < 3) {
    return NextResponse.json(
      { error: "El usuario debe tener al menos 3 caracteres." },
      { status: 400 }
    );
  }

  if (!email || !email.includes("@")) {
    return NextResponse.json(
      { error: "Ingresá un email válido." },
      { status: 400 }
    );
  }

  if (!password || password.length < 6) {
    return NextResponse.json(
      { error: "La contraseña debe tener al menos 6 caracteres." },
      { status: 400 }
    );
  }

  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ username }, { email }],
    },
  });

  if (existingUser) {
    return NextResponse.json(
      {
        error:
          existingUser.username === username
            ? "Ese nombre de usuario ya existe."
            : "Ese email ya está registrado.",
      },
      { status: 409 }
    );
  }

  const user = await prisma.user.create({
    data: {
      username,
      email,
      passwordHash: hashPassword(password),
    },
  });

  const response = NextResponse.redirect(new URL("/", request.url));
  response.cookies.set(AUTH_COOKIE_NAME, createSessionToken(user), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}
