import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI, Part } from '@google/generative-ai'
import { startChatSession } from '@/lib/gemini'
import { teacherModelConfig } from '@/lib/teacher-model-config'

// Retrieve the Gemini API key from environment variables for secure access
const apiKey = process.env.GEMINI_API_KEY;

// Validate that the API key is present, throwing an error if it's missing
if (!apiKey) {
  console.error("Missing GEMINI_API_KEY environment variable");
  throw new Error("Missing GEMINI_API_KEY environment variable");
}

// Initialize the Google Generative AI client with the API key
const genAI = new GoogleGenerativeAI(apiKey);

// Convert base64 encoded image data to a Uint8Array for processing
function base64ToUint8Array(base64String: string): Uint8Array {
  const base64WithoutPrefix = base64String.split(',')[1] || base64String;
  const binaryString = Buffer.from(base64WithoutPrefix, 'base64').toString('binary');
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const prompt = formData.get('prompt') as string;
    const userId = formData.get('userId') as string;
    const image = formData.get('image') as string | null;
    const stream = formData.get('stream') === 'true';

    if (!prompt) {
      throw new Error('No prompt provided');
    }

    // Start a new chat session
    const chat = await startChatSession();

    // Prepare message parts
    const messageParts: Part[] = [{ text: prompt }];
    
    // Add image if provided
    if (image) {
      messageParts.push({
        inlineData: {
          data: image,
          mimeType: 'image/jpeg' // Adjust based on your image type
        }
      });
    }

    // Get the response from the model
    const result = await chat.sendMessage(messageParts);
    const response = await result.response;
    const text = response.text();

    return new NextResponse(text, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('Error in Gemini API route:', error);
    return NextResponse.json(
      { error: 'Failed to process the request' },
      { status: 500 }
    );
  }
} 