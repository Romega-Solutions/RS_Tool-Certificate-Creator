import { NextRequest, NextResponse } from "next/server";
import { unlink } from "fs/promises";
import path from "path";
import fs from "fs";
import { deleteN8nCertificateTemplate, isN8nCertificateTemplateStorageConfigured } from "@/lib/n8n-certificate-templates";
import { requireApiSession } from "@/lib/server-auth";

export async function DELETE(request: NextRequest) {
  const unauthorized = await requireApiSession();
  if (unauthorized) return unauthorized;

  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get("filename");

    if (!filename) {
      return NextResponse.json(
        { error: "Filename is required" },
        { status: 400 }
      );
    }

    // Validate filename format (must be templateX.png)
    if (!filename.match(/^template\d+\.png$/)) {
      return NextResponse.json(
        { error: "Invalid filename format" },
        { status: 400 }
      );
    }

    if (isN8nCertificateTemplateStorageConfigured()) {
      await deleteN8nCertificateTemplate(filename);
    } else {
      const filepath = path.join(
        process.cwd(),
        "public",
        "certificates",
        filename
      );

      if (!fs.existsSync(filepath)) {
        return NextResponse.json(
          { error: "Template not found" },
          { status: 404 }
        );
      }

      await unlink(filepath);
    }

    return NextResponse.json(
      {
        success: true,
        message: "Template deleted successfully",
        storage: isN8nCertificateTemplateStorageConfigured() ? "n8n_data_table" : "local_filesystem",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete template" },
      { status: 500 }
    );
  }
}
