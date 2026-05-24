const N8N_TIMEOUT_MS = 8_000;

export type CertificateCallbackAuditInput = {
  event: string;
  requestId: string | null;
  status: string;
  receivedAt: string;
  emailQueueId: number | null;
  providerMessageId: string | null;
  errorMessage: string | null;
  raw: unknown;
};

function n8nAuditConfig() {
  const url = process.env.N8N_URL?.trim().replace(/\/+$/, "");
  const apiKey = process.env.N8N_API_KEY?.trim();
  const tableId = process.env.N8N_AUDIT_TABLE_ID?.trim();

  if (!url || !apiKey || !tableId) return null;

  return { url, apiKey, tableId };
}

function toN8nAuditRow(input: CertificateCallbackAuditInput) {
  return {
    eventId: `cert_cb_${Date.now()}_${input.requestId || "no_request"}`,
    tool: "certificate-creator",
    event: input.event,
    requestId: input.requestId || "",
    status: input.status,
    receivedAt: input.receivedAt,
    summary: input.emailQueueId ? `email_queue:${input.emailQueueId}` : input.providerMessageId || input.status,
    payload: JSON.stringify(input),
  };
}

export async function appendCertificateCallbackAudit(
  input: CertificateCallbackAuditInput,
): Promise<{ durable: boolean; storage: "n8n_data_table" | "none_configured" }> {
  const config = n8nAuditConfig();
  if (!config) {
    return { durable: false, storage: "none_configured" };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), N8N_TIMEOUT_MS);

  try {
    const response = await fetch(`${config.url}/api/v1/data-tables/${config.tableId}/rows`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-N8N-API-KEY": config.apiKey,
      },
      body: JSON.stringify({ data: [toN8nAuditRow(input)], returnType: "all" }),
      signal: controller.signal,
      cache: "no-store",
    });

    return {
      durable: response.ok,
      storage: response.ok ? "n8n_data_table" : "none_configured",
    };
  } catch {
    return { durable: false, storage: "none_configured" };
  } finally {
    clearTimeout(timeout);
  }
}
