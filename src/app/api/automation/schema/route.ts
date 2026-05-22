import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    {
      service: "certificate-creator",
      sourceTool: "RS_Tool-Romega-Certificate-Creator",
      version: "1.0",
      auth: {
        type: "header",
        header: "X-API-Key",
        envVars: ["RS_TOOL_API_KEY"],
      },
      staffDirectory: {
        consumes: "org-chart",
        localEndpoint: "/api/org-chart/people",
      },
      inboundEvents: [
        "org_chart.people.snapshot_ready",
        "certificate.send_requested",
        "certificate.delivery.status_updated",
      ],
      outboundEvents: ["certificate.send_requested"],
      callbackEndpoints: [
        {
          event: "certificate.delivery.status_updated",
          method: "POST",
          path: "/api/automation/callback",
          auth: "X-API-Key or Authorization Bearer N8N_UPDATE_TOKEN",
        },
      ],
      webhookReady: true,
      n8n: {
        envVars: ["N8N_WEBHOOK_URL", "N8N_API_KEY"],
      },
      exampleEnvelope: {
        event: "certificate.send_requested",
        sourceTool: "RS_Tool-Romega-Certificate-Creator",
        version: "1.0",
        requestId: "cert_20260521_example",
        occurredAt: "2026-05-21T00:00:00.000Z",
        actor: { type: "api", name: "API Integration" },
        data: {
          recipientName: "Jane Doe",
          recipientEmail: "jane@romega-solutions.com",
        },
      },
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}
