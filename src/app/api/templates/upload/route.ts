import { NextRequest, NextResponse } from "next/server";
import { writeFile, readdir } from "fs/promises";
import path from "path";
import fs from "fs";
import { requireApiSession } from "@/lib/server-auth";
import {
  isN8nCertificateTemplateStorageConfigured,
  nextN8nTemplateFilename,
  saveN8nCertificateTemplate,
} from "@/lib/n8n-certificate-templates";

async function localTemplateFilenames(certificatesDir: string) {
  if (!fs.existsSync(certificatesDir)) return [];

  const existingFiles = await readdir(certificatesDir);
  return existingFiles.filter((file) => file.match(/^template\d+\.png$/));
}

function nextLocalTemplateFilename(existingFiles: string[]) {
  const templateNumbers = existingFiles
    .map((file) => {
      const match = file.match(/^template(\d+)\.png$/);
      return match ? parseInt(match[1]) : 0;
    })
    .sort((a, b) => a - b);

  let nextNumber = 1;
  for (const num of templateNumbers) {
    if (num === nextNumber) {
      nextNumber++;
    } else {
      break;
    }
  }

  return nextNumber > 20 ? null : `template${nextNumber}.png`;
}

export async function POST(request: NextRequest) {
  const unauthorized = await requireApiSession();
  if (unauthorized) return unauthorized;

  try {
    const formData = await request.formData();
    const file = formData.get("template") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "File must be an image" },
        { status: 400 }
      );
    }

    const certificatesDir = path.join(process.cwd(), "public", "certificates");
    const localFilenames = await localTemplateFilenames(certificatesDir);

    const filename = isN8nCertificateTemplateStorageConfigured()
      ? await nextN8nTemplateFilename(undefined, localFilenames)
      : nextLocalTemplateFilename(localFilenames);

    if (!filename) {
      return NextResponse.json(
        { error: "Maximum number of templates (20) reached" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    if (isN8nCertificateTemplateStorageConfigured()) {
      await saveN8nCertificateTemplate({
        filename,
        contentType: file.type || "image/png",
        bytes: buffer,
      });
    } else {
      if (!fs.existsSync(certificatesDir)) {
        fs.mkdirSync(certificatesDir, { recursive: true });
      }
      await writeFile(path.join(certificatesDir, filename), buffer);
    }

    const match = filename.match(/^template(\d+)\.png$/);
    const templateNumber = match ? parseInt(match[1], 10) : null;

    return NextResponse.json(
      {
        success: true,
        message: "Template uploaded successfully",
        filename,
        templateNumber,
        storage: isN8nCertificateTemplateStorageConfigured() ? "n8n_data_table" : "local_filesystem",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload template" },
      { status: 500 }
    );
  }
}
