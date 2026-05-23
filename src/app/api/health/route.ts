import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(
    {
      ok: true,
      status: "ok",
      service: "certificate-creator",
      sourceTool: "RS_Tool-Romega-Certificate-Creator",
      version: "1.0",
      timestamp: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}
