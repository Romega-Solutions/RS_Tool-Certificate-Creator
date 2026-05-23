import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "cert_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

type SessionPayload = {
  username: string;
  name: string;
  email: string;
  expiresAt: number;
};

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET is required");
  }
  return secret;
}

function sign(value: string) {
  return createHmac("sha256", getSessionSecret()).update(value).digest("hex");
}

function safeEqual(a: string, b: string) {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);

  return aBuffer.length === bBuffer.length && timingSafeEqual(aBuffer, bBuffer);
}

export function validateAdminCredentials(username: string, password: string) {
  const expectedUsername = process.env.ADMIN_USERNAME;
  const expectedPassword = process.env.ADMIN_PASSWORD;

  if (!expectedUsername || !expectedPassword) {
    throw new Error("ADMIN_USERNAME and ADMIN_PASSWORD are required");
  }

  return username === expectedUsername && password === expectedPassword;
}

export function createSessionToken(username: string) {
  const payload: SessionPayload = {
    username,
    name: process.env.ADMIN_NAME || "Certificate Admin",
    email: process.env.ADMIN_EMAIL || "admin@example.com",
    expiresAt: Date.now() + SESSION_TTL_SECONDS * 1000,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString(
    "base64url"
  );
  return `${encodedPayload}.${sign(encodedPayload)}`;
}

export function verifySessionToken(token?: string) {
  if (!token) {
    return null;
  }

  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature || !safeEqual(signature, sign(encodedPayload))) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8")
    ) as SessionPayload;

    if (payload.expiresAt < Date.now()) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_TTL_SECONDS,
    path: "/",
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getServerSession() {
  const cookieStore = await cookies();
  return verifySessionToken(cookieStore.get(COOKIE_NAME)?.value);
}

export async function requireApiSession() {
  const session = await getServerSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}

export async function requireApiSessionOrWebhookToken(request: NextRequest) {
  const webhookToken = process.env.N8N_UPDATE_TOKEN;
  const authHeader = request.headers.get("authorization");

  if (
    webhookToken &&
    authHeader?.startsWith("Bearer ") &&
    safeEqual(authHeader.slice("Bearer ".length), webhookToken)
  ) {
    return null;
  }

  return requireApiSession();
}

function getAutomationApiKeys() {
  return [process.env.RS_TOOL_API_KEY, process.env.API_KEY]
    .map((key) => key?.trim())
    .filter((key): key is string => Boolean(key));
}

function hasValidAutomationApiKey(request: NextRequest) {
  const requestKey = request.headers.get("x-api-key")?.trim();
  if (!requestKey) return false;

  return getAutomationApiKeys().some((key) => safeEqual(requestKey, key));
}

export async function requireAutomationCallbackAuth(request: NextRequest) {
  if (hasValidAutomationApiKey(request)) {
    return null;
  }

  const webhookToken = process.env.N8N_UPDATE_TOKEN;
  const authHeader = request.headers.get("authorization");

  if (
    webhookToken &&
    authHeader?.startsWith("Bearer ") &&
    safeEqual(authHeader.slice("Bearer ".length), webhookToken)
  ) {
    return null;
  }

  return NextResponse.json(
    {
      error: "Unauthorized",
      message: "Send X-API-Key with RS_TOOL_API_KEY/API_KEY or Authorization Bearer N8N_UPDATE_TOKEN.",
    },
    { status: 401 }
  );
}
