import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI, Part } from '@google/generative-ai'
import { teacherModelConfig } from '@/lib/teacher-model-config'

const apiKey = process.env.GOOGLE_API_KEY;

if (!apiKey) {
  console.error("Missing GOOGLE_API_KEY environment variable");
  throw new Error("Missing GOOGLE_API_KEY environment variable");
}

const genAI = new GoogleGenerativeAI(apiKey);

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
  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  
  try {
    const formData = await request.formData();
    const prompt = formData.get('prompt') as string;
    const userId = formData.get('userId') as string;
    const image = formData.get('image') as string | null;

    if (!prompt) {
      await writer.write(encoder.encode('No prompt provided'));
      await writer.close();
      return new Response(stream.readable, {
        status: 400,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    // Get the chat model
    const model = genAI.getGenerativeModel({ model: teacherModelConfig.model });

    // Create a chat session with initial history containing the role
    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: teacherModelConfig.role }]
        },
        {
          role: "model",
          parts: [{ text: "I understand and will help you with your homework. How can I assist you today?" }]
        }
      ],
      generationConfig: {
        maxOutputTokens: teacherModelConfig.maxTokens,
        temperature: teacherModelConfig.temperature,
        topP: teacherModelConfig.topP,
        topK: teacherModelConfig.topK,
      },
    });

    // Prepare message parts
    const messageParts: Part[] = [{ text: prompt }];
    
    // Add image if provided
    if (image) {
      messageParts.push({
        inlineData: {
          data: image,
          mimeType: 'image/jpeg'
        }
      });
    }

    // Set a timeout for the entire operation
    const timeoutMs = 25000; // 25 seconds
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), timeoutMs);
    });

    try {
      const responsePromise = chat.sendMessage(messageParts);
      const response = await Promise.race([responsePromise, timeoutPromise]) as Awaited<typeof responsePromise>;
      const result = await response.response;
      const text = result.text();
      
      // Process and stream the text with proper math handling
      const processedText = text.replace(/\\\(/g, '\\\\(')
                              .replace(/\\\)/g, '\\\\)')
                              .replace(/\$/g, '\\$');
      
      // Stream the text in chunks
      const chunks = processedText.match(/.{1,1000}(?:\s|$)/g) || [];
      for (const chunk of chunks) {
        await writer.write(encoder.encode(chunk));
      }
    } catch (error: any) {
      console.error('Streaming error:', error);
      const errorMessage = error.message === 'Request timeout'
        ? 'Sorry, the request timed out. Please try again with a shorter question.'
        : 'Sorry, an error occurred while processing your request. Please try again.';
      await writer.write(encoder.encode(errorMessage));
    }

    await writer.close();
    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Error in Gemini API route:', error);
    await writer.write(encoder.encode('Failed to process the request'));
    await writer.close();
    return new Response(stream.readable, {
      status: 500,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
} 