import path from "node:path";
import sqlite3 from "sqlite3";
import { open, type Database } from "sqlite";

import { parseClassifierOutput } from "./classifier.ts";
import type { Annotation, GarmentImage, StructuredAttributes } from "./types.ts";

type ImageRow = {
  id: number;
  filename: string;
  image_url?: string | null;
  filepath?: string | null;
  ai_description: string;
  ai_attributes: string;
  user_annotations: string;
  designer?: string | null;
  captured_at?: string | null;
  created_at: string;
};

let dbInstance: Promise<Database<sqlite3.Database, sqlite3.Statement>> | null = null;

function getDbPath() {
  return process.env.GARMENT_DB_PATH || path.join(process.cwd(), "garments.db");
}

async function getDb() {
  dbInstance ??= open({
    filename: getDbPath(),
    driver: sqlite3.Database,
  });

  return dbInstance;
}

function parseAttributes(input: string): StructuredAttributes {
  return parseClassifierOutput({ attributes: JSON.parse(input) as StructuredAttributes }).attributes;
}

function parseAnnotations(input: string) {
  return JSON.parse(input || "[]") as Annotation[];
}

function normalizeImageUrl(row: ImageRow) {
  const storedPath = row.image_url || row.filepath || "";
  if (!storedPath) {
    return "";
  }

  if (storedPath.startsWith("/")) {
    return storedPath;
  }

  if (storedPath.startsWith("public/")) {
    return `/${storedPath.slice("public/".length)}`;
  }

  return `/${storedPath}`;
}

function mapRow(row: ImageRow): GarmentImage {
  return {
    id: row.id,
    filename: row.filename,
    imageUrl: normalizeImageUrl(row),
    aiDescription: row.ai_description,
    attributes: parseAttributes(row.ai_attributes),
    userAnnotations: parseAnnotations(row.user_annotations),
    designer: row.designer || "Unknown",
    capturedAt: row.captured_at || row.created_at,
    createdAt: row.created_at,
  };
}

export async function initDb() {
  const db = await getDb();
  await db.exec(`
    CREATE TABLE IF NOT EXISTS images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL,
      image_url TEXT NOT NULL,
      ai_description TEXT NOT NULL,
      ai_attributes TEXT NOT NULL,
      user_annotations TEXT NOT NULL,
      designer TEXT NOT NULL DEFAULT 'Unknown',
      captured_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const columns = await db.all<Array<{ name: string }>>(`PRAGMA table_info(images)`);
  const columnNames = new Set(columns.map((column) => column.name));

  if (!columnNames.has("image_url")) {
    await db.exec(`ALTER TABLE images ADD COLUMN image_url TEXT`);
    if (columnNames.has("filepath")) {
      await db.exec(`UPDATE images SET image_url = filepath WHERE image_url IS NULL`);
    }
  }

  if (!columnNames.has("designer")) {
    await db.exec(`ALTER TABLE images ADD COLUMN designer TEXT NOT NULL DEFAULT 'Unknown'`);
  }

  if (!columnNames.has("captured_at")) {
    await db.exec(`ALTER TABLE images ADD COLUMN captured_at TEXT`);
    await db.exec(`UPDATE images SET captured_at = created_at WHERE captured_at IS NULL`);
  }

  await db.exec(`UPDATE images SET designer = 'Unknown' WHERE designer IS NULL OR trim(designer) = ''`);
  await db.exec(`UPDATE images SET captured_at = created_at WHERE captured_at IS NULL OR trim(captured_at) = ''`);
  if (columnNames.has("filepath")) {
    await db.exec(`UPDATE images SET image_url = filepath WHERE (image_url IS NULL OR trim(image_url) = '') AND filepath IS NOT NULL`);
  }
}

export async function listImages() {
  await initDb();
  const db = await getDb();
  const rows = await db.all<ImageRow[]>(`SELECT * FROM images ORDER BY datetime(created_at) DESC, id DESC`);
  return rows.map(mapRow);
}

export async function createImageRecord(input: {
  filename: string;
  imageUrl: string;
  aiDescription: string;
  attributes: StructuredAttributes;
  designer: string;
  capturedAt: string;
}) {
  await initDb();
  const db = await getDb();
  const result = await db.run(
    `
      INSERT INTO images (
        filename,
        image_url,
        ai_description,
        ai_attributes,
        user_annotations,
        designer,
        captured_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    input.filename,
    input.imageUrl,
    input.aiDescription,
    JSON.stringify(input.attributes),
    JSON.stringify([]),
    input.designer,
    input.capturedAt,
  );

  const row = await db.get<ImageRow>(`SELECT * FROM images WHERE id = ?`, result.lastID);
  if (!row) {
    throw new Error("Failed to fetch inserted image");
  }

  return mapRow(row);
}

export async function addAnnotation(id: number, annotations: Annotation[]) {
  await initDb();
  const db = await getDb();
  const existing = await db.get<ImageRow>(`SELECT * FROM images WHERE id = ?`, id);
  if (!existing) {
    return null;
  }

  const merged = [...parseAnnotations(existing.user_annotations), ...annotations];
  await db.run(`UPDATE images SET user_annotations = ? WHERE id = ?`, JSON.stringify(merged), id);

  const updated = await db.get<ImageRow>(`SELECT * FROM images WHERE id = ?`, id);
  return updated ? mapRow(updated) : null;
}

export async function closeDb() {
  if (!dbInstance) {
    return;
  }

  const db = await dbInstance;
  dbInstance = null;
  await db.close();
}
