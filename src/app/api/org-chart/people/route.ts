import { NextResponse } from "next/server";
import { fetchOrgChartPeople } from "@/lib/org-chart-client";

export const dynamic = "force-dynamic";

export async function GET() {
  const result = await fetchOrgChartPeople();

  return NextResponse.json(result, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
