import sqlite3 from "sqlite3";
import { open } from "sqlite";

export const dbPromise = open({
  filename: "./garments.db",
  driver: sqlite3.Database,
});

export async function initDb() {
  const db = await dbPromise;
  await db.exec(`
    CREATE TABLE IF NOT EXISTS images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT,
      filepath TEXT,
      ai_description TEXT,
      ai_attributes TEXT, -- JSON stringified
      user_annotations TEXT, -- JSON stringified
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}