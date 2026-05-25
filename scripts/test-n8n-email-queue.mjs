import assert from "node:assert/strict";
import test from "node:test";

const modulePath = new URL("../src/lib/n8n-email-queue.ts", import.meta.url);

function withEnv(values, fn) {
  const previous = {};
  for (const key of Object.keys(values)) {
    previous[key] = process.env[key];
    process.env[key] = values[key];
  }

  return Promise.resolve()
    .then(fn)
    .finally(() => {
      for (const [key, value] of Object.entries(previous)) {
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
      }
    });
}

test("n8n queue store inserts rows and maps returned row id", async () => {
  const { insertN8nEmailQueue } = await import(modulePath);
  const calls = [];

  await withEnv(
    {
      N8N_URL: "https://n8n.example",
      N8N_API_KEY: "secret",
      N8N_CERTIFICATE_QUEUE_TABLE_ID: "queue-table",
    },
    async () => {
      process.env.N8N_CERTIFICATE_QUEUE_TABLE_ID = `${process.env.N8N_CERTIFICATE_QUEUE_TABLE_ID}\\r\\n`;
      const item = await insertN8nEmailQueue(
        {
          recipientEmail: "learner@example.com",
          recipientName: "Learner One",
          subject: "Certificate",
          message: "Ready",
          certificateImage: "data:image/png;base64,abc",
        },
        async (url, init) => {
          calls.push({ url, init });
          return Response.json([
            {
              id: 42,
              recipientEmail: "learner@example.com",
              recipientName: "Learner One",
              subject: "Certificate",
              message: "Ready",
              certificateImage: "data:image/png;base64,abc",
              status: "pending",
              errorMessage: "",
              sentAt: "",
              createdAt: "2026-05-25T00:00:00.000Z",
            },
          ]);
        },
      );

      assert.equal(item.id, 42);
      assert.equal(item.status, "pending");
      assert.equal(item.errorMessage, null);
      assert.equal(calls[0].url, "https://n8n.example/api/v1/data-tables/queue-table/rows");
      assert.equal(calls[0].init.method, "POST");
      assert.equal(calls[0].init.headers["X-N8N-API-KEY"], "secret");
      assert.equal(JSON.parse(calls[0].init.body).data[0].createdAt, undefined);
    },
  );
});

test("n8n queue store filters rows and calculates stats", async () => {
  const { getN8nEmailQueue, getN8nEmailQueueStats } = await import(modulePath);
  const rows = [
    {
      id: 10,
      recipientEmail: "pending@example.com",
      recipientName: "Pending Person",
      subject: "Certificate",
      message: "Ready",
      certificateImage: "img",
      status: "pending",
      errorMessage: "",
      sentAt: "",
      createdAt: "2026-05-25T00:00:00.000Z",
    },
    {
      id: 11,
      recipientEmail: "sent@example.com",
      recipientName: "Sent Person",
      subject: "Certificate",
      message: "Ready",
      certificateImage: "img",
      status: "sent",
      errorMessage: "",
      sentAt: "2026-05-25T01:00:00.000Z",
      createdAt: "2026-05-25T00:30:00.000Z",
    },
  ];

  await withEnv(
    {
      N8N_URL: "https://n8n.example",
      N8N_API_KEY: "secret",
      N8N_CERTIFICATE_QUEUE_TABLE_ID: "queue-table",
    },
    async () => {
      const fetchRows = async () => Response.json(rows);
      const pending = await getN8nEmailQueue({ status: "pending" }, fetchRows);
      const stats = await getN8nEmailQueueStats(fetchRows);

      assert.deepEqual(
        pending.map((item) => item.id),
        [10],
      );
      assert.deepEqual(stats, { total: 2, pending: 1, sent: 1, failed: 0 });
    },
  );
});

test("n8n queue store updates and deletes rows by id filter", async () => {
  const { deleteN8nEmailQueue, updateN8nEmailQueueStatus } = await import(modulePath);
  const calls = [];

  await withEnv(
    {
      N8N_URL: "https://n8n.example",
      N8N_API_KEY: "secret",
      N8N_CERTIFICATE_QUEUE_TABLE_ID: "queue-table",
    },
    async () => {
      await updateN8nEmailQueueStatus(
        { id: 12, status: "sent", errorMessage: null, sentAt: "2026-05-25T01:00:00.000Z" },
        async (url, init) => {
          calls.push({ url, init });
          return Response.json([
            {
              id: 12,
              recipientEmail: "learner@example.com",
              recipientName: "Learner One",
              subject: "Certificate",
              message: "Ready",
              certificateImage: "img",
              status: "sent",
              errorMessage: "",
              sentAt: "2026-05-25T01:00:00.000Z",
              createdAt: "2026-05-25T00:00:00.000Z",
            },
          ]);
        },
      );

      await deleteN8nEmailQueue(12, async (url, init) => {
        calls.push({ url, init });
        return Response.json([]);
      });

      const updateBody = JSON.parse(calls[0].init.body);
      const deleteBody = JSON.parse(calls[1].init.body);

      assert.equal(calls[0].url, "https://n8n.example/api/v1/data-tables/queue-table/rows/update");
      assert.equal(calls[0].init.method, "PATCH");
      assert.deepEqual(updateBody.filter, {
        type: "and",
        filters: [{ columnName: "id", condition: "eq", value: 12 }],
      });
      assert.equal(calls[1].url, "https://n8n.example/api/v1/data-tables/queue-table/rows/delete");
      assert.equal(calls[1].init.method, "DELETE");
      assert.deepEqual(deleteBody.filter, updateBody.filter);
    },
  );
});
