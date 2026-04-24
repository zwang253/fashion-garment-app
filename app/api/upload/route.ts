import fs from "node:fs/promises";
import path from "node:path";

import { NextRequest, NextResponse } from "next/server.js";

import { classifyGarment } from "../../../lib/classifier.ts";
import { createImageRecord, initDb } from "../../../lib/repository.ts";

export const dynamic = "force-dynamic";

function getUploadDir() {
  return process.env.GARMENT_UPLOAD_DIR || path.join(process.cwd(), "public", "uploads");
}

function sanitizeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-");
}

export async function POST(request: NextRequest) {
  try {
    await initDb();

    const formData = await request.formData();
    const file = formData.get("image");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Please attach an image file." }, { status: 400 });
    }

    const uploadDir = getUploadDir();
    await fs.mkdir(uploadDir, { recursive: true });

    const storedName = `${Date.now()}-${sanitizeFilename(file.name)}`;
    const absolutePath = path.join(uploadDir, storedName);
    const imageUrl = `/uploads/${storedName}`;

    const bytes = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(absolutePath, bytes);

    const context = {
      designer: String(formData.get("designer") || "Unknown"),
      continent: String(formData.get("continent") || "Unknown"),
      country: String(formData.get("country") || "Unknown"),
      city: String(formData.get("city") || "Unknown"),
      venue: String(formData.get("venue") || "Unknown"),
      capturedAt: String(formData.get("capturedAt") || new Date().toISOString().slice(0, 10)),
    };

    const aiResult = classifyGarment(file.name, context);
    const image = await createImageRecord({
      filename: file.name,
      imageUrl,
      aiDescription: aiResult.description,
      attributes: aiResult.attributes,
      designer: context.designer,
      capturedAt: context.capturedAt,
    });

    return NextResponse.json({ image }, { status: 201 });
  } catch (error) {
    console.error("Upload failed", error);
    return NextResponse.json({ error: "Unable to process the uploaded image." }, { status: 500 });
  }
}
