import { NextRequest, NextResponse } from "next/server";
import { initDb, dbPromise } from "../../db";
import fs from "fs";
import path from "path";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  await initDb();

  // 1. 获取 Form Data
  const formData = await req.formData();
  const file = formData.get('image') as File | null;
  if (!file) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  // 2. 存储文件
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.promises.mkdir("uploads", { recursive: true });
  const filePath = path.join("uploads", `${Date.now()}-${file.name}`);
  await fs.promises.writeFile(filePath, buffer);

  // 3. Mock AI
  const aiResult = {
    description: "A red cotton dress with floral prints.",
    attributes: {
      type: "dress",
      style: "casual",
      material: "cotton",
      color_palette: ["red"],
      pattern: "floral",
      season: "summer",
      occasion: ["daily"],
      consumer_profile: "female",
      trend_notes: "floral print",
      location_context: "street market",
    }
  };

  // 4. 写入数据库
  const db = await dbPromise;
  const stmt = await db.run(
    `INSERT INTO images (filename, filepath, ai_description, ai_attributes, user_annotations) VALUES (?, ?, ?, ?, ?)`,
    file.name,
    filePath,
    aiResult.description,
    JSON.stringify(aiResult.attributes),
    JSON.stringify([])
  );
  const imageId = stmt.lastID;

  // 5. 返回
  return NextResponse.json({
    id: imageId,
    filename: file.name,
    filepath: filePath,
    ai_description: aiResult.description,
    ai_attributes: aiResult.attributes,
    user_annotations: [],
    created_at: new Date(),
  });
}