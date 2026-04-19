import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import multer from "multer";
import nextConnect from "next-connect";
import { dbPromise, initDb } from "../../db";

// Multer setup for file uploading
const upload = multer({
  storage: multer.diskStorage({
    destination: function (_req, _file, cb) {
      const uploadPath = path.join(process.cwd(), "uploads");
      if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath);
      cb(null, uploadPath);
    },
    filename: function (_req, file, cb) {
      const unique = `${Date.now()}-${file.originalname}`;
      cb(null, unique);
    },
  }),
});

const apiRoute = nextConnect({
  onError(error, req, res) {
    res.status(501).json({ error: `Sorry something happened! ${error.message}` });
  },
  onNoMatch(req, res) {
    res.status(405).json({ error: `Method '${req.method}' Not Allowed` });
  },
});

// Only handle POST
apiRoute.use(upload.single("image"));

apiRoute.post(async (req: any, res: any) => {
  await initDb();
  const file = req.file;
  if (!file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  // Step 1: Call Gemini or mock
  async function analyzeWithGemini(imagePath: string) {
    try {
      const buffer = fs.readFileSync(imagePath);
      const base64 = buffer.toString("base64");
      const apiKey = process.env.GEMINI_API_KEY || ""; // Must be set in .env.local
      if (!apiKey) throw new Error("GEMINI_API_KEY not set");
      // Gemini Vision API call here, pseudo-code：
      // (你开发时可用axios调用真实接口)
      // 返回结构: { description: string, attributes: object }
      // 这里先简单 mock：
      return {
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
        },
      };
    } catch (e) {
      // fallback mock
      return {
        description: "Garment attributes not available.",
        attributes: {},
      };
    }
  }

  const aiResult = await analyzeWithGemini(file.path);

  // Step 2: Insert data
  const db = await dbPromise;
  const stmt = await db.run(
    `INSERT INTO images (filename, filepath, ai_description, ai_attributes, user_annotations) VALUES (?, ?, ?, ?, ?)`,
    file.originalname,
    file.path,
    aiResult.description,
    JSON.stringify(aiResult.attributes),
    JSON.stringify([])
  );
  const imageId = stmt.lastID;
  // Return result
  const image = {
    id: imageId,
    filename: file.originalname,
    filepath: file.path,
    ai_description: aiResult.description,
    ai_attributes: aiResult.attributes,
    user_annotations: [],
    created_at: new Date(),
  };
  return res.status(200).json(image);
});

// Required for Next.js API Route compatibility
export const config = {
  api: {
    bodyParser: false,
  },
};
export default apiRoute;