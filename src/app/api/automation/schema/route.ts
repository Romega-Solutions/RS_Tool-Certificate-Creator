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
      inboundEvents: ["certificate.send_requested"],
      outboundEvents: ["certificate.send_requested"],
      webhookReady: true,
      n8n: {
        envVars: ["N8N_WEBHOOK_URL", "N8N_API_KEY"],
      },
      exampleEnvelope: {
        event: "certificate.send_requested",
        sourceTool: "RS_Tool-Romega-Certificate-Creator",
        data: {
          recipientEmail: "person@example.com",
          recipientName: "Recipient Name",
          subject: "Your Certificate of Completion",
          message: "Please find your certificate attached.",
          certificateImage: "data:image/png;base64,...",
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
