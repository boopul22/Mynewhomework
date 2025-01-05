import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { startChatSession } from '@/lib/gemini'

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
    const history = formData.get('history') as string || '[]'
    const isStreaming = formData.get('stream') === 'true'

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    console.log("Received request with prompt:", prompt, "history:", history, "isStreaming:", isStreaming, "hasImage:", !!imageData);

    // Parse chat history
    const chatHistory = JSON.parse(history) as { role: 'user' | 'model', parts: { text: string }[] }[]

    try {
      if (imageData) {
        // Use Gemini Pro Vision for image input
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
        
        const imageBytes = base64ToUint8Array(imageData);
        
        const result = await model.generateContent([
          prompt,
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: Buffer.from(imageBytes).toString('base64')
            }
          }
        ]);
        
        const response = await result.response;
        const responseText = response.text();
        
        return NextResponse.json({ 
          response: responseText,
          history: [...chatHistory, 
            { role: 'user', parts: [{ text: prompt }] },
            { role: 'model', parts: [{ text: responseText }] }
          ]
        });
      } else {
        // Use regular chat for text-only input
        console.log('Starting chat session with history:', chatHistory)
        const chat = await startChatSession(chatHistory);

        if (isStreaming) {
          const streamingResponse = await chat.sendMessageStream(prompt);
          console.log("Streaming response initiated");
          
          // Set up streaming response
          const encoder = new TextEncoder();
          const stream = new ReadableStream({
            async start(controller) {
              try {
                for await (const chunk of streamingResponse.stream) {
                  const text = chunk.text();
                  controller.enqueue(encoder.encode(text));
                }
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
            if (typeof responseText !== 'string') {
              throw new Error('Invalid response format: response text is not a string');
            }

            console.log('Model response received successfully:', responseText);
            return NextResponse.json({ 
              response: responseText,
              history: [...chatHistory, 
                { role: 'user', parts: [{ text: prompt }] },
                { role: 'model', parts: [{ text: responseText }] }
              ]
            });
          } catch (error: any) {
            console.error('Error in chat response:', error);
            throw error;
          }
        }
      }
    } catch (error: any) {
      console.error('Error calling Gemini API:', error);
      return NextResponse.json(
        { 
          error: 'Failed to get response from Gemini',
          details: error.message,
          stack: error.stack
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process the request',
        details: error.message,
        stack: error.stack
      },
      { status: 500 }
    )
  }
} 