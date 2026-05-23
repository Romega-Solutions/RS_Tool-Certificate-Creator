"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Mail, Loader2, Check, X } from "lucide-react";

interface EmailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  certificateImageUrl: string;
  recipientName: string;
}

type SendCertificatePayload = {
  email: string;
  subject: string;
  message: string;
  certificateImage: string;
  recipientName: string;
  email_header_title?: string;
  email_header_subtitle?: string;
  email_footer_company?: string;
  email_footer_dept?: string;
  email_sender_name?: string;
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  highlight_color?: string;
};

export default function EmailDialog({
  isOpen,
  onClose,
  certificateImageUrl,
  recipientName,
}: EmailDialogProps) {
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState(
    `Your Certificate of Completion - ${recipientName}`
  );
  const [message, setMessage] = useState(
    `Dear ${recipientName},\n\nCongratulations! Please find your Certificate of Completion attached.\n\nBest regards,\nRomega Solutions`
  );
  const [isSending, setIsSending] = useState(false);
  const [sendStatus, setSendStatus] = useState<"idle" | "success" | "error">(
    "idle"
  );
  const [errorMessage, setErrorMessage] = useState("");

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSend = async () => {
    if (!email.trim()) {
      setErrorMessage("Please enter an email address");
      return;
    }

    if (!validateEmail(email)) {
      setErrorMessage("Please enter a valid email address");
      return;
    }

    if (!subject.trim()) {
      setErrorMessage("Please enter a subject");
      return;
    }

    if (!message.trim()) {
      setErrorMessage("Please enter a message");
      return;
    }

    setIsSending(true);
    setSendStatus("idle");
    setErrorMessage("");

    try {
      // Prepare payload
      const payload: SendCertificatePayload = {
        email: email.trim(),
        subject: subject.trim(),
        message: message.trim(),
        certificateImage: certificateImageUrl,
        recipientName: recipientName,
      };

      // For UMak preset, add branding fields (n8n will use these for custom HTML)
      if (subject.trim() === "Your e-certificate is now ready") {
        payload.email_header_title = "Certificate of Achievement";
        payload.email_header_subtitle = "University of Makati";
        payload.email_footer_company = "UNIVERSITY OF MAKATI";
        payload.email_footer_dept =
          "College of Computing and Information Sciences";
        payload.email_sender_name = "University of Makati";
        // UMak Official Colors in HSLA format
        payload.primary_color = "hsla(58, 100%, 47%, 1)"; // UMak Yellow #F0E900
        payload.secondary_color = "hsla(232, 63%, 32%, 1)"; // UMak Dark Blue #1D2981
        payload.accent_color = "hsla(201, 69%, 52%, 1)"; // UMak Sky Blue #2A9EDE
        payload.highlight_color = "hsla(352, 99%, 44%, 1)"; // UMak Bright Red #DF0020
      }

      const response = await fetch("/api/send-certificate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        setSendStatus("success");
        setTimeout(() => {
          onClose();
          setEmail("");
          setSubject(`Your Certificate of Completion - ${recipientName}`);
          setMessage(
            `Dear ${recipientName},\n\nCongratulations! Please find your Certificate of Completion attached.\n\nBest regards,\nRomega Solutions`
          );
          setSendStatus("idle");
        }, 2000);
      } else {
        setSendStatus("error");
        setErrorMessage(data.error || "Failed to send certificate");
      }
    } catch (error) {
      console.error("Send error:", error);
      setSendStatus("error");
      setErrorMessage(
        error instanceof Error ? error.message : "Network error occurred"
      );
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-zinc-700 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-600" />
                Send Certificate via Email
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Enter the recipient&apos;s email address and customize your
                message
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={isSending}
              className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body - Scrollable */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Email Input */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              Recipient Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              placeholder="email@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrorMessage("");
              }}
              disabled={isSending}
              className="w-full px-3 py-2 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-800 dark:border-zinc-600"
            />
          </div>

          {/* Subject Input */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              Email Subject <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Your Certificate of Completion"
              value={subject}
              onChange={(e) => {
                setSubject(e.target.value);
                setErrorMessage("");
              }}
              disabled={isSending}
              className="w-full px-3 py-2 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-800 dark:border-zinc-600"
            />
          </div>

          {/* Email Presets */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              Email Presets
            </label>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                onClick={() => {
                  setSubject("Certificate of Attendance");
                  setMessage(
                    `Dear ${recipientName},\n\nThank you for attending our event. Please find your Certificate of Attendance attached. We appreciate your participation!\n\nBest regards,\nRomega Solutions`
                  );
                }}
                disabled={isSending}
                className="px-3 py-1 text-sm"
              >
                Event
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setSubject("KPI Achievement Certificate");
                  setMessage(
                    `Dear ${recipientName},\n\nCongratulations on achieving your KPI milestones. Please find your KPI Achievement Certificate attached as recognition of your performance.\n\nBest regards,\nRomega Solutions`
                  );
                }}
                disabled={isSending}
                className="px-3 py-1 text-sm"
              >
                KPI
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setSubject("Certificate of Completion - Internship");
                  setMessage(
                    `Dear ${recipientName},\n\nCongratulations on completing your internship. Please find your Certificate of Completion attached. Wishing you continued success in your career.\n\nBest regards,\nRomega Solutions`
                  );
                }}
                disabled={isSending}
                className="px-3 py-1 text-sm"
              >
                Internship
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setSubject("Your e-certificate is now ready");
                  setMessage(
                    `Dear ${recipientName},\n\nI hope this email finds you well. On behalf of the University of Makati, we are pleased to inform you that your e-certificate is now ready. We sincerely appreciate your enthusiasm, time, and effort in the previously conducted event.\n\nThank you once again for your active participation. As a token of appreciation, attached here is your e-certificate.\n\nIf you have any questions or concerns, please feel free to reply in this email thread.\n\nWarm regards,\nUniversity of Makati\n\nThis message contains confidential information and is intended only for the individual named. If you are not the named addressee you should not disseminate, distribute or copy this e-mail. Please notify the sender immediately by e-mail if you have received this e-mail by mistake and delete this e-mail from your system. E-mail transmission cannot be guaranteed to be secure or error-free as information could be intercepted, corrupted, lost, destroyed, arrive late or incomplete, or contain viruses. The sender therefore does not accept liability for any errors or omissions in the contents of this message, which arise as a result of e-mail transmission.`
                  );
                }}
                disabled={isSending}
                className="px-3 py-1 text-sm"
              >
                UMak
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Choose a preset to auto-fill subject and message
            </p>
          </div>

          {/* Message Input */}
          <div>
            <label className="block text-sm font-semibold mb-2">
              Email Message <span className="text-red-500">*</span>
            </label>
            <textarea
              placeholder="Enter your message..."
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                setErrorMessage("");
              }}
              disabled={isSending}
              rows={6}
              className="w-full px-3 py-2 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-800 dark:border-zinc-600 resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              💡 The certificate will be attached automatically
            </p>
          </div>

          {/* Status Messages */}
          {sendStatus === "success" && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800">
              <Check className="w-5 h-5 shrink-0" />
              <span className="text-sm font-medium">
                Certificate sent successfully! ✨
              </span>
            </div>
          )}

          {sendStatus === "error" && errorMessage && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800">
              <X className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium">Failed to send certificate</p>
                <p className="text-xs mt-1">{errorMessage}</p>
              </div>
            </div>
          )}

          {errorMessage && sendStatus === "idle" && (
            <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
              <X className="w-5 h-5 shrink-0" />
              <span className="text-sm font-medium">{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Footer - Fixed at bottom */}
        <div className="p-6 border-t border-gray-200 dark:border-zinc-700 flex justify-end gap-2 shrink-0 bg-white dark:bg-zinc-900">
          <Button variant="outline" onClick={onClose} disabled={isSending}>
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={isSending || sendStatus === "success"}
            className="bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isSending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : sendStatus === "success" ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Sent!
              </>
            ) : (
              <>
                <Mail className="w-4 h-4 mr-2" />
                Send Certificate
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
