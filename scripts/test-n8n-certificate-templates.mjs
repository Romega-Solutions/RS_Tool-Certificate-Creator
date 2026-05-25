import assert from "node:assert/strict";
import test from "node:test";

const modulePath = new URL("../src/lib/n8n-certificate-templates.ts", import.meta.url);

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

const env = {
  N8N_URL: "https://n8n.example",
  N8N_API_KEY: "secret",
  N8N_CERTIFICATE_TEMPLATE_TABLE_ID: "template-table",
};

test("n8n template store creates next available template filename", async () => {
  const { nextN8nTemplateFilename } = await import(modulePath);
  const calls = [];

  await withEnv(env, async () => {
    process.env.N8N_CERTIFICATE_TEMPLATE_TABLE_ID = `${process.env.N8N_CERTIFICATE_TEMPLATE_TABLE_ID}\\r\\n`;
    const filename = await nextN8nTemplateFilename(
      async (url) => {
        calls.push(url);
        return Response.json([
          { filename: "template1.png", contentType: "image/png", dataBase64: "aaa", size: "3" },
          { filename: "template3.png", contentType: "image/png", dataBase64: "ccc", size: "3" },
        ]);
      },
      ["template2.png"],
    );

    assert.equal(filename, "template4.png");
    assert.equal(calls[0], "https://n8n.example/api/v1/data-tables/template-table/rows?limit=250");
  });
});

test("n8n template store searches with n8n row limit", async () => {
  const { getN8nCertificateTemplate } = await import(modulePath);
  const calls = [];

  await withEnv(env, async () => {
    const read = await getN8nCertificateTemplate("template 6.png", async (url) => {
      calls.push(url);
      return Response.json([
        {
          id: 7,
          filename: "template 6.png",
          contentType: "image/png",
          dataBase64: Buffer.from("image-bytes").toString("base64"),
          size: "11",
        },
      ]);
    });

    assert.equal(read?.filename, "template 6.png");
    assert.equal(calls[0], "https://n8n.example/api/v1/data-tables/template-table/rows?limit=250&search=template%206.png");
  });
});

test("n8n template store creates next available template filename from data wrapper", async () => {
  const { nextN8nTemplateFilename } = await import(modulePath);

  await withEnv(env, async () => {
    const filename = await nextN8nTemplateFilename(
      async () =>
        Response.json({
          data: [{ filename: "template1.png", contentType: "image/png", dataBase64: "aaa", size: "3" }],
        }),
    );

    assert.equal(filename, "template2.png");
  });
});

test("n8n template store saves and reads image bytes", async () => {
  const { getN8nCertificateTemplate, saveN8nCertificateTemplate } = await import(modulePath);
  const calls = [];

  await withEnv(env, async () => {
    const saved = await saveN8nCertificateTemplate(
      {
        filename: "template6.png",
        contentType: "image/png",
        bytes: Buffer.from("image-bytes"),
      },
      async (url, init) => {
        calls.push({ url, init });
        return Response.json([
          {
            id: 7,
            filename: "template6.png",
            contentType: "image/png",
            dataBase64: Buffer.from("image-bytes").toString("base64"),
            size: "11",
          },
        ]);
      },
    );

    const read = await getN8nCertificateTemplate("template6.png", async () =>
      Response.json([
        {
          id: 7,
          filename: "template6.png",
          contentType: "image/png",
          dataBase64: Buffer.from("image-bytes").toString("base64"),
          size: "11",
        },
      ]),
    );

    assert.equal(saved.filename, "template6.png");
    assert.equal(read?.contentType, "image/png");
    assert.equal(read?.bytes.toString("utf8"), "image-bytes");
    assert.equal(calls[0].url, "https://n8n.example/api/v1/data-tables/template-table/rows");
    assert.equal(calls[0].init.method, "POST");
    assert.equal(JSON.parse(calls[0].init.body).data[0].dataBase64, Buffer.from("image-bytes").toString("base64"));
  });
});

test("n8n template store deletes by filename filter", async () => {
  const { deleteN8nCertificateTemplate } = await import(modulePath);
  const calls = [];

  await withEnv(env, async () => {
    await deleteN8nCertificateTemplate("template6.png", async (url, init) => {
      calls.push({ url, init });
      return Response.json(true);
    });

    assert.equal(
      calls[0].url,
      'https://n8n.example/api/v1/data-tables/template-table/rows/delete?filter=%7B%22type%22%3A%22and%22%2C%22filters%22%3A%5B%7B%22columnName%22%3A%22filename%22%2C%22condition%22%3A%22eq%22%2C%22value%22%3A%22template6.png%22%7D%5D%7D',
    );
    assert.equal(calls[0].init.method, "DELETE");
    assert.equal(calls[0].init.body, undefined);
  });
});

test("n8n template store error includes path and response body", async () => {
  const { saveN8nCertificateTemplate } = await import(modulePath);

  await withEnv(env, async () => {
    await assert.rejects(
      () =>
        saveN8nCertificateTemplate(
          {
            filename: "template6.png",
            contentType: "image/png",
            bytes: Buffer.from("image-bytes"),
          },
          async () =>
            new Response(JSON.stringify({ message: "bad payload" }), {
              status: 400,
              headers: { "content-type": "application/json" },
            }),
        ),
      /n8n template request \/rows failed with HTTP 400: .*bad payload/,
    );
  });
});
