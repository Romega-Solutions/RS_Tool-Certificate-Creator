"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import ProtectedRoute from "@/components/auth/protected-route";
import { ArrowLeft, Upload, Trash2, Download, Eye } from "lucide-react";
import Image from "next/image";

interface Template {
  id: number;
  name: string;
  path: string;
  thumbnail: string;
}

function TemplatesContent() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Load templates on mount
  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    const foundTemplates: Template[] = [];
    let templateIndex = 1;

    // Check for templates (template1.png through template20.png)
    while (templateIndex <= 20) {
      const templatePath = `/certificates/template${templateIndex}.png`;

      try {
        const response = await fetch(templatePath, { method: "HEAD" });
        if (response.ok) {
          foundTemplates.push({
            id: templateIndex,
            name: `Template ${templateIndex}`,
            path: templatePath,
            thumbnail: templatePath,
          });
        } else {
          break; // Stop if template doesn't exist
        }
      } catch {
        break; // Stop on error
      }

      templateIndex++;
    }

    setTemplates(foundTemplates);
  };

  const handleUploadTemplate = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    await uploadFile(file);

    // Reset file input
    event.target.value = "";
  };

  const uploadFile = async (file: File) => {
    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file (PNG, JPG, etc.)");
      return;
    }

    setIsUploading(true);

    try {
      // Create FormData to upload
      const formData = new FormData();
      formData.append("template", file);

      // Upload to server
      const response = await fetch("/api/templates/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to upload template");
      }

      const result = await response.json();

      // Reload templates
      await loadTemplates();

      alert(`Template uploaded successfully as ${result.filename}`);
    } catch (error) {
      console.error("Upload error:", error);
      alert(
        error instanceof Error ? error.message : "Failed to upload template"
      );
    } finally {
      setIsUploading(false);
    }
  };

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    // Only set dragging to false if we're leaving the main container
    if (e.currentTarget === e.target) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter((file) => file.type.startsWith("image/"));

    if (imageFiles.length === 0) {
      alert("Please drop image files only (PNG, JPG, etc.)");
      return;
    }

    // Upload first image file
    if (imageFiles.length > 1) {
      alert(
        "Only one template can be uploaded at a time. Uploading the first file..."
      );
    }

    await uploadFile(imageFiles[0]);
  };

  const handleDeleteTemplate = async (template: Template) => {
    if (
      !confirm(
        `Are you sure you want to delete ${template.name}? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(
        `/api/templates/delete?filename=template${template.id}.png`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete template");
      }

      // Reload templates
      await loadTemplates();

      alert("Template deleted successfully");
    } catch (error) {
      console.error("Delete error:", error);
      alert(
        error instanceof Error ? error.message : "Failed to delete template"
      );
    }
  };

  const handleUseTemplate = (template: Template) => {
    // Navigate to generator with template
    router.push(`/generator?template=${template.id}`);
  };

  return (
    <div
      className="min-h-screen bg-gray-50 dark:bg-zinc-900"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Drag Overlay */}
      {isDragging && (
        <div className="fixed inset-0 z-50 bg-blue-500/20 backdrop-blur-sm flex items-center justify-center pointer-events-none">
          <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-2xl p-8 border-4 border-dashed border-blue-500 max-w-md">
            <div className="text-center">
              <Upload className="w-16 h-16 text-blue-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
                Drop Template Here
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Release to upload your certificate template
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white dark:bg-zinc-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/dashboard")}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
              <h1 className="text-2xl font-bold">Certificate Templates</h1>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="file"
                id="template-upload"
                accept="image/*"
                onChange={handleUploadTemplate}
                className="hidden"
              />
              <Button
                onClick={() =>
                  document.getElementById("template-upload")?.click()
                }
                disabled={isUploading}
                className="bg-green-600 hover:bg-green-700"
              >
                <Upload className="w-4 h-4 mr-2" />
                {isUploading ? "Uploading..." : "Upload Template"}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Info Banner */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
          <h3 className="font-semibold mb-2 text-blue-900 dark:text-blue-100">
            💡 Template Guidelines
          </h3>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>• Drag and drop image files anywhere on this page to upload</li>
            <li>• Upload PNG or JPG images for best quality</li>
            <li>• Recommended size: 1920x1080px or higher for print quality</li>
            <li>
              • Templates are automatically numbered (template1.png,
              template2.png, etc.)
            </li>
            <li>• You can have up to 20 templates</li>
          </ul>
        </div>

        {/* Templates Grid */}
        {templates.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-200 dark:bg-zinc-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Upload className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No Templates Yet</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Upload your first certificate template to get started
            </p>
            <Button
              onClick={() =>
                document.getElementById("template-upload")?.click()
              }
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Template
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {templates.map((template) => (
              <div
                key={template.id}
                className="bg-white dark:bg-zinc-800 rounded-lg shadow hover:shadow-xl transition-all overflow-hidden border border-transparent hover:border-blue-200 dark:hover:border-blue-800"
              >
                {/* Template Preview */}
                <div className="relative aspect-video bg-gray-100 dark:bg-zinc-700">
                  <Image
                    src={template.thumbnail}
                    alt={template.name}
                    fill
                    className="object-contain"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                </div>

                {/* Template Info */}
                <div className="p-4">
                  <h3 className="font-semibold mb-3">{template.name}</h3>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={() => handleUseTemplate(template)}
                      className="w-full"
                      size="sm"
                    >
                      Use Template
                    </Button>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => setPreviewTemplate(template)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Preview
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => window.open(template.path, "_blank")}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteTemplate(template)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 dark:hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Preview Modal */}
      {previewTemplate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setPreviewTemplate(null)}
        >
          <div
            className="relative max-w-5xl w-full bg-white dark:bg-zinc-900 rounded-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-200 dark:border-zinc-700 flex items-center justify-between">
              <h3 className="font-semibold">{previewTemplate.name}</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPreviewTemplate(null)}
              >
                Close
              </Button>
            </div>
            <div className="relative aspect-video bg-gray-100 dark:bg-zinc-800">
              <Image
                src={previewTemplate.thumbnail}
                alt={previewTemplate.name}
                fill
                className="object-contain"
                sizes="90vw"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TemplatesPage() {
  return (
    <ProtectedRoute>
      <TemplatesContent />
    </ProtectedRoute>
  );
}
