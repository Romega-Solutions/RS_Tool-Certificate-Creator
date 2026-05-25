import { Pool } from "pg";
import { EmailQueueItem, EmailQueueStats } from "@/types/email-queue";
import {
  deleteN8nEmailQueue,
  getN8nEmailQueue,
  getN8nEmailQueueItemsByIds,
  getN8nEmailQueueStats,
  insertN8nEmailQueue,
  isN8nEmailQueueConfigured,
  updateN8nEmailQueueStatus,
} from "./n8n-email-queue";

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false, // Set to true if your PostgreSQL server requires SSL
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test connection on initialization
pool.on("connect", () => {
  console.log("✅ Connected to PostgreSQL database");
});

pool.on("error", (err) => {
  console.error("❌ Unexpected PostgreSQL error:", err);
});

function isPostgresConfigured() {
  return Boolean(process.env.DATABASE_URL?.trim());
}

async function withQueueFallback<T>(postgresOperation: () => Promise<T>, n8nOperation: () => Promise<T>) {
  if (!isPostgresConfigured() && isN8nEmailQueueConfigured()) {
    return n8nOperation();
  }

  try {
    return await postgresOperation();
  } catch (error) {
    if (isN8nEmailQueueConfigured()) {
      console.warn("PostgreSQL queue unavailable; falling back to n8n Data Table queue.", error);
      return n8nOperation();
    }
    throw error;
  }
}

/**
 * Insert new email into queue
 */
export async function insertEmailQueue(data: {
  recipientEmail: string;
  recipientName: string;
  subject: string;
  message: string;
  certificateImage: string;
}): Promise<EmailQueueItem> {
  return withQueueFallback(
    () => insertPostgresEmailQueue(data),
    () => insertN8nEmailQueue(data),
  );
}

async function insertPostgresEmailQueue(data: {
  recipientEmail: string;
  recipientName: string;
  subject: string;
  message: string;
  certificateImage: string;
}): Promise<EmailQueueItem> {
  const client = await pool.connect();
  try {
    const query = `
      INSERT INTO email_queue 
      (recipient_email, recipient_name, subject, message, certificate_image, status) 
      VALUES ($1, $2, $3, $4, $5, 'pending') 
      RETURNING 
        id,
        recipient_email as "recipientEmail",
        recipient_name as "recipientName",
        subject,
        message,
        certificate_image as "certificateImage",
        status,
        error_message as "errorMessage",
        created_at as "createdAt",
        sent_at as "sentAt"
    `;

    const values = [
      data.recipientEmail,
      data.recipientName,
      data.subject,
      data.message,
      data.certificateImage,
    ];

    const result = await client.query(query, values);
    return result.rows[0];
  } finally {
    client.release();
  }
}

/**
 * Get email queue items with optional filters
 */
export async function getEmailQueue(filters?: {
  status?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}): Promise<EmailQueueItem[]> {
  return withQueueFallback(
    () => getPostgresEmailQueue(filters),
    () => getN8nEmailQueue(filters),
  );
}

async function getPostgresEmailQueue(filters?: {
  status?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}): Promise<EmailQueueItem[]> {
  const client = await pool.connect();
  try {
    let query = `
      SELECT 
        id,
        recipient_email as "recipientEmail",
        recipient_name as "recipientName",
        subject,
        message,
        certificate_image as "certificateImage",
        status,
        error_message as "errorMessage",
        created_at as "createdAt",
        sent_at as "sentAt"
      FROM email_queue 
      WHERE 1=1
    `;

    const params: string[] = [];
    let paramIndex = 1;

    if (filters?.status) {
      query += ` AND status = $${paramIndex}`;
      params.push(filters.status);
      paramIndex++;
    }

    if (filters?.search) {
      query += ` AND recipient_email ILIKE $${paramIndex}`;
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    if (filters?.dateFrom) {
      query += ` AND created_at >= $${paramIndex}`;
      params.push(filters.dateFrom);
      paramIndex++;
    }

    if (filters?.dateTo) {
      query += ` AND created_at <= $${paramIndex}`;
      params.push(filters.dateTo);
      paramIndex++;
    }

    query += " ORDER BY created_at DESC";

    const result = await client.query(query, params);
    return result.rows;
  } finally {
    client.release();
  }
}

/**
 * Update email queue item status
 */
export async function updateEmailQueueStatus(data: {
  id: number;
  status: string;
  errorMessage?: string | null;
  sentAt?: string | null;
}): Promise<EmailQueueItem> {
  return withQueueFallback(
    () => updatePostgresEmailQueueStatus(data),
    () => updateN8nEmailQueueStatus(data),
  );
}

async function updatePostgresEmailQueueStatus(data: {
  id: number;
  status: string;
  errorMessage?: string | null;
  sentAt?: string | null;
}): Promise<EmailQueueItem> {
  const client = await pool.connect();
  try {
    const query = `
      UPDATE email_queue 
      SET 
        status = $1, 
        error_message = $2, 
        sent_at = $3 
      WHERE id = $4 
      RETURNING 
        id,
        recipient_email as "recipientEmail",
        recipient_name as "recipientName",
        subject,
        message,
        certificate_image as "certificateImage",
        status,
        error_message as "errorMessage",
        created_at as "createdAt",
        sent_at as "sentAt"
    `;

    const values = [
      data.status,
      data.errorMessage || null,
      data.sentAt || null,
      data.id,
    ];

    const result = await client.query(query, values);
    return result.rows[0];
  } finally {
    client.release();
  }
}

/**
 * Delete email queue item
 */
export async function deleteEmailQueue(id: number): Promise<void> {
  return withQueueFallback(
    () => deletePostgresEmailQueue(id),
    () => deleteN8nEmailQueue(id),
  );
}

async function deletePostgresEmailQueue(id: number): Promise<void> {
  const client = await pool.connect();
  try {
    const query = "DELETE FROM email_queue WHERE id = $1";
    await client.query(query, [id]);
  } finally {
    client.release();
  }
}

/**
 * Get email queue statistics
 */
export async function getEmailQueueStats(): Promise<EmailQueueStats> {
  return withQueueFallback(
    () => getPostgresEmailQueueStats(),
    () => getN8nEmailQueueStats(),
  );
}

async function getPostgresEmailQueueStats(): Promise<EmailQueueStats> {
  const client = await pool.connect();
  try {
    const query = `
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'sent') as sent,
        COUNT(*) FILTER (WHERE status = 'failed') as failed
      FROM email_queue
    `;

    const result = await client.query(query);
    const row = result.rows[0];

    return {
      total: parseInt(row.total, 10),
      pending: parseInt(row.pending, 10),
      sent: parseInt(row.sent, 10),
      failed: parseInt(row.failed, 10),
    };
  } finally {
    client.release();
  }
}

export async function getEmailQueueByIds(ids: number[]): Promise<EmailQueueItem[]> {
  return withQueueFallback(
    async () => {
      const client = await pool.connect();
      try {
        const placeholders = ids.map((_, i) => `$${i + 1}`).join(",");
        const query = `
          SELECT 
            id,
            recipient_email as "recipientEmail",
            recipient_name as "recipientName",
            subject,
            message,
            certificate_image as "certificateImage",
            status,
            error_message as "errorMessage",
            created_at as "createdAt",
            sent_at as "sentAt"
          FROM email_queue
          WHERE id IN (${placeholders})
        `;
        const result = await client.query(query, ids);
        return result.rows;
      } finally {
        client.release();
      }
    },
    () => getN8nEmailQueueItemsByIds(ids),
  );
}

/**
 * Test database connection
 */
export async function testConnection(): Promise<boolean> {
  try {
    if (!isPostgresConfigured() && isN8nEmailQueueConfigured()) {
      await getN8nEmailQueueStats();
      return true;
    }

    const client = await pool.connect();
    await client.query("SELECT NOW()");
    client.release();
    return true;
  } catch (error) {
    console.error("Database connection test failed:", error);
    return false;
  }
}

export default pool;
