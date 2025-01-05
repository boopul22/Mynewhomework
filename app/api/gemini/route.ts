import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Ensure the API key is loaded from the environment
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error("Missing GEMINI_API_KEY environment variable");
  throw new Error("Missing GEMINI_API_KEY environment variable");
}

const genAI = new GoogleGenerativeAI(apiKey);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const prompt = formData.get('prompt') as string
    const history = formData.get('history') as string || '[]'
    const isStreaming = formData.get('stream') === 'true'

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    console.log("Received request with prompt:", prompt, "history:", history, "isStreaming:", isStreaming);

    // Parse chat history
    const chatHistory = JSON.parse(history) as { role: 'user' | 'model', parts: { text: string }[] }[]

    // Use gemini-pro model for better stability
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

    try {
      console.log('Making request to Gemini with model: gemini-pro')
      let result;

      // Text-only chat
      console.log("Text-only chat, history:", chatHistory);
      const chat = model.startChat({
        history: chatHistory,
        generationConfig: {
          maxOutputTokens: 2048,
          temperature: 0.7,
          topP: 0.8,
          topK: 40,
        },
      });

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
          result = await chat.sendMessage(prompt);
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