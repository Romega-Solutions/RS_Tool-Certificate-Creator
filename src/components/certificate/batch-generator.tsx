// src/components/certificate/batch-generator.tsx
"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Upload,
  Download,
  FileJson,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Mail,
  X,
} from "lucide-react";
import {
  BatchRecipient,
  BatchProgress,
  BATCH_JSON_EXAMPLE,
} from "@/types/batch";
import {
  BatchCertificateGenerator,
  parseRecipientsFile,
} from "@/lib/batch-generator";
import {
  TextElement,
  ImageElement,
  CertificateTemplate,
} from "@/types/certificates";

interface BatchGeneratorProps {
  template: CertificateTemplate | null;
  textElements: TextElement[];
  imageElements: ImageElement[];
}

export default function BatchGenerator({
  template,
  textElements,
  imageElements,
}: BatchGeneratorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [recipients, setRecipients] = useState<BatchRecipient[]>([]);
  const [selectedRecipients, setSelectedRecipients] = useState<Set<number>>(
    new Set()
  );
  const [progress, setProgress] = useState<BatchProgress>({
    total: 0,
    current: 0,
    status: "idle",
  });
  const [error, setError] = useState<string | null>(null);

  // Email Dialog States
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [emailSubject, setEmailSubject] = useState(
    "Your Certificate of Completion"
  );
  const [emailMessage, setEmailMessage] = useState(
    `Dear {{name}},\n\nCongratulations! Please find your Certificate of Completion attached.\n\nBest regards,\nRomega Solutions`
  );

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    try {
      const parsedRecipients = await parseRecipientsFile(file);
      setRecipients(parsedRecipients);
      // Auto-select all recipients when file is uploaded
      setSelectedRecipients(new Set(parsedRecipients.map((_, idx) => idx)));

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse file");
      setRecipients([]);
      setSelectedRecipients(new Set());
    }
  };

  const handleGenerate = async () => {
    if (!template || selectedRecipients.size === 0) return;

    setError(null);
    setShowEmailDialog(false); // Close dialog
    const generator = new BatchCertificateGenerator();

    // Get only selected recipients
    const recipientsToQueue = recipients.filter((_, idx) =>
      selectedRecipients.has(idx)
    );

    try {
      await generator.generateBatch(
        recipientsToQueue,
        template,
        textElements,
        imageElements,
        setProgress,
        emailSubject,
        emailMessage
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate certificates"
      );
      setProgress((prev) => ({ ...prev, status: "error" }));
    }
  };

  const handleOpenEmailDialog = () => {
    if (!template || selectedRecipients.size === 0) return;
    setShowEmailDialog(true);
  };

  const emailTemplates = {
    event: {
      label: "Event Certification",
      subject: "Certificate of Attendance",
      message: `Dear {{name}},\n\nThank you for attending our event. Please find your Certificate of Attendance attached. We appreciate your participation!\n\nBest regards,\nRomega Solutions`,
    },
    kpi: {
      label: "KPI Certification",
      subject: "KPI Achievement Certificate",
      message: `Dear {{name}},\n\nCongratulations on achieving your KPI milestones. Please find your KPI Achievement Certificate attached as recognition of your performance.\n\nBest regards,\nRomega Solutions`,
    },
    internship: {
      label: "Internship Completion",
      subject: "Certificate of Completion - Internship",
      message: `Dear {{name}},\n\nCongratulations on completing your internship. Please find your Certificate of Completion attached. Wishing you continued success in your career.\n\nBest regards,\nRomega Solutions`,
    },
    umak: {
      label: "UMak Event",
      subject: "Your e-certificate is now ready",
      message: `Dear {{name}},\n\nI hope this email finds you well. On behalf of the University of Makati, we are pleased to inform you that your e-certificate is now ready. We sincerely appreciate your enthusiasm, time, and effort in the previously conducted event.\n\nThank you once again for your active participation. As a token of appreciation, attached here is your e-certificate.\n\nIf you have any questions or concerns, please feel free to reply in this email thread.\n\nWarm regards,\nUniversity of Makati\n{{title}}\n\nThis message contains confidential information and is intended only for the individual named. If you are not the named addressee you should not disseminate, distribute or copy this e-mail. Please notify the sender immediately by e-mail if you have received this e-mail by mistake and delete this e-mail from your system. E-mail transmission cannot be guaranteed to be secure or error-free as information could be intercepted, corrupted, lost, destroyed, arrive late or incomplete, or contain viruses. The sender therefore does not accept liability for any errors or omissions in the contents of this message, which arise as a result of e-mail transmission.`,
    },
  };

  const applyEmailTemplate = (key: "event" | "kpi" | "internship" | "umak") => {
    const t = emailTemplates[key];
    setEmailSubject(t.subject);
    setEmailMessage(t.message);
  };

  const toggleRecipient = (index: number) => {
    const newSelected = new Set(selectedRecipients);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedRecipients(newSelected);
  };

  const toggleAllRecipients = () => {
    if (selectedRecipients.size === recipients.length) {
      setSelectedRecipients(new Set());
    } else {
      setSelectedRecipients(new Set(recipients.map((_, idx) => idx)));
    }
  };

  const downloadExample = () => {
    const blob = new Blob([JSON.stringify(BATCH_JSON_EXAMPLE, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "batch-example.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  const canGenerate =
    template && selectedRecipients.size > 0 && progress.status !== "processing";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header */}
      <div>
        <h3
          style={{
            fontSize: "1.125rem",
            fontWeight: 600,
            marginBottom: "0.5rem",
          }}
        >
          Batch Certificate Generation
        </h3>
        <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>
          Upload a JSON file with recipient data to generate multiple
          certificates at once
        </p>
      </div>

      {/* Instructions */}
      <div
        style={{
          backgroundColor: "#eff6ff",
          border: "1px solid #bfdbfe",
          borderRadius: "0.5rem",
          padding: "1rem",
        }}
      >
        <h4
          style={{
            fontSize: "0.875rem",
            fontWeight: 600,
            marginBottom: "0.75rem",
            color: "#1e40af",
          }}
        >
          📝 How to use:
        </h4>
        <ol
          style={{
            fontSize: "0.75rem",
            color: "#1e40af",
            marginLeft: "1.25rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.25rem",
          }}
        >
          <li>
            Add text with placeholders like{" "}
            <code
              style={{
                backgroundColor: "#dbeafe",
                padding: "0.125rem 0.25rem",
                borderRadius: "0.25rem",
              }}
            >
              {"{{name}}"}
            </code>
            ,{" "}
            <code
              style={{
                backgroundColor: "#dbeafe",
                padding: "0.125rem 0.25rem",
                borderRadius: "0.25rem",
              }}
            >
              {"{{email}}"}
            </code>
          </li>
          <li>
            Upload a JSON file with recipient data (including email addresses)
          </li>
          <li>
            Select which recipients to queue (all are selected by default)
          </li>
          <li>
            Click &quot;Queue Selected Certificates&quot; to add them to the email queue
          </li>
          <li>Go to Email Queue page to review and send them</li>
        </ol>
      </div>

      {/* Example Download */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          padding: "0.75rem",
          backgroundColor: "#f9fafb",
          borderRadius: "0.5rem",
        }}
      >
        <FileJson style={{ width: "20px", height: "20px", color: "#6b7280" }} />
        <div style={{ flex: 1 }}>
          <p
            style={{
              fontSize: "0.875rem",
              fontWeight: 500,
              marginBottom: "0.125rem",
            }}
          >
            Need an example?
          </p>
          <p style={{ fontSize: "0.75rem", color: "#6b7280" }}>
            Download a sample JSON template
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={downloadExample}>
          <Download
            style={{ width: "16px", height: "16px", marginRight: "0.5rem" }}
          />
          Example
        </Button>
      </div>

      {/* File Upload */}
      <div>
        <label
          style={{
            display: "block",
            fontSize: "0.875rem",
            fontWeight: 600,
            marginBottom: "0.5rem",
          }}
        >
          Upload Recipients JSON
        </label>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileUpload}
          style={{ display: "none" }}
        />
        <Button
          onClick={() => fileInputRef.current?.click()}
          variant="outline"
          style={{ width: "100%" }}
        >
          <Upload
            style={{ width: "16px", height: "16px", marginRight: "0.5rem" }}
          />
          Choose JSON File
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <div
          style={{
            display: "flex",
            gap: "0.75rem",
            padding: "0.75rem",
            backgroundColor: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "0.5rem",
          }}
        >
          <AlertCircle
            style={{
              width: "20px",
              height: "20px",
              color: "#dc2626",
              flexShrink: 0,
            }}
          />
          <div>
            <p
              style={{
                fontSize: "0.875rem",
                fontWeight: 500,
                color: "#dc2626",
                marginBottom: "0.125rem",
              }}
            >
              Error
            </p>
            <p style={{ fontSize: "0.75rem", color: "#991b1b" }}>{error}</p>
          </div>
        </div>
      )}

      {/* Recipients Preview */}
      {recipients.length > 0 && (
        <div
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: "0.5rem",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "0.75rem 1rem",
              backgroundColor: "#f9fafb",
              borderBottom: "1px solid #e5e7eb",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div
              style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}
            >
              <input
                type="checkbox"
                checked={selectedRecipients.size === recipients.length}
                onChange={toggleAllRecipients}
                style={{
                  width: "16px",
                  height: "16px",
                  cursor: "pointer",
                  accentColor: "#3b82f6",
                }}
              />
              <span style={{ fontSize: "0.875rem", fontWeight: 600 }}>
                {selectedRecipients.size} / {recipients.length} Selected
              </span>
            </div>
            <CheckCircle2
              style={{ width: "18px", height: "18px", color: "#10b981" }}
            />
          </div>
          <div
            style={{
              maxHeight: "300px",
              overflowY: "auto",
              padding: "0.5rem",
            }}
          >
            {recipients.map((recipient, index) => {
              const isSelected = selectedRecipients.has(index);
              return (
                <div
                  key={index}
                  onClick={() => toggleRecipient(index)}
                  style={{
                    padding: "0.75rem",
                    fontSize: "0.75rem",
                    borderBottom:
                      index < recipients.length - 1
                        ? "1px solid #f3f4f6"
                        : "none",
                    cursor: "pointer",
                    backgroundColor: isSelected ? "#eff6ff" : "transparent",
                    transition: "background-color 0.2s",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    borderRadius: "0.25rem",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = "#f9fafb";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleRecipient(index)}
                    style={{
                      width: "16px",
                      height: "16px",
                      cursor: "pointer",
                      accentColor: "#3b82f6",
                      flexShrink: 0,
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        flexWrap: "wrap",
                      }}
                    >
                      <span
                        style={{
                          fontWeight: 600,
                          color: isSelected ? "#1e40af" : "#111827",
                        }}
                      >
                        {recipient.name}
                      </span>
                      <span style={{ color: "#6b7280" }}>
                        • {recipient.email}
                      </span>
                      {recipient.title && (
                        <span style={{ color: "#6b7280" }}>
                          • {recipient.title}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: "#fefce8",
              borderTop: "1px solid #fde047",
              fontSize: "0.75rem",
              color: "#854d0e",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <span>💡</span>
            <span>
              <strong>Tip:</strong> Click on any recipient to select/deselect
              them for queuing
            </span>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      {progress.status === "processing" && (
        <div
          style={{
            padding: "1rem",
            backgroundColor: "#f9fafb",
            borderRadius: "0.5rem",
            border: "1px solid #e5e7eb",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "0.5rem",
            }}
          >
            <span style={{ fontSize: "0.875rem", fontWeight: 500 }}>
              Queueing certificates...
            </span>
            <span style={{ fontSize: "0.875rem", color: "#6b7280" }}>
              {progress.current} / {progress.total}
            </span>
          </div>
          <div
            style={{
              width: "100%",
              height: "8px",
              backgroundColor: "#e5e7eb",
              borderRadius: "9999px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${(progress.current / progress.total) * 100}%`,
                height: "100%",
                backgroundColor: "#3b82f6",
                transition: "width 0.3s ease",
              }}
            />
          </div>
          {progress.currentName && (
            <p
              style={{
                fontSize: "0.75rem",
                color: "#6b7280",
                marginTop: "0.5rem",
              }}
            >
              Processing: {progress.currentName}
            </p>
          )}
        </div>
      )}

      {/* Success Message */}
      {progress.status === "complete" && (
        <div
          style={{
            display: "flex",
            gap: "0.75rem",
            padding: "0.75rem",
            backgroundColor: "#f0fdf4",
            border: "1px solid #bbf7d0",
            borderRadius: "0.5rem",
          }}
        >
          <CheckCircle2
            style={{
              width: "20px",
              height: "20px",
              color: "#16a34a",
              flexShrink: 0,
            }}
          />
          <div>
            <p
              style={{
                fontSize: "0.875rem",
                fontWeight: 500,
                color: "#16a34a",
                marginBottom: "0.125rem",
              }}
            >
              Success!
            </p>
            <p style={{ fontSize: "0.75rem", color: "#15803d" }}>
              {progress.total} certificate{progress.total > 1 ? "s" : ""} queued
              for sending! Check Email Queue to send them.
            </p>
          </div>
        </div>
      )}

      {/* Generate Button */}
      <Button
        onClick={handleOpenEmailDialog}
        disabled={!canGenerate}
        style={{ width: "100%" }}
        size="lg"
      >
        <Mail
          style={{ width: "18px", height: "18px", marginRight: "0.5rem" }}
        />
        Queue {selectedRecipients.size > 0 ? `${selectedRecipients.size} ` : ""}
        Selected Certificate{selectedRecipients.size !== 1 ? "s" : ""}
      </Button>

      {/* Placeholders Info */}
      <div
        style={{
          backgroundColor: "#fefce8",
          border: "1px solid #fde047",
          borderRadius: "0.5rem",
          padding: "0.75rem",
        }}
      >
        <p
          style={{
            fontSize: "0.75rem",
            color: "#854d0e",
            marginBottom: "0.5rem",
          }}
        >
          <strong>📌 Available Placeholders:</strong>
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "0.5rem",
            fontSize: "0.75rem",
            color: "#854d0e",
          }}
        >
          <code
            style={{
              backgroundColor: "#fef9c3",
              padding: "0.25rem 0.5rem",
              borderRadius: "0.25rem",
            }}
          >
            {"{{name}}"}
          </code>
          <code
            style={{
              backgroundColor: "#fef9c3",
              padding: "0.25rem 0.5rem",
              borderRadius: "0.25rem",
            }}
          >
            {"{{email}}"}
          </code>
          <code
            style={{
              backgroundColor: "#fef9c3",
              padding: "0.25rem 0.5rem",
              borderRadius: "0.25rem",
            }}
          >
            {"{{title}}"}
          </code>
          <code
            style={{
              backgroundColor: "#fef9c3",
              padding: "0.25rem 0.5rem",
              borderRadius: "0.25rem",
            }}
          >
            {"{{date}}"}
          </code>
        </div>
      </div>

      {/* Email Configuration Dialog */}
      {showEmailDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200 dark:border-zinc-700 shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Mail className="w-5 h-5 text-blue-600" />
                    Configure Email for {selectedRecipients.size} Certificate
                    {selectedRecipients.size > 1 ? "s" : ""}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Customize the email subject and message (use {`{{name}}`}{" "}
                    for recipient name)
                  </p>
                </div>
                <button
                  onClick={() => setShowEmailDialog(false)}
                  className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Email Subject <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  value={emailSubject}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEmailSubject(e.target.value)
                  }
                  placeholder="Your Certificate of Completion"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">
                  Email Presets
                </label>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    onClick={() => applyEmailTemplate("event")}
                    className="px-3 py-1 text-sm"
                  >
                    Event
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => applyEmailTemplate("kpi")}
                    className="px-3 py-1 text-sm"
                  >
                    KPI
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => applyEmailTemplate("internship")}
                    className="px-3 py-1 text-sm"
                  >
                    Internship
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => applyEmailTemplate("umak")}
                    className="px-3 py-1 text-sm"
                  >
                    UMak
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Choose a preset to auto-fill subject and message
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">
                  Email Message <span className="text-red-500">*</span>
                </label>
                <Textarea
                  value={emailMessage}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setEmailMessage(e.target.value)
                  }
                  rows={8}
                  className="resize-none font-mono text-sm"
                  placeholder={`Dear {{name}},\n\nCongratulations!...`}
                />
                <p className="text-xs text-gray-500 mt-1">
                  💡 Use {`{{name}}`}, {`{{email}}`}, {`{{title}}`},{" "}
                  {`{{date}}`} as placeholders
                </p>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  <strong>📧 Preview:</strong> {selectedRecipients.size} email
                  {selectedRecipients.size > 1 ? "s" : ""} will be queued with
                  customized content
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-zinc-700 flex justify-end gap-2 shrink-0 bg-white dark:bg-zinc-900">
              <Button
                variant="outline"
                onClick={() => setShowEmailDialog(false)}
                disabled={progress.status === "processing"}
              >
                Cancel
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={
                  progress.status === "processing" ||
                  !emailSubject.trim() ||
                  !emailMessage.trim()
                }
                className="bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {progress.status === "processing" ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Queueing {selectedRecipients.size} certificate
                    {selectedRecipients.size > 1 ? "s" : ""}...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Queue {selectedRecipients.size} Certificate
                    {selectedRecipients.size > 1 ? "s" : ""}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
