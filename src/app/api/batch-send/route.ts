import { NextRequest, NextResponse } from "next/server";
import { getEmailQueueByIds, updateEmailQueueStatus } from "@/lib/db";
import { requireApiSession } from "@/lib/server-auth";

type CertificateWebhookPayload = {
  id?: number;
  recipient_email: string;
  recipient_name: string;
  certificate_image: string;
  subject: string;
  message: string;
  timestamp: string;
  email_header_title?: string;
  email_header_subtitle?: string;
  email_footer_company?: string;
  email_footer_dept?: string;
  email_sender_name?: string;
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  highlight_color?: string;
};

export async function POST(request: NextRequest) {
  const unauthorized = await requireApiSession();
  if (unauthorized) return unauthorized;

  try {
    const { ids } = await request.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "No items selected" }, { status: 400 });
    }

    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;
    if (!n8nWebhookUrl) {
      return NextResponse.json(
        { error: "Email service not configured" },
        { status: 500 }
      );
    }

    const items = await getEmailQueueByIds(ids.map((id) => Number(id)));

    const results = {
      success: 0,
      failed: 0,
      errors: [] as Array<{ id: number; error: string }>,
    };

    // Send each email
    for (const item of items) {
      try {
        // Update status to sending
        await updateEmailQueueStatus({ id: item.id, status: "sending" });

        // Send to n8n webhook with the database ID
        // Prepare payload matching n8n code format
        const payload: CertificateWebhookPayload = {
          id: item.id, // Include database ID for n8n to call back
          recipient_email: item.recipientEmail,
          recipient_name: item.recipientName,
          certificate_image: item.certificateImage,
          subject: item.subject,
          message: item.message,
          timestamp: new Date().toISOString(),
        };

        // For UMak preset, add branding fields (n8n will use these for custom HTML)
        if (item.subject === "Your e-certificate is now ready") {
          payload.email_header_title = "Certificate of Achievement";
          payload.email_header_subtitle = "University of Makati";
          payload.email_footer_company = "UNIVERSITY OF MAKATI";
          payload.email_footer_dept =
            "College of Computing and Information Sciences";
          payload.email_sender_name = "University of Makati";
          // UMak Official Colors in HSLA format
          payload.primary_color = "hsla(58, 100%, 47%, 1)"; // UMak Yellow #F0E900
          payload.secondary_color = "hsla(232, 63%, 32%, 1)"; // UMak Dark Blue #1D2981
          payload.accent_color = "hsla(201, 69%, 52%, 1)"; // UMak Sky Blue #2A9EDE
          payload.highlight_color = "hsla(352, 99%, 44%, 1)"; // UMak Bright Red #DF0020
        }

        const response = await fetch(n8nWebhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          // Webhook accepted - update to sent immediately
          await updateEmailQueueStatus({ id: item.id, status: "sent", sentAt: new Date().toISOString() });
          results.success++;
        } else {
          const errorText = await response.text();
          // If webhook itself fails, mark as failed immediately
          await updateEmailQueueStatus({ id: item.id, status: "failed", errorMessage: `Webhook error: ${errorText}` });
          results.failed++;
          results.errors.push({ id: item.id, error: errorText });
        }
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : "Unknown error";
        // If network error, mark as failed immediately
        await updateEmailQueueStatus({ id: item.id, status: "failed", errorMessage: `Network error: ${errorMsg}` });
        results.failed++;
        results.errors.push({ id: item.id, error: errorMsg });
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: `Sent ${results.success}/${items.length} emails`,
        results,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Batch send error:", error);
    return NextResponse.json(
      { error: "Failed to send emails" },
      { status: 500 }
    );
  }
}
