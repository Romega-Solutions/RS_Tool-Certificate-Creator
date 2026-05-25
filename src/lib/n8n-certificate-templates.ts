const N8N_TIMEOUT_MS = 10_000;
const N8N_ROW_LIMIT = 250;
const TEMPLATE_LIMIT = 20;

type FetchLike = typeof fetch;

export type CertificateTemplateAsset = {
  filename: string;
  contentType: string;
  bytes: Buffer;
  size: number;
  rowId?: number | string;
};

type TemplateRow = {
  id?: number | string;
  filename?: unknown;
  contentType?: unknown;
  dataBase64?: unknown;
  size?: unknown;
};

function n8nTemplateConfig() {
  const url = cleanEnvValue(process.env.N8N_URL).replace(/\/+$/, "");
  const apiKey = cleanEnvValue(process.env.N8N_API_KEY);
  const tableId = cleanEnvValue(process.env.N8N_CERTIFICATE_TEMPLATE_TABLE_ID);

  if (!url || !apiKey || !tableId) return null;

  return { url, apiKey, tableId };
}

function cleanEnvValue(value?: string) {
  return (value ?? "").replace(/\\r|\\n/g, "").trim();
}

export function isN8nCertificateTemplateStorageConfigured() {
  return Boolean(n8nTemplateConfig());
}

function filenameFilter(filename: string) {
  return {
    type: "and",
    filters: [{ columnName: "filename", condition: "eq", value: filename }],
  };
}

function parseRows(payload: unknown): TemplateRow[] {
  if (Array.isArray(payload)) return payload as TemplateRow[];
  if (
    payload &&
    typeof payload === "object" &&
    "data" in payload &&
    Array.isArray((payload as { data?: unknown }).data)
  ) {
    return (payload as { data: TemplateRow[] }).data;
  }

  return [];
}

function rowFilename(row: TemplateRow) {
  return typeof row.filename === "string" ? row.filename : "";
}

function rowToAsset(row: TemplateRow): CertificateTemplateAsset | null {
  const filename = rowFilename(row);
  const dataBase64 = typeof row.dataBase64 === "string" ? row.dataBase64 : "";
  if (!filename || !dataBase64) return null;

  const bytes = Buffer.from(dataBase64, "base64");
  return {
    filename,
    contentType: typeof row.contentType === "string" && row.contentType ? row.contentType : "image/png",
    bytes,
    size: Number(row.size) || bytes.length,
    rowId: row.id,
  };
}

async function n8nFetchJson(path: string, init: RequestInit = {}, fetchImpl: FetchLike = fetch) {
  const config = n8nTemplateConfig();
  if (!config) {
    throw new Error(
      "N8N_CERTIFICATE_TEMPLATE_TABLE_ID, N8N_URL, and N8N_API_KEY are required for n8n template storage.",
    );
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
      const body = await response.text().catch(() => "");
      throw new Error(`n8n template request ${path} failed with HTTP ${response.status}: ${body.slice(0, 500)}`);
    }

    return response.json();
  } finally {
    clearTimeout(timeout);
  }
}

export async function listN8nCertificateTemplates(fetchImpl?: FetchLike) {
  const payload = await n8nFetchJson(`/rows?limit=${N8N_ROW_LIMIT}`, undefined, fetchImpl);
  return parseRows(payload)
    .map(rowToAsset)
    .filter((asset): asset is CertificateTemplateAsset => Boolean(asset))
    .sort((a, b) => a.filename.localeCompare(b.filename, undefined, { numeric: true }));
}

export async function getN8nCertificateTemplate(filename: string, fetchImpl?: FetchLike) {
  const payload = await n8nFetchJson(
    `/rows?limit=${N8N_ROW_LIMIT}&search=${encodeURIComponent(filename)}`,
    undefined,
    fetchImpl,
  );
  return (
    parseRows(payload)
      .map(rowToAsset)
      .find((asset) => asset?.filename === filename) ?? null
  );
}

export async function nextN8nTemplateFilename(fetchImpl?: FetchLike, localFilenames: string[] = []) {
  const rows = await listN8nCertificateTemplates(fetchImpl);
  const used = new Set([...rows.map((row) => row.filename), ...localFilenames]);

  for (let i = 1; i <= TEMPLATE_LIMIT; i++) {
    const filename = `template${i}.png`;
    if (!used.has(filename)) return filename;
  }

  return null;
}

export async function saveN8nCertificateTemplate(
  input: { filename: string; contentType: string; bytes: Buffer },
  fetchImpl?: FetchLike,
) {
  const payload = await n8nFetchJson(
    "/rows",
    {
      method: "POST",
      body: JSON.stringify({
        data: [
          {
            filename: input.filename,
            contentType: input.contentType,
            dataBase64: input.bytes.toString("base64"),
            size: String(input.bytes.length),
          },
        ],
        returnType: "all",
      }),
    },
    fetchImpl,
  );
  const [row] = parseRows(payload);
  const asset = rowToAsset(row);
  if (!asset) throw new Error("n8n did not return saved certificate template.");
  return asset;
}

export async function deleteN8nCertificateTemplate(filename: string, fetchImpl?: FetchLike) {
  await n8nFetchJson(
    "/rows/delete",
    {
      method: "DELETE",
      body: JSON.stringify({
        filter: filenameFilter(filename),
        returnData: "true",
      }),
    },
    fetchImpl,
  );
}
