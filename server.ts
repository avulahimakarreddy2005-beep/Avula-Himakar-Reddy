import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body parsing limits elevated to allow base64 images
  app.use(express.json({ limit: "20mb" }));
  app.use(express.urlencoded({ limit: "20mb", extended: true }));

  // Initialize secure Gemini SDK client
  const apiKey = process.env.GEMINI_API_KEY || "";
  let ai: GoogleGenAI | null = null;
  if (apiKey) {
    ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }

  // Secure API route for backend-only AI analysis
  app.post("/api/analyze-issue", async (req, res) => {
    try {
      if (!ai) {
        return res.status(503).json({
          error: "Gemini API client is not initialized. Please ensure GEMINI_API_KEY is configured in Settings > Secrets.",
        });
      }

      const { imageDescription, base64Image } = req.body;
      const prompt = `
        Analyze this civic issue image as described: "${imageDescription || 'No description provided'}" and provide a structured report.
        
        Return a JSON object with strictly these keys:
        - "Category": String (One of: "Pothole", "Drainage", "Waste", or "Hazard")
        - "Severity": String (One of: "Low", "Medium", "High")
        - "Tags": Array of strings (At least 3 specific technical tags like "skid_risk", "blockage", "structural_damage")
        - "Suggested Priority": Number (1 to 10, where 10 is immediate emergency)
        - "Description": String (A professional 1-2 sentence summary of the visible damage)
      `;

      const contents = base64Image
        ? {
            parts: [
              { text: prompt },
              {
                inlineData: {
                  data: base64Image,
                  mimeType: "image/jpeg",
                },
              },
            ],
          }
        : prompt;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents,
        config: {
          responseMimeType: "application/json",
        },
      });

      if (!response.text) {
        throw new Error("No textual response returned from Gemini Model.");
      }

      const result = JSON.parse(response.text.trim());
      res.json(result);
    } catch (error: any) {
      console.error("Secure AI analysis error:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on virtual port http://0.0.0.0:${PORT}`);
  });
}

startServer();
