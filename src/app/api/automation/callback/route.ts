import { NextRequest, NextResponse } from "next/server";
import { updateEmailQueueStatus } from "@/lib/db";
import { requireAutomationCallbackAuth } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

const allowedEvents = new Set(["certificate.delivery.status_updated"]);
const allowedStatuses = new Set(["queued", "sent", "failed", "pending"]);

type CallbackBody = {
  event?: unknown;
  requestId?: unknown;
  occurredAt?: unknown;
  data?: {
    emailQueueId?: unknown;
    status?: unknown;
    errorMessage?: unknown;
    sentAt?: unknown;
    providerMessageId?: unknown;
  };
};

export async function POST(request: NextRequest) {
  const unauthorized = await requireAutomationCallbackAuth(request);
  if (unauthorized) return unauthorized;

  let body: CallbackBody;

  try {
    body = (await request.json()) as CallbackBody;
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON" }, { status: 400 });
  }

  if (typeof body.event !== "string" || !allowedEvents.has(body.event)) {
    return NextResponse.json(
      { error: "Invalid event", allowedEvents: Array.from(allowedEvents) },
      { status: 400 }
    );
  }

  const status = body.data?.status;
  if (typeof status !== "string" || !allowedStatuses.has(status)) {
    return NextResponse.json(
      { error: "Invalid status", allowedStatuses: Array.from(allowedStatuses) },
      { status: 400 }
    );
  }

  const emailQueueId = body.data?.emailQueueId;
  let queueUpdate = null;

  if (typeof emailQueueId === "number") {
    queueUpdate = await updateEmailQueueStatus({
      id: emailQueueId,
      status,
      errorMessage: typeof body.data?.errorMessage === "string" ? body.data.errorMessage : null,
      sentAt:
        typeof body.data?.sentAt === "string"
          ? body.data.sentAt
          : status === "sent"
            ? new Date().toISOString()
            : null,
    });
  }

  return NextResponse.json(
    {
      ok: true,
      service: "certificate-creator",
      event: body.event,
      requestId: typeof body.requestId === "string" ? body.requestId : null,
      acceptedStatus: status,
      queueUpdated: Boolean(queueUpdate),
      queueUpdate,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}
