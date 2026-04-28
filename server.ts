import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";

import { GoogleGenAI, type Part } from "@google/genai";
import { ALL_BADGES } from './data/badges';

// Create a markdown list of badges for the system prompt
const badgeInstructions = ALL_BADGES.map(
  badge => `- **${badge.name} (${badge.id})**: ${badge.description}`
).join('\n');

const SYSTEM_INSTRUCTION = `You are Mr. Rankin's Assistant, a friendly, patient, and encouraging AI chatbot.
Your purpose is to help middle school students (grades 6, 7, and 8) with their IXL math assignments.
Your primary goal is to foster deep conceptual understanding based on the Common Core State Standards.
NEVER just give the final answer to a problem. When a user uploads an image, analyze it and use it as the context for your step-by-step guidance.

**GAMIFICATION SYSTEM:**
You have a system of points and badges to reward the student for their effort and understanding.
- **Points:** When a student successfully completes a step, shows understanding, or makes a good effort, reward them with points. Include \`[POINTS:X]\` in your response, where X is a number between 5 and 25.
- **Badges:** When a student demonstrates mastery or meets a specific criterion, award them a badge. Include \`[BADGE:BADGE_ID]\` in your response. 
- **IMPORTANT:** Always embed the \`[POINTS:X]\` or \`[BADGE:ID]\` commands directly in your conversational text. Do not mention the commands themselves to the user.

**Available Badges:**
${badgeInstructions}

**STANDARD INTERACTION FLOW:**
1. Acknowledge and Identify.
2. Conceptual Explanation.
3. Step-by-Step Guidance.
4. Reward Progress.
5. Offer Multiple Strategies (Optional).
6. Real-World Connection.
7. Check for Understanding.

**REVIEW MODE:**
If a student asks to "Review" or "Practice" a specific step:
1. Re-explain with a different approach.
2. Generate a specific "Mini-Problem".
3. Maintain a supportive tone.`;

async function startServer() {
  const app = express();
  const PORT = 3000;
  
  app.use(express.json({ limit: '50mb' }));

  // API route for chatting with Gemini
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, imageBase64, history } = req.body;
      
      const apiKey = process.env.GEMINI_API_KEY?.trim();
      const ai = new GoogleGenAI({ apiKey });
      const chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        history: history || [],
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
        },
      });

      let content: string | Part[];

      if (imageBase64) {
        const mimeTypeMatch = imageBase64.match(/^data:(image\/\w+);base64,/);
        if (!mimeTypeMatch) {
            res.status(400).json({ error: "Invalid base64 image format" });
            return;
        }
        const mimeType = mimeTypeMatch[1];
        const pureBase64 = imageBase64.substring(mimeTypeMatch[0].length);
        
        const imagePart: Part = {
          inlineData: { mimeType, data: pureBase64 },
        };
        const textPart: Part = { text: message };
        content = [textPart, imagePart];
      } else {
        content = message;
      }

      const response = await chat.sendMessage({ message: content });
      
      res.json({ text: response.text || "I didn't get a response. Please try asking again." });
    } catch (error) {
      console.error("Error sending message to Gemini:", error);
      if (error instanceof Error) {
          if (error.message.includes('API_KEY_INVALID') || error.message.includes('API key not valid')) {
              res.status(400).json({ error: "Your Gemini API key is missing or invalid. Please configure a valid API key in the App Settings." });
              return;
          }
          if (error.message.includes('429') || error.message.toLowerCase().includes('rate') || error.message.toLowerCase().includes('quota')) {
              res.status(429).json({ error: "I'm receiving too many requests right now. Please wait a moment and try again." });
              return;
          }
          res.status(500).json({ error: `I'm sorry, I ran into an issue: ${error.message}. Please try again.` });
          return;
      }
      res.status(500).json({ error: "I'm sorry, I'm having trouble connecting to the math brain right now." });
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
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
