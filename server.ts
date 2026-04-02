import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import { GoogleGenAI, Type } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json());

  // Explicitly allow embedding in iframes (like Framer)
  app.use((req, res, next) => {
    res.removeHeader("X-Frame-Options");
    res.setHeader("Content-Security-Policy", "frame-ancestors *");
    next();
  });

  // Read portfolio content once at startup
  const portfolioContent = fs.readFileSync(path.join(process.cwd(), 'src', 'portfolio.txt'), 'utf-8');
  const systemInstruction = `You are a helpful AI assistant for Jerry Gordinier's design portfolio website. 
Your goal is to answer questions about Jerry's experience, projects, and skills based ONLY on the provided portfolio content.
Be conversational, professional, and concise. If you don't know the answer based on the portfolio, politely say so.
Do not make up information.
Jerry's email address is gerald.gordinier@gmail.com.

CRITICAL INSTRUCTIONS:
1. For ANY answers about Google, provide high-level information ONLY. DO NOT include any impact metrics or numbers.
2. For ANY answers about Google, you MUST include this exact note at the end: "For more information about Google, reach out to gerald.gordinier@gmail.com to get access to project details."
3. Keep all answers VERY short and concise so they fit within a small 450px tall UI container without scrolling.
4. Maintain proper markdown formatting for bulleted lists and numeric lists.

Here is the portfolio content:
${portfolioContent}`;

  // API Route for Chat
  app.post('/api/chat', async (req, res) => {
    try {
      const { messages } = req.body;
      
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

      // Format messages for Gemini
      const contents = messages
        .filter((m: any) => m.id !== 'welcome')
        .map((msg: any) => ({
          role: msg.role,
          parts: [{ text: msg.text }]
        }));

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              answer: {
                type: Type.STRING,
                description: "The markdown-formatted answer to the user's question."
              },
              suggestedQuestions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Exactly two suggested follow-up questions the user could ask next. Do not repeat any questions that have already been asked in the conversation."
              }
            },
            required: ["answer", "suggestedQuestions"]
          }
        }
      });

      res.json({ text: response.text });
    } catch (error) {
      console.error("Chat API Error:", error);
      res.status(500).json({ error: "Failed to generate response", details: error.message });
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
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, {
      setHeaders: (res) => {
        res.removeHeader("X-Frame-Options");
        res.setHeader("Content-Security-Policy", "frame-ancestors *");
      }
    }));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
