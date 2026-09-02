import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Max payload for potential large history / text
  app.use(express.json({ limit: "50mb" }));

  // Helper to lazily initialize the Gemini client
  let aiClient: GoogleGenAI | null = null;
  const getAi = () => {
    if (!aiClient) {
      if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY environment variable is missing.");
      }
      aiClient = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
    return aiClient;
  };

  // API Route: Storyboard breakdown
  app.post("/api/storyboard", async (req, res) => {
    try {
      const ai = getAi();
      const { script } = req.body;
      
      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: `Break down the following script into a sequence of visual storyboard scenes. For each scene, provide a descriptive visual prompt that can be used for image generation. Focus strictly on visual elements, framing, and action.
        
Script:
${script}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                sceneNumber: { type: Type.INTEGER },
                description: { type: Type.STRING, description: "A detailed visual description of the scene for the image generator. Specify camera angle, lighting, character action, and setting." },
                caption: { type: Type.STRING, description: "A short caption or snippet of dialogue for context." },
              },
              required: ["sceneNumber", "description", "caption"],
            },
          },
        },
      });
      
      const text = response.text;
      if (!text) {
        return res.status(500).json({ error: "No response text received from model." });
      }
      
      res.json({ scenes: JSON.parse(text) });
    } catch (error: any) {
      console.error("Storyboard error:", error);
      res.status(500).json({ error: error.message || "Failed to generate storyboard" });
    }
  });

  // API Route: Generate Image
  app.post("/api/generate-image", async (req, res) => {
    try {
      const ai = getAi();
      const { prompt, size } = req.body; 
      // User requested size: 1K, 2K, 4K
      // User requested model: gemini-3-pro-image-preview
      
      const response = await ai.models.generateContent({
        model: "gemini-3-pro-image-preview",
        contents: { parts: [{ text: prompt }] },
        config: {
          imageConfig: {
            aspectRatio: "16:9",
            imageSize: size || "1K",
          },
        },
      });
      
      let imageUrl = null;
      if (response.candidates && response.candidates[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            break;
          }
        }
      }
      
      if (imageUrl) {
        res.json({ imageUrl });
      } else {
        res.status(500).json({ error: "No image generated." });
      }
    } catch (error: any) {
      console.error("Image Gen error:", error);
      res.status(500).json({ error: error.message || "Failed to generate image" });
    }
  });

  // API Route: Chat
  app.post("/api/chat", async (req, res) => {
    try {
      const ai = getAi();
      const { model, history, message, systemInstruction } = req.body;
      
      const chat = ai.chats.create({
        model: model || "gemini-3.1-pro-preview",
        history: history || [],
        config: {
          systemInstruction: systemInstruction || undefined,
        },
      });
      
      const response = await chat.sendMessage({ message });
      res.json({ text: response.text });
    } catch (error: any) {
      console.error("Chat error:", error);
      res.status(500).json({ error: error.message || "Failed to send message" });
    }
  });

  // Vite middleware for development
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
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
