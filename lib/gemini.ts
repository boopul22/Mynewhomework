import { GoogleGenerativeAI } from "@google/generative-ai";

if (!process.env.GOOGLE_API_KEY) {
  throw new Error("Missing GOOGLE_API_KEY environment variable");
}

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

export const geminiModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

export async function startChatSession(history: { role: 'user' | 'model', parts: { text: string }[] }[] = []) {
  return geminiModel.startChat({
    history,
    generationConfig: {
      maxOutputTokens: 2048,
      temperature: 0.7,
      topP: 0.8,
      topK: 40,
    },
  });
}

export async function getGeminiResponse(prompt: string, history: { role: 'user' | 'model', parts: { text: string }[] }[] = []) {
  try {
    const chat = await startChatSession(history);
    const result = await chat.sendMessage(prompt);
    const response = await result.response;
    return {
      text: response.text(),
      history: [
        ...history,
        { role: 'user', parts: [{ text: prompt }] },
        { role: 'model', parts: [{ text: response.text() }] }
      ]
    };
  } catch (error) {
    console.error("Error getting Gemini response:", error);
    throw error;
  }
} 