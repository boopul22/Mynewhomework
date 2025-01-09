import { NextRequest, NextResponse } from 'next/server';
import { startGroqChatSession } from '@/lib/groq';

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();
  
  try {
    const formData = await request.formData();
    const prompt = formData.get('prompt') as string;
    const userId = formData.get('userId') as string;

    if (!prompt) {
      throw new Error('No prompt provided');
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
        const messages = [
          {
            role: "user",
            content: prompt
          }
        ];

        const chatCompletion = await startGroqChatSession(messages);
        
        // Handle streaming response
        try {
          for await (const chunk of chatCompletion as any) {
            const content = chunk?.choices?.[0]?.delta?.content || '';
            if (content) {
              // Process content to handle math expressions properly
              const processedContent = content.replace(/\\\(/g, '\\\\(')
                                            .replace(/\\\)/g, '\\\\)')
                                            .replace(/\$/g, '\\$');
              await writer.write(processedContent);
            }
          }
        } catch {
          // If streaming fails, try to get the full response
          const content = (chatCompletion as any)?.choices?.[0]?.message?.content || '';
          if (content) {
            // Process content to handle math expressions properly
            const processedContent = content.replace(/\\\(/g, '\\\\(')
                                        .replace(/\\\)/g, '\\\\)')
                                        .replace(/\$/g, '\\$');
            await writer.write(processedContent);
          } else {
            await writer.write('Sorry, I could not generate a response.');
          }
        }
      } catch (error) {
        console.error('Streaming error:', error);
        await writer.write('Sorry, I encountered an error while processing your request.');
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
    console.error('Error in Groq API route:', error);
    return NextResponse.json(
      { error: 'Failed to process the request' },
      { status: 500 }
    );
  }
} 