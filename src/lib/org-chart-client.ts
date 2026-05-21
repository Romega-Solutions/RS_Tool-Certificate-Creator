export interface StaffProfile {
  id?: string | number;
  name?: string;
  fullName?: string;
  preferredName?: string;
  email?: string;
  department?: string;
  title?: string;
  role?: string;
  [key: string]: unknown;
}

export type StaffDirectoryResult =
  | {
      ok: true;
      enabled: true;
      people: StaffProfile[];
    }
  | {
      ok: false;
      enabled: false;
      reason: "missing-config";
      people: [];
    }
  | {
      ok: false;
      enabled: true;
      reason: "unavailable";
      status?: number;
      people: [];
    };

export async function fetchOrgChartPeople(): Promise<StaffDirectoryResult> {
  const baseUrl = process.env.ORG_CHART_BASE_URL?.trim();
  const apiKey = process.env.ORG_CHART_API_KEY?.trim();

  if (!baseUrl || !apiKey) {
    return {
      ok: false,
      enabled: false,
      reason: "missing-config",
      people: [],
    };
  }

  try {
    const response = await fetch(
      `${baseUrl.replace(/\/+$/, "")}/api/people/headless?includeInactive=false`,
      {
        headers: {
          "x-api-key": apiKey,
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      return {
        ok: false,
        enabled: true,
        reason: "unavailable",
        status: response.status,
        people: [],
      };
    }

    const payload: unknown = await response.json();
    const people =
      payload &&
      typeof payload === "object" &&
      "people" in payload &&
      Array.isArray(payload.people)
        ? payload.people
        : [];

    return {
      ok: true,
      enabled: true,
      people: people as StaffProfile[],
    };
  } catch {
    return {
      ok: false,
      enabled: true,
      reason: "unavailable",
      people: [],
    };
  }
}
