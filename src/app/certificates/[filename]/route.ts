import { readFile } from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { getN8nCertificateTemplate, isN8nCertificateTemplateStorageConfigured } from "@/lib/n8n-certificate-templates";

export const dynamic = "force-dynamic";

type Params = {
  params: Promise<{
    filename: string;
  }>;
};

function isTemplateFilename(filename: string) {
  return /^template\d+\.png$/.test(filename);
}

export async function GET(_request: NextRequest, context: Params) {
  const { filename } = await context.params;
  if (!isTemplateFilename(filename)) {
    return NextResponse.json({ error: "Invalid template filename" }, { status: 400 });
  }

  if (isN8nCertificateTemplateStorageConfigured()) {
    const asset = await getN8nCertificateTemplate(filename);
    if (asset) {
      return new NextResponse(new Uint8Array(asset.bytes), {
        status: 200,
        headers: {
          "Content-Type": asset.contentType,
          "Content-Length": String(asset.bytes.length),
          "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
        },
      });
    }
  }

  try {
    const file = await readFile(path.join(process.cwd(), "public", "certificates", filename));
    return new NextResponse(new Uint8Array(file), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Length": String(file.length),
        "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
      },
    });
  } catch {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }
}

export async function HEAD(request: NextRequest, context: Params) {
  const response = await GET(request, context);
  return new NextResponse(null, {
    status: response.status,
    headers: response.headers,
  });
}
