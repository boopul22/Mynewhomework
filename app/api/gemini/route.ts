import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { startChatSession } from '@/lib/gemini'
import { teacherModelConfig } from '@/lib/teacher-model-config'
import { recordUsage } from '@/lib/firebase-db'
import { calculateUsageStats } from '@/lib/token-counter'

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
// This helps in handling image uploads and converting them to a format Gemini can understand
function base64ToUint8Array(base64String: string): Uint8Array {
  // Remove any data URL prefix to get pure base64 data
  const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '');
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Main POST request handler for the Gemini API route
export async function POST(request: NextRequest) {
  try {
    // Parse form data from the incoming request
    const formData = await request.formData()
    const prompt = formData.get('prompt') as string
    const imageData = formData.get('image') as string | null
    const isStreaming = formData.get('stream') === 'true'
    const userId = formData.get('userId') as string || 'anonymous'

    // Validate that a prompt is provided
    if (!prompt) {
      return new NextResponse('Error: Prompt is required', {
        status: 400,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8'
        }
      });
    }

    // Log request details for debugging and monitoring
    console.log("Received request with prompt:", prompt, "isStreaming:", isStreaming, "hasImage:", !!imageData);

    try {
      // Handle image-based requests (when an image is uploaded with the prompt)
      if (imageData) {
        // Use Gemini Pro model for image and text processing
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
        
        // Convert image data to processable format
        const imageBytes = base64ToUint8Array(imageData);
        
        // Generate content using the image and prompt
        const result = await model.generateContent([
          `${teacherModelConfig.role}\n\nUser Query: ${prompt}`,
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: Buffer.from(imageBytes).toString('base64')
            }
          }
        ]);
        
        // Extract text response from the model
        const response = await result.response;
        const responseText = response.text();

        // Record usage statistics for the image-based request
        const usage = calculateUsageStats(prompt, responseText);
        await recordUsage({
          userId,
          ...usage,
          model: "gemini-1.5-pro"
        });
        
        // Return the response to the client
        return new NextResponse(responseText, {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8'
          }
        });
      } else {
        // Handle text-based chat requests
        console.log('Starting chat session')
        const chat = await startChatSession([]);

        // Handle streaming responses for real-time text generation
        if (isStreaming) {
          const streamingResponse = await chat.sendMessageStream(prompt);
          console.log("Streaming response initiated");
          
          let fullResponse = '';
          const encoder = new TextEncoder();
          const stream = new ReadableStream({
            async start(controller) {
              try {
                // Stream response chunks to the client
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

          // Return the streaming response
          return new NextResponse(stream, {
            headers: {
              'Content-Type': 'text/plain; charset=utf-8',
            },
          });
        } else {
          // Handle non-streaming text responses
          try {
            const result = await chat.sendMessage(prompt);
            console.log("Non-streaming response received:", result);
            
            // Validate the response
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
            
            // Return the response to the client
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
      // Handle and log any errors during Gemini API interaction
      console.error('Error calling Gemini API:', error);
      return new NextResponse(`Error: ${error.message}`, {
        status: 500,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8'
        }
      });
    }
  } catch (error: any) {
    // Handle and log any general API errors
    console.error('API Error:', error);
    return new NextResponse(`Error: ${error.message}`, {
      status: 500,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8'
      }
    });
  }
} 