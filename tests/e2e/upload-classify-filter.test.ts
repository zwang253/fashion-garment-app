import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { GET as getImages } from "../../app/api/images/route.ts";
import { POST as uploadImage } from "../../app/api/upload/route.ts";
import { closeDb } from "../../lib/repository.ts";

async function createTempEnv() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "fashion-app-"));
  const uploadDir = path.join(root, "public", "uploads");
  await fs.mkdir(uploadDir, { recursive: true });

  process.env.GARMENT_DB_PATH = path.join(root, "garments.db");
  process.env.GARMENT_UPLOAD_DIR = uploadDir;

  return root;
}

afterEach(async () => {
  await closeDb();
  delete process.env.GARMENT_DB_PATH;
  delete process.env.GARMENT_UPLOAD_DIR;
});

test("upload -> classify -> filter works end to end", async () => {
  const root = await createTempEnv();

  const formData = new FormData();
  formData.set("image", new File([new Uint8Array([255, 216, 255])], "tokyo_red_cotton_dress_floral.jpg", { type: "image/jpeg" }));
  formData.set("designer", "Aiko");
  formData.set("continent", "Asia");
  formData.set("country", "Japan");
  formData.set("city", "Tokyo");
  formData.set("venue", "artisan market");
  formData.set("capturedAt", "2025-03-14");

  const uploadResponse = await uploadImage(new Request("http://localhost/api/upload", { method: "POST", body: formData }) as never);
  assert.equal(uploadResponse.status, 201);

  const uploadPayload = (await uploadResponse.json()) as { image: { attributes: { garmentType: string } } };
  assert.equal(uploadPayload.image.attributes.garmentType, "Dress");

  const listResponse = await getImages(
    new Request("http://localhost/api/images?country=Japan&month=March&search=floral", { method: "GET" }) as never,
  );
  assert.equal(listResponse.status, 200);

  const listPayload = (await listResponse.json()) as { images: Array<{ filename: string }> };
  assert.equal(listPayload.images.length, 1);
  assert.equal(listPayload.images[0]?.filename, "tokyo_red_cotton_dress_floral.jpg");

  await fs.rm(root, { recursive: true, force: true });
});
