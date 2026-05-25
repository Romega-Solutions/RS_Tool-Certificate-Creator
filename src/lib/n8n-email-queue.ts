const N8N_TIMEOUT_MS = 10_000;

export type EmailStatus = "pending" | "sending" | "sent" | "failed";

export type EmailQueueItem = {
  id: number;
  recipientEmail: string;
  recipientName: string;
  subject: string;
  message: string;
  certificateImage: string;
  status: EmailStatus;
  errorMessage: string | null;
  createdAt: string;
  sentAt: string | null;
};

export type EmailQueueStats = {
  total: number;
  pending: number;
  sent: number;
  failed: number;
};

type QueueRow = {
  id?: number | string;
  recipientEmail?: unknown;
  recipientName?: unknown;
  subject?: unknown;
  message?: unknown;
  certificateImage?: unknown;
  status?: unknown;
  errorMessage?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
  sentAt?: unknown;
};

type FetchLike = typeof fetch;

function n8nQueueConfig() {
  const url = cleanEnvValue(process.env.N8N_URL).replace(/\/+$/, "");
  const apiKey = cleanEnvValue(process.env.N8N_API_KEY);
  const tableId = cleanEnvValue(process.env.N8N_CERTIFICATE_QUEUE_TABLE_ID);

  if (!url || !apiKey || !tableId) return null;

  return { url, apiKey, tableId };
}

function cleanEnvValue(value?: string) {
  return (value ?? "").replace(/\\r|\\n/g, "").trim();
}

export function isN8nEmailQueueConfigured() {
  return Boolean(n8nQueueConfig());
}

function idFilter(id: number) {
  return {
    type: "and",
    filters: [{ columnName: "id", condition: "eq", value: id }],
  };
}

function stringOrEmpty(value: unknown) {
  return typeof value === "string" ? value : "";
}

function nullableString(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function toEmailQueueItem(row: QueueRow): EmailQueueItem {
  const now = new Date().toISOString();
  const id = typeof row.id === "number" ? row.id : Number(row.id);
  const status = stringOrEmpty(row.status) as EmailStatus;

  return {
    id,
    recipientEmail: stringOrEmpty(row.recipientEmail),
    recipientName: stringOrEmpty(row.recipientName),
    subject: stringOrEmpty(row.subject),
    message: stringOrEmpty(row.message),
    certificateImage: stringOrEmpty(row.certificateImage),
    status: status || "pending",
    errorMessage: nullableString(row.errorMessage),
    createdAt: stringOrEmpty(row.createdAt) || stringOrEmpty(row.updatedAt) || now,
    sentAt: nullableString(row.sentAt),
  };
}

function parseRows(payload: unknown): QueueRow[] {
  if (Array.isArray(payload)) return payload as QueueRow[];
  if (
    payload &&
    typeof payload === "object" &&
    "data" in payload &&
    Array.isArray((payload as { data?: unknown }).data)
  ) {
    return (payload as { data: QueueRow[] }).data;
  }

  return [];
}

async function n8nFetchJson(path: string, init: RequestInit = {}, fetchImpl: FetchLike = fetch) {
  const config = n8nQueueConfig();
  if (!config) {
    throw new Error("N8N_CERTIFICATE_QUEUE_TABLE_ID, N8N_URL, and N8N_API_KEY are required for n8n queue storage.");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), N8N_TIMEOUT_MS);

  try {
    const response = await fetchImpl(`${config.url}/api/v1/data-tables/${config.tableId}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-N8N-API-KEY": config.apiKey,
        ...(init.headers ?? {}),
      },
      signal: controller.signal,
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`n8n queue request failed with HTTP ${response.status}`);
    }

    return response.json();
  } finally {
    clearTimeout(timeout);
  }
}

function sortAndFilterRows(
  rows: EmailQueueItem[],
  filters?: { status?: string; search?: string; dateFrom?: string; dateTo?: string },
) {
  const search = filters?.search?.toLowerCase();

  return rows
    .filter((item) => !filters?.status || item.status === filters.status)
    .filter((item) => {
      if (!search) return true;
      return [item.recipientEmail, item.recipientName, item.subject]
        .some((value) => value.toLowerCase().includes(search));
    })
    .filter((item) => !filters?.dateFrom || item.createdAt >= filters.dateFrom)
    .filter((item) => !filters?.dateTo || item.createdAt <= filters.dateTo)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function insertN8nEmailQueue(
  data: {
    recipientEmail: string;
    recipientName: string;
    subject: string;
    message: string;
    certificateImage: string;
  },
  fetchImpl?: FetchLike,
): Promise<EmailQueueItem> {
  const payload = await n8nFetchJson(
    "/rows",
    {
      method: "POST",
      body: JSON.stringify({
        data: [
          {
            ...data,
            status: "pending",
            errorMessage: "",
            sentAt: "",
          },
        ],
        returnType: "all",
      }),
    },
    fetchImpl,
  );
  const [row] = parseRows(payload);
  if (!row) throw new Error("n8n did not return inserted queue row.");
  return toEmailQueueItem(row);
}

export async function getN8nEmailQueue(
  filters?: { status?: string; search?: string; dateFrom?: string; dateTo?: string },
  fetchImpl?: FetchLike,
): Promise<EmailQueueItem[]> {
  const payload = await n8nFetchJson("/rows?limit=1000", undefined, fetchImpl);
  return sortAndFilterRows(parseRows(payload).map(toEmailQueueItem), filters);
}

export async function getN8nEmailQueueItemsByIds(ids: number[], fetchImpl?: FetchLike): Promise<EmailQueueItem[]> {
  const idSet = new Set(ids);
  const items = await getN8nEmailQueue(undefined, fetchImpl);
  return items.filter((item) => idSet.has(item.id));
}

export async function updateN8nEmailQueueStatus(
  data: { id: number; status: string; errorMessage?: string | null; sentAt?: string | null },
  fetchImpl?: FetchLike,
): Promise<EmailQueueItem> {
  const payload = await n8nFetchJson(
    "/rows/update",
    {
      method: "PATCH",
      body: JSON.stringify({
        filter: idFilter(data.id),
        data: {
          status: data.status,
          errorMessage: data.errorMessage || "",
          sentAt: data.sentAt || "",
        },
        returnData: true,
      }),
    },
    fetchImpl,
  );
  const [row] = parseRows(payload);
  if (!row) throw new Error(`n8n did not return updated queue row ${data.id}.`);
  return toEmailQueueItem(row);
}

export async function deleteN8nEmailQueue(id: number, fetchImpl?: FetchLike): Promise<void> {
  await n8nFetchJson(
    "/rows/delete",
    {
      method: "DELETE",
      body: JSON.stringify({
        filter: idFilter(id),
        returnData: "true",
      }),
    },
    fetchImpl,
  );
}

export async function getN8nEmailQueueStats(fetchImpl?: FetchLike): Promise<EmailQueueStats> {
  const items = await getN8nEmailQueue(undefined, fetchImpl);

  return {
    total: items.length,
    pending: items.filter((item) => item.status === "pending").length,
    sent: items.filter((item) => item.status === "sent").length,
    failed: items.filter((item) => item.status === "failed").length,
  };
}
