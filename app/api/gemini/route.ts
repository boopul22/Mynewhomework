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
  
  try {
    const formData = await request.formData();
    const prompt = formData.get('prompt') as string;
    const userId = formData.get('userId') as string;
    const image = formData.get('image') as string | null;

    if (!prompt) {
      throw new Error('No prompt provided');
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
          parts: [{ text: "I understand and will act as your all-in-one 'homework helper.' As your dedicated educational guide, I am here to simplify complex concepts, help you excel in your assignments, and foster lasting learning skills across all subjects. How can I support your academic journey today?" }]
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

    // Create transform stream to handle the response
    const stream = new TransformStream({
      async transform(chunk, controller) {
        controller.enqueue(encoder.encode(chunk));
      },
    });

    // Start processing in the background
    (async () => {
      const writer = stream.writable.getWriter();
      try {
        const response = await chat.sendMessage(messageParts);
        const result = await response.response;
        const text = result.text();
        
        // Process and stream the text with proper math handling
        const processedText = text.replace(/\\\(/g, '\\\\(')
                                .replace(/\\\)/g, '\\\\)')
                                .replace(/\$/g, '\\$');
                                
        // Stream the text word by word with minimal delay
        const words = processedText.split(/(\s+)/);
        for (const word of words) {
          await writer.write(word);
          // Reduced delay for faster output
          await new Promise(resolve => setTimeout(resolve, 5));
        }
      } catch (error) {
        console.error('Streaming error:', error);
      } finally {
        await writer.close();
      }
    })();

    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
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