import crypto from "node:crypto";
import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";

export const AUTH_COOKIE_NAME = "f1stats-session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;
const AUTH_SECRET =
  process.env.AUTH_SECRET ||
  process.env.NEXTAUTH_SECRET ||
  process.env.JWT_SECRET ||
  "f1stats-dev-secret-change-me";

export type SessionUser = {
  id: string;
  username: string;
  email: string;
};

type SessionPayload = {
  sub: string;
  username: string;
  email: string;
  exp: number;
};

function encodeBase64Url(value: string) {
  return Buffer.from(value).toString("base64url");
}

function decodeBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

export function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, salt, 100000, 64, "sha512")
    .toString("hex");

  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string) {
  const separatorIndex = storedHash.indexOf(":");

  if (separatorIndex <= 0) {
    return false;
  }

  const salt = storedHash.slice(0, separatorIndex);
  const originalHash = storedHash.slice(separatorIndex + 1);
  const generatedHash = crypto
    .pbkdf2Sync(password, salt, 100000, 64, "sha512")
    .toString("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(originalHash, "hex"),
      Buffer.from(generatedHash, "hex")
    );
  } catch {
    return false;
  }
}

export function createSessionToken(user: SessionUser) {
  const payload: SessionPayload = {
    sub: user.id,
    username: user.username,
    email: user.email,
    exp: Date.now() + SESSION_TTL_MS,
  };

  const serialized = JSON.stringify(payload);
  const signature = crypto
    .createHmac("sha256", AUTH_SECRET)
    .update(serialized)
    .digest("hex");

  return `${encodeBase64Url(serialized)}.${signature}`;
}

export function verifySessionToken(token: string): SessionPayload | null {
  try {
    const separatorIndex = token.lastIndexOf(".");

    if (separatorIndex <= 0) {
      return null;
    }

    const base64Payload = token.slice(0, separatorIndex);
    const signature = token.slice(separatorIndex + 1);
    const serializedPayload = decodeBase64Url(base64Payload);
    const expectedSignature = crypto
      .createHmac("sha256", AUTH_SECRET)
      .update(serializedPayload)
      .digest("hex");

    if (
      !crypto.timingSafeEqual(
        Buffer.from(signature, "hex"),
        Buffer.from(expectedSignature, "hex")
      )
    ) {
      return null;
    }

    const payload = JSON.parse(serializedPayload) as SessionPayload;

    if (!payload.sub || !payload.exp || payload.exp < Date.now()) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const session = verifySessionToken(token);

  if (!session) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: {
      id: true,
      username: true,
      email: true,
    },
  });

  if (!user) {
    return null;
  }

  return user;
}
