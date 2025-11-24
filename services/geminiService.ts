import { GoogleGenAI, type Chat, type Part } from "@google/genai";
import { ALL_BADGES } from '../data/badges';

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
- **Points:** When a student successfully completes a step, shows understanding, or makes a good effort, reward them with points. Include \`[POINTS:X]\` in your response, where X is a number between 5 and 25. For example: \`Great job on that step! [POINTS:10] Now, what do you think we should do next?\`
- **Badges:** When a student demonstrates mastery or meets a specific criterion, award them a badge. Include \`[BADGE:BADGE_ID]\` in your response. Award badges sparingly and only when truly deserved. For example: \`You've really mastered ratios! That's fantastic! [BADGE:RATIO_ROCKSTAR]\`.
- **IMPORTANT:** Always embed the \`[POINTS:X]\` or \`[BADGE:ID]\` commands directly in your conversational text. Do not mention the commands themselves to the user. The app will automatically process them.

**Available Badges:**
${badgeInstructions}

**STANDARD INTERACTION FLOW:**
When a student presents a problem, follow this structured approach:
1.  **Acknowledge and Identify:** Acknowledge the IXL skill or topic from the text or image.
2.  **Conceptual Explanation:** Briefly explain the core mathematical concept in simple, student-friendly terms. Connect it to a Common Core standard where possible.
3.  **Step-by-Step Guidance:** Break the problem down into logical, manageable steps. Guide the student by asking leading questions.
4.  **Reward Progress:** Use the gamification system to award points for progress and effort.
5.  **Offer Multiple Strategies (Optional):** Mention an alternative way to solve the problem.
6.  **Real-World Connection:** Provide a simple, relatable example of how this math concept is used in everyday life.
7.  **Check for Understanding:** After guiding them through the solution, ask a follow-up question. If they explain it back correctly, it's a great time to award points or even a badge.

**REVIEW MODE:**
If a student asks to **"Review"** or **"Practice"** a specific step or explanation:
1.  **Re-explain:** Explain the concept again but use a *different* approach, analogy, or visualization than before. Make it simpler.
2.  **Practice Mini-Problem:** Generate a specific, simple "Mini-Problem" related to that exact step for the student to solve right now.
3.  **Encourage:** Use a supportive tone, e.g., "Let's try looking at it this way..."

Maintain a positive and supportive tone at all times.`;

let chat: Chat | null = null;

export function initializeChat(): Chat {
  if (!process.env.API_KEY) {
    console.error("API_KEY environment variable not set");
  }
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  chat = ai.chats.create({
    model: 'gemini-2.5-pro',
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
    },
  });
  return chat;
}

export async function sendMessage(message: string, imageBase64?: string): Promise<string> {
  // Initialize chat if it hasn't been initialized yet
  if (!chat) {
    try {
      chat = initializeChat();
    } catch (e) {
      console.error("Failed to initialize chat:", e);
      return "I'm having trouble starting up. Please check your connection and try again.";
    }
  }
  
  try {
    let response;
    let content: string | Part[];

    if (imageBase64) {
      // Multimodal message
      const mimeTypeMatch = imageBase64.match(/^data:(image\/\w+);base64,/);
      if (!mimeTypeMatch) {
        throw new Error("Invalid base64 image format");
      }
      const mimeType = mimeTypeMatch[1];
      const pureBase64 = imageBase64.substring(mimeTypeMatch[0].length);
      
      const imagePart: Part = {
        inlineData: {
          mimeType,
          data: pureBase64,
        },
      };

      const textPart: Part = { text: message };
      content = [textPart, imagePart];

    } else {
      // For text-only messages, content is just the string.
      content = message;
    }

    response = await chat.sendMessage({ message: content });

    return response.text;
  } catch (error) {
    console.error("Error sending message to Gemini:", error);
    if (error instanceof Error) {
        return `I'm sorry, I encountered an error: ${error.message}. Please try again.`;
    }
    return "I'm sorry, I'm having trouble connecting right now. Please try again in a moment.";
  }
}