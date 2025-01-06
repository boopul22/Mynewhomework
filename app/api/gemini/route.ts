import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { startChatSession } from '@/lib/gemini'
import { teacherModelConfig } from '@/lib/teacher-model-config'
import { recordUsage } from '@/lib/firebase-db'
import { calculateUsageStats } from '@/lib/token-counter'

// Ensure the API key is loaded from the environment
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error("Missing GEMINI_API_KEY environment variable");
  throw new Error("Missing GEMINI_API_KEY environment variable");
}

const genAI = new GoogleGenerativeAI(apiKey);

// Helper function to convert base64 to Uint8Array
function base64ToUint8Array(base64String: string): Uint8Array {
  // Remove data URL prefix if present
  const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '');
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const prompt = formData.get('prompt') as string
    const imageData = formData.get('image') as string | null
    const isStreaming = formData.get('stream') === 'true'
    const userId = formData.get('userId') as string || 'anonymous'

    if (!prompt) {
      return new NextResponse('Error: Prompt is required', {
        status: 400,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8'
        }
      });
    }

    console.log("Received request with prompt:", prompt, "isStreaming:", isStreaming, "hasImage:", !!imageData);

    try {
      if (imageData) {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
        
        const imageBytes = base64ToUint8Array(imageData);
        
        const result = await model.generateContent([
          `${teacherModelConfig.role}\n\nUser Query: ${prompt}`,
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: Buffer.from(imageBytes).toString('base64')
            }
          }
        ]);
        
        const response = await result.response;
        const responseText = response.text();

        // Record usage for image-based requests
        const usage = calculateUsageStats(prompt, responseText);
        await recordUsage({
          userId,
          ...usage,
          model: "gemini-1.5-pro"
        });
        
        return new NextResponse(responseText, {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8'
          }
        });
      } else {
        console.log('Starting chat session')
        const chat = await startChatSession([]);

        if (isStreaming) {
          const streamingResponse = await chat.sendMessageStream(prompt);
          console.log("Streaming response initiated");
          
          let fullResponse = '';
          const encoder = new TextEncoder();
          const stream = new ReadableStream({
            async start(controller) {
              try {
                for await (const chunk of streamingResponse.stream) {
                  const text = chunk.text();
                  fullResponse += text;
                  controller.enqueue(encoder.encode(text));
                }
                
                // Record usage after collecting the full response
                const usage = calculateUsageStats(prompt, fullResponse);
                await recordUsage({
                  userId,
                  ...usage,
                  model: "gemini-1.5-pro"
                });
                
                controller.close();
              } catch (error) {
                console.error('Streaming error:', error);
                controller.error(error);
              }
            }
          });

          return new NextResponse(stream, {
            headers: {
              'Content-Type': 'text/plain; charset=utf-8',
            },
          });
        } else {
          try {
            const result = await chat.sendMessage(prompt);
            console.log("Non-streaming response received:", result);
            
            if (!result || !result.response) {
              throw new Error('Empty response from Gemini API');
            }

            const responseText = result.response.text();
            
            // Record usage for non-streaming requests
            const usage = calculateUsageStats(prompt, responseText);
            await recordUsage({
              userId,
              ...usage,
              model: "gemini-1.5-pro"
            });

            console.log('Model response received successfully:', responseText);
            
            return new NextResponse(responseText, {
              headers: {
                'Content-Type': 'text/plain; charset=utf-8'
              }
            });
          } catch (error: any) {
            console.error('Error in chat response:', error);
            throw error;
          }
        }
      }
    } catch (error: any) {
      console.error('Error calling Gemini API:', error);
      return new NextResponse(`Error: ${error.message}`, {
        status: 500,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8'
        }
      });
    }
  } catch (error: any) {
    console.error('API Error:', error);
    return new NextResponse(`Error: ${error.message}`, {
      status: 500,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8'
      }
    });
  }
} 