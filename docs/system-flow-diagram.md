# 🔄 Complete System Flow Diagram

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         ROMEGA CERTIFICATE SYSTEM                        │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────────────┐
│   USER INTERFACE     │
│  (Next.js Frontend)  │
└──────────┬───────────┘
           │
           ├─── /generator (Create Certificates)
           ├─── /email-queue (Monitor Status)
           └─── /dashboard (Overview)


╔══════════════════════════════════════════════════════════════════════════╗
║                         CERTIFICATE GENERATION FLOW                       ║
╚══════════════════════════════════════════════════════════════════════════╝

STEP 1: CREATE CERTIFICATE
┌─────────────────────────┐
│  User adds text/images  │
│  - Name placeholders    │
│  - {{name}}, {{email}}  │
│  - Template selection   │
└──────────┬──────────────┘
           │
           v
┌─────────────────────────┐
│   Canvas Rendering      │
│   - HTML Canvas API     │
│   - PNG generation      │
│   - Base64 encoding     │
└──────────┬──────────────┘
           │
           ├──────────────────┬───────────────────┐
           │                  │                   │
           v                  v                   v
    ┌──────────┐      ┌──────────┐       ┌──────────┐
    │  Download│      │Send Email│       │Add to    │
    │  Locally │      │(Direct)  │       │Queue     │
    └──────────┘      └────┬─────┘       └────┬─────┘
                           │                   │
                           │                   │

╔══════════════════════════════════════════════════════════════════════════╗
║                           EMAIL SENDING OPTIONS                          ║
╚══════════════════════════════════════════════════════════════════════════╝

OPTION A: DIRECT SEND (Instant)
┌─────────────────────────┐
│  Send Email Dialog      │
│  - Choose preset:       │
│    • Event              │
│    • KPI                │
│    • Internship         │
│    • UMak ⭐            │
│  - Enter email          │
│  - Customize message    │
└──────────┬──────────────┘
           │
           v
┌─────────────────────────────────────┐
│  POST /api/send-certificate         │
│  {                                  │
│    email, subject, message,         │
│    certificateImage, recipientName  │
│  }                                  │
└──────────┬──────────────────────────┘
           │
           v
┌─────────────────────────────────────┐
│  n8n Webhook                        │
│  https://n8n.kenbuilds.tech/        │
│  webhook/certificate-email-api      │
└──────────┬──────────────────────────┘
           │
           v
    ┌──────────┐
    │  Gmail   │
    │  Sent ✅  │
    └──────────┘


OPTION B: QUEUE FOR LATER (Batch)
┌─────────────────────────┐
│  Add to Queue Dialog    │
│  - Choose preset:       │
│    • Event              │
│    • KPI                │
│    • Internship         │
│    • UMak ⭐            │
│  - Enter email          │
│  - Save offline         │
└──────────┬──────────────┘
           │
           v
┌─────────────────────────────────────┐
│  POST /api/email-queue              │
│  Saves to PostgreSQL:               │
│  - recipient_email                  │
│  - recipient_name                   │
│  - subject                          │
│  - message                          │
│  - certificate_image (base64)       │
│  - status = 'pending'               │
└──────────┬──────────────────────────┘
           │
           v
┌─────────────────────────────────────┐
│  PostgreSQL Database                │
│  configured DATABASE_URL            │
│  certificate_queue                  │
│                                     │
│  TABLE: email_queue                 │
│  ├─ id (serial)                     │
│  ├─ recipient_email                 │
│  ├─ recipient_name                  │
│  ├─ subject                         │
│  ├─ message                         │
│  ├─ certificate_image (text)        │
│  ├─ status (pending/sent/failed)    │
│  ├─ error_message                   │
│  ├─ created_at                      │
│  └─ sent_at                         │
└──────────┬──────────────────────────┘
           │
           │ (User goes to Email Queue page)
           │
           v
┌─────────────────────────────────────┐
│  /email-queue Page                  │
│  - Auto-refresh every 5 seconds     │
│  - Live status indicator 🟢         │
│  - Select items to send             │
│  - Filter by status                 │
└──────────┬──────────────────────────┘
           │
           │ (Click "Send Selected")
           │
           v
┌─────────────────────────────────────┐
│  POST /api/batch-send               │
│  { ids: [1, 2, 3, ...] }            │
│                                     │
│  For each item:                     │
│  1. Update status to 'sending'      │
│  2. Send to n8n webhook             │
│  3. Wait for response               │
│  4. Update status to 'sent'/'failed'│
└──────────┬──────────────────────────┘
           │
           v
┌─────────────────────────────────────┐
│  n8n Webhook (same as direct send)  │
└──────────┬──────────────────────────┘
           │
           v
    ┌──────────┐
    │  Gmail   │
    │  Sent ✅  │
    └──────────┘


OPTION C: BATCH GENERATION (Multiple at once)
┌─────────────────────────┐
│  Upload JSON file       │
│  {                      │
│    "recipients": [      │
│      {                  │
│        "name": "...",   │
│        "email": "...",  │
│        "title": "..."   │
│      }                  │
│    ]                    │
│  }                      │
└──────────┬──────────────┘
           │
           v
┌─────────────────────────┐
│  Select recipients      │
│  ☑ John Doe             │
│  ☑ Jane Smith           │
│  ☐ Bob Johnson          │
│  (Checkboxes)           │
└──────────┬──────────────┘
           │
           v
┌─────────────────────────┐
│  Queue Dialog           │
│  - Choose preset:       │
│    • Event              │
│    • KPI                │
│    • Internship         │
│    • UMak ⭐            │
│  - Placeholders work!   │
│    {{name}} → John Doe  │
└──────────┬──────────────┘
           │
           v
┌─────────────────────────────────────┐
│  For each selected recipient:       │
│  1. Replace placeholders            │
│  2. Generate certificate PNG        │
│  3. Insert to email_queue table     │
└──────────┬──────────────────────────┘
           │
           v
┌─────────────────────────────────────┐
│  All queued in PostgreSQL           │
│  Ready to send from /email-queue    │
└─────────────────────────────────────┘


╔══════════════════════════════════════════════════════════════════════════╗
║                        n8n WEBHOOK WORKFLOW                              ║
╚══════════════════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────┐
│  n8n receives webhook POST          │
│  {                                  │
│    email: "user@example.com"        │
│    subject: "Your e-certificate..." │
│    message: "Dear John Doe..."      │
│    certificateImage: "data:image/..." │
│    recipientName: "John Doe"        │
│    timestamp: "2024-11-16..."       │
│  }                                  │
└──────────┬──────────────────────────┘
           │
           v
┌─────────────────────────────────────┐
│  Code Node: Process Certificate     │
│  - Convert base64 to Buffer         │
│  - Build HTML email template        │
│  - Add Romega branding              │
│  - Prepare attachment               │
└──────────┬──────────────────────────┘
           │
           v
┌─────────────────────────────────────┐
│  Gmail Node: Send Email             │
│  - To: {{ $json.email }}            │
│  - Subject: {{ $json.subject }}     │
│  - HTML Body: Romega template       │
│  - Attachment: certificate.png      │
└──────────┬──────────────────────────┘
           │
           ├─── SUCCESS ✅ ──────────┬───── ERROR ❌
           │                         │
           v                         v
┌──────────────────────┐    ┌──────────────────────┐
│  HTTP Request Node   │    │  HTTP Request Node   │
│  POST /api/          │    │  POST /api/          │
│  update-status       │    │  update-status       │
│  {                   │    │  {                   │
│    id: 123,          │    │    id: 123,          │
│    status: "sent",   │    │    status: "failed", │
│    sentAt: "..."     │    │    errorMessage: "..." │
│  }                   │    │  }                   │
└──────────┬───────────┘    └──────────┬───────────┘
           │                           │
           └───────────┬───────────────┘
                       │
                       v
           ┌───────────────────────┐
           │  PostgreSQL Updated   │
           │  Status changed       │
           └───────────┬───────────┘
                       │
                       v
           ┌───────────────────────┐
           │  /email-queue page    │
           │  Auto-refreshes       │
           │  Shows new status ✅   │
           └───────────────────────┘


╔══════════════════════════════════════════════════════════════════════════╗
║                          EMAIL PRESET SYSTEM                             ║
╚══════════════════════════════════════════════════════════════════════════╝

┌─────────────────┬─────────────────────────────────────────────────────┐
│  PRESET NAME    │  USE CASE                                           │
├─────────────────┼─────────────────────────────────────────────────────┤
│  📅 Event       │  Workshops, seminars, webinars, conferences         │
│                 │  Subject: "Certificate of Attendance"               │
│                 │  Tone: Professional, appreciative                   │
├─────────────────┼─────────────────────────────────────────────────────┤
│  🏆 KPI         │  Performance awards, sales achievements             │
│                 │  Subject: "KPI Achievement Certificate"             │
│                 │  Tone: Congratulatory, recognition                  │
├─────────────────┼─────────────────────────────────────────────────────┤
│  🎓 Internship  │  OJT, practicum, work immersion programs            │
│                 │  Subject: "Certificate of Completion - Internship"  │
│                 │  Tone: Encouraging, career-focused                  │
├─────────────────┼─────────────────────────────────────────────────────┤
│  🏫 UMak ⭐     │  University events, academic competitions           │
│                 │  Subject: "Your e-certificate is now ready"         │
│                 │  Tone: Formal academic, with legal disclaimer       │
│                 │  Based on: UMak CCIS InfotechnOlympics format       │
└─────────────────┴─────────────────────────────────────────────────────┘


╔══════════════════════════════════════════════════════════════════════════╗
║                        PLACEHOLDER REPLACEMENT                           ║
╚══════════════════════════════════════════════════════════════════════════╝

INPUT (Batch JSON):
{
  "name": "Maria Santos",
  "email": "maria.santos@umak.edu.ph",
  "title": "Web Dev Category Head, InfotechOlympics 2025"
}

TEMPLATE (UMak Preset):
Dear {{name}},

I hope this email finds you well...

Warm regards,
{{title}}

OUTPUT (Sent Email):
Dear Maria Santos,

I hope this email finds you well...

Warm regards,
Web Dev Category Head, InfotechOlympics 2025


╔══════════════════════════════════════════════════════════════════════════╗
║                         DATABASE SCHEMA                                  ║
╚══════════════════════════════════════════════════════════════════════════╝

TABLE: email_queue
┌─────────────────────┬──────────────────┬─────────────────────────────┐
│ COLUMN              │ TYPE             │ DESCRIPTION                 │
├─────────────────────┼──────────────────┼─────────────────────────────┤
│ id                  │ SERIAL PRIMARY   │ Auto-increment ID           │
│ recipient_email     │ VARCHAR(255)     │ Recipient email address     │
│ recipient_name      │ VARCHAR(255)     │ Recipient full name         │
│ subject             │ VARCHAR(500)     │ Email subject line          │
│ message             │ TEXT             │ Email body (can be long)    │
│ certificate_image   │ TEXT             │ Base64 encoded PNG          │
│ status              │ VARCHAR(50)      │ pending/sending/sent/failed │
│ error_message       │ TEXT             │ Error details if failed     │
│ created_at          │ TIMESTAMP        │ When queued                 │
│ sent_at             │ TIMESTAMP        │ When successfully sent      │
└─────────────────────┴──────────────────┴─────────────────────────────┘

INDEXES:
- PRIMARY KEY (id)
- INDEX ON status (for filtering)
- INDEX ON created_at (for sorting)


╔══════════════════════════════════════════════════════════════════════════╗
║                         STATUS LIFECYCLE                                 ║
╚══════════════════════════════════════════════════════════════════════════╝

┌──────────┐    User clicks    ┌──────────┐    n8n sends    ┌──────────┐
│ PENDING  │ ────"Send"─────▶  │ SENDING  │ ────email────▶  │   SENT   │
│  (blue)  │                   │ (yellow) │                 │ (green)  │
└──────────┘                   └────┬─────┘                 └──────────┘
     │                              │
     │  n8n fails                   │ n8n fails
     │                              │
     │                              v
     │                         ┌──────────┐
     └───────────────────────▶ │  FAILED  │
                               │  (red)   │
                               └──────────┘

Auto-refresh: Every 5 seconds, UI polls database for status changes


╔══════════════════════════════════════════════════════════════════════════╗
║                         API ENDPOINTS                                    ║
╚══════════════════════════════════════════════════════════════════════════╝

┌─────────────────────────────┬──────────────────────────────────────────┐
│ ENDPOINT                    │ PURPOSE                                  │
├─────────────────────────────┼──────────────────────────────────────────┤
│ POST /api/send-certificate  │ Direct send via n8n (instant)            │
│ POST /api/email-queue       │ Add to queue (PostgreSQL)                │
│ GET  /api/email-queue       │ Get all queued items (with filters)      │
│ PATCH /api/email-queue      │ Update item status manually              │
│ DELETE /api/email-queue?id= │ Delete queued item                       │
│ POST /api/batch-send        │ Send multiple from queue via n8n         │
│ POST /api/update-status     │ n8n callback (update status in DB)       │
│ PATCH /api/update-status    │ n8n callback (batch status update)       │
└─────────────────────────────┴──────────────────────────────────────────┘


╔══════════════════════════════════════════════════════════════════════════╗
║                         ENVIRONMENT VARIABLES                            ║
╚══════════════════════════════════════════════════════════════════════════╝

.env.local:
┌───────────────────────────────────────────────────────────────────────┐
│ DATABASE_URL=postgresql://cert_admin:replace-with-password@          │
│              db.example.com:5432/certificate_queue                    │
│                                                                       │
│ N8N_WEBHOOK_URL=https://n8n.kenbuilds.tech/webhook/                  │
│                 certificate-email-api                                 │
└───────────────────────────────────────────────────────────────────────┘


╔══════════════════════════════════════════════════════════════════════════╗
║                         KEY FEATURES                                     ║
╚══════════════════════════════════════════════════════════════════════════╝

✅ Real-time Status Updates (5-second auto-refresh)
✅ Offline Queue Support (save without internet)
✅ Batch Certificate Generation (upload JSON, select recipients)
✅ 4 Professional Email Presets (Event, KPI, Internship, UMak)
✅ Placeholder Support ({{name}}, {{email}}, {{title}}, {{date}})
✅ n8n Webhook Integration (external email service)
✅ PostgreSQL Persistence (self-hosted database)
✅ Error Handling & Retry Logic
✅ Beautiful Email Templates (Romega branding)
✅ Academic Compliance (UMak legal disclaimer)


═══════════════════════════════════════════════════════════════════════════
                          SYSTEM READY! 🚀
═══════════════════════════════════════════════════════════════════════════
```
