// Load environment variables from .env before anything else
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { memoryStorage } = require("multer");
const multer = require("multer");
const { GoogleGenAI } = require("@google/genai");

const app = express();
const PORT = process.env.PORT || 3001;

// ---------------------------------------------------------------------------
// Gemini client
// ---------------------------------------------------------------------------
if (!process.env.GEMINI_API_KEY) {
  console.error("ERROR: GEMINI_API_KEY is not set. Copy server/.env.example to server/.env and add your key.");
  process.exit(1);
}

const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------
// Allow localhost in dev and any *.vercel.app domain in production.
// Add your custom domain here later if needed.
const ALLOWED_ORIGINS = [
  /^http:\/\/localhost/,
  /\.vercel\.app$/,
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || ALLOWED_ORIGINS.some((r) => r.test(origin))) callback(null, true);
    else callback(new Error("CORS: origin not allowed"));
  },
}));

// multer v2: files kept in memory as Buffers
const upload = multer({
  storage: memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
});

// ---------------------------------------------------------------------------
// Build Gemini prompt based on analysis mode
// ---------------------------------------------------------------------------
function buildPrompt(brand, containerType, mode) {
  if (mode === "stock_count") {
    return `You are analyzing a photo of stacked beverage stock for inventory counting.
Count only the number of visible ${brand} ${containerType}s in this image.
Ignore all other products and brands.
If items are partially occluded, use your best judgment but be conservative.
Respond ONLY with strict JSON in this exact shape:
{
  "count": <integer>,
  "confidence": "high"|"medium"|"low",
  "notes": "<one short sentence>"
}`;
  }

  // share_of_shelf mode — full per-shelf breakdown
  return `You are analyzing a photo of stacked beverage stock for inventory counting.
Examine the image carefully and respond ONLY with strict JSON in this exact shape:
{
  "count": <integer, total visible ${brand} ${containerType}s across ALL shelves>,
  "confidence": "high"|"medium"|"low",
  "notes": "<one short sentence summarising the overall count>",
  "totalShelves": <integer, number of distinct horizontal shelf levels visible; 0 if no shelving unit>,
  "facingPercentage": <integer 0-100, overall % of visible product facing occupied by ${brand} ${containerType}s>,
  "shelves": [
    {
      "shelfNumber": <integer, 1 = top shelf, incrementing downward>,
      "count": <integer, number of ${brand} ${containerType}s on this shelf>,
      "facingPercentage": <integer 0-100, % of this shelf's facing occupied by ${brand} ${containerType}s>,
      "notes": "<very short phrase, e.g. 'fully stocked' or 'mostly competitor'>"
    }
  ]
}
Rules:
- Number shelves top-to-bottom starting at 1.
- "shelves" array must have exactly "totalShelves" entries. If totalShelves is 0, shelves must be [].
- Count only ${brand} ${containerType}s. Ignore all other brands.
- Be conservative with partially occluded items.
- Every integer field must be a JSON number, not a string.`;
}

// ---------------------------------------------------------------------------
// POST /api/analyze
// ---------------------------------------------------------------------------
app.post("/api/analyze", upload.single("image"), async (req, res) => {
  try {
    // --- 1. Validate inputs ---
    if (!req.file) return res.status(400).json({ error: "No image file was uploaded." });

    const { brand, containerType, mode } = req.body;
    if (!brand || brand.trim() === "") return res.status(400).json({ error: "Brand is required." });
    if (!containerType || containerType.trim() === "") return res.status(400).json({ error: "Container type is required." });

    const analysisMode = mode === "stock_count" ? "stock_count" : "share_of_shelf";

    // --- 2. Prepare image ---
    const imageBase64 = req.file.buffer.toString("base64");
    const imageMimeType = req.file.mimetype;

    // --- 3. Build prompt ---
    const prompt = buildPrompt(brand.trim(), containerType.trim(), analysisMode);

    // --- 4. Call Gemini ---
    const response = await genai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [{
        role: "user",
        parts: [
          { inlineData: { mimeType: imageMimeType, data: imageBase64 } },
          { text: prompt },
        ],
      }],
      config: { responseMimeType: "application/json" },
    });

    // --- 5. Parse result ---
    const rawText = response.text ?? "";
    let result;
    try {
      result = JSON.parse(rawText);
    } catch {
      return res.status(502).json({ error: "Gemini returned an unexpected response format.", raw: rawText });
    }

    if (typeof result.count !== "number" || !result.confidence || !result.notes) {
      return res.status(502).json({ error: "Gemini response was missing required fields.", raw: result });
    }

    // --- 6. Return result ---
    const payload = {
      mode: analysisMode,
      count: result.count,
      confidence: result.confidence,
      notes: result.notes,
    };

    if (analysisMode === "share_of_shelf") {
      payload.totalShelves     = typeof result.totalShelves === "number" ? result.totalShelves : null;
      payload.facingPercentage = typeof result.facingPercentage === "number" ? result.facingPercentage : null;
      payload.shelves          = Array.isArray(result.shelves) ? result.shelves : [];
    }

    return res.status(200).json(payload);
  } catch (err) {
    console.error("Error calling Gemini API:", err);
    return res.status(500).json({ error: err?.message || "An unexpected error occurred on the server." });
  }
});

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`Ilytical API running at http://localhost:${PORT}`);
});
