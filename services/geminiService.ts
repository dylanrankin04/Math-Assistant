
export async function sendMessage(message: string, imageBase64?: string, history?: any[]): Promise<string> {
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message, imageBase64, history })
    });

    let data;
    try {
      data = await res.json();
    } catch (parseError) {
      const text = await res.text();
      console.error("Non-JSON response from server:", text);
      throw new Error(`Server returned an invalid response (not JSON). It may be restarting or unavailable.`);
    }

    if (!res.ok) {
      throw new Error(data.error || "Failed to fetch response from server");
    }

    return data.text;
  } catch (error) {
    console.error("Error sending message to Gemini:", error);
    if (error instanceof Error) {
        if (error.message.includes('429') || error.message.toLowerCase().includes('rate') || error.message.toLowerCase().includes('quota')) {
            return "I'm receiving too many requests right now. Please wait a moment and try again.";
        }
        return `I'm sorry, I ran into an issue: ${error.message}. Please try again.`;
    }
    return "I'm sorry, I'm having trouble connecting to the math brain right now.";
  }
}

export function clearChatSession() {
  // Chat session context is managed with passed history on the backend now.
  // We keep this function so App.tsx does not break.
}
