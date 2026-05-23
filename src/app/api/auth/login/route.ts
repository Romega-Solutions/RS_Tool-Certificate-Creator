import { NextRequest, NextResponse } from "next/server";
import {
  createSessionToken,
  setSessionCookie,
  validateAdminCredentials,
} from "@/lib/server-auth";

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (
      typeof username !== "string" ||
      typeof password !== "string" ||
      !validateAdminCredentials(username, password)
    ) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    await setSessionCookie(createSessionToken(username));

    return NextResponse.json({
      success: true,
      user: {
        username,
        name: process.env.ADMIN_NAME || "Certificate Admin",
        email: process.env.ADMIN_EMAIL || "admin@example.com",
      },
    });
  } catch (error) {
    console.error("Login failed:", error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
