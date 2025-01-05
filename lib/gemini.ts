import { GoogleGenerativeAI } from "@google/generative-ai";
import { teacherModelConfig } from "./teacher-model-config";

if (!process.env.GOOGLE_API_KEY) {
  throw new Error("Missing GOOGLE_API_KEY environment variable");
}

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

export const geminiModel = genAI.getGenerativeModel({ model: teacherModelConfig.model });

export async function startChatSession(history: any[] = []) {
  return geminiModel.startChat({
    history,
    generationConfig: {
      temperature: teacherModelConfig.temperature,
      maxOutputTokens: teacherModelConfig.maxTokens,
      topP: teacherModelConfig.topP,
      topK: 40,
    },
  });
} 