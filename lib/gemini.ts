import { GoogleGenerativeAI } from "@google/generative-ai";
import { teacherModelConfig } from "./teacher-model-config";

if (!process.env.GOOGLE_API_KEY) {
  throw new Error("Missing GOOGLE_API_KEY environment variable");
}

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

export const geminiModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash-thinking-exp-1219" });

// Function to clean markdown formatting
function cleanMarkdown(text: string): string {
  return text
    // Remove bold and italic markers
    .replace(/\*\*([^*]+)\*\*/g, '$1') // Bold with content
    .replace(/\*([^*]+)\*/g, '$1')     // Italic with content
    .replace(/\*\*/g, '')              // Any remaining double asterisks
    .replace(/\*/g, '')                // Any remaining single asterisks
    // Remove bullet points and indentation
    .replace(/^[ \t]*[-*+][ \t]+/gm, '')
    // Remove headers
    .replace(/^#{1,6}[ \t]+/gm, '')
    // Remove code blocks
    .replace(/`{1,3}[^`]*`{1,3}/g, '$1')
    // Remove underscores
    .replace(/_{1,2}([^_]+)_{1,2}/g, '$1')
    // Remove any remaining special characters
    .replace(/[_`~]/g, '')
    // Fix multiple spaces and lines
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n/g, '\n')
    .trim();
}

export async function startChatSession(history: string[] = []) {
  return geminiModel.startChat({
    history: history.map(text => ({ role: 'user', parts: [{ text }] })),
    generationConfig: {
      maxOutputTokens: teacherModelConfig.maxTokens,
      temperature: teacherModelConfig.temperature,
      topP: teacherModelConfig.topP,
    },
  });
}

export async function getGeminiResponse(prompt: string) {
  try {
    const chat = await startChatSession();
    const enhancedPrompt = `${teacherModelConfig.role}\n\nUser Query: ${prompt}`;
    const result = await chat.sendMessage(enhancedPrompt);
    const response = await result.response;
    const rawText = response.text();
    
    // Only clean markdown if the text contains asterisks
    if (rawText.includes('*')) {
      return cleanMarkdown(rawText);
    }
    return rawText;
  } catch (error) {
    console.error("Error getting Gemini response:", error);
    throw error;
  }
} 