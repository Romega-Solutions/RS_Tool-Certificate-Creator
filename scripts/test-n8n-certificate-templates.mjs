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

  await withEnv(env, async () => {
    const filename = await nextN8nTemplateFilename(
      async () =>
        Response.json([
          { filename: "template1.png", contentType: "image/png", dataBase64: "aaa", size: "3" },
          { filename: "template3.png", contentType: "image/png", dataBase64: "ccc", size: "3" },
        ]),
      ["template2.png"],
    );

    assert.equal(filename, "template4.png");
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
      return Response.json([]);
    });

    assert.equal(calls[0].url, "https://n8n.example/api/v1/data-tables/template-table/rows/delete");
    assert.equal(calls[0].init.method, "DELETE");
    assert.deepEqual(JSON.parse(calls[0].init.body).filter, {
      type: "and",
      filters: [{ columnName: "filename", condition: "eq", value: "template6.png" }],
    });
  });
});
