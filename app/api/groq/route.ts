import { NextRequest, NextResponse } from 'next/server';
import { startGroqChatSession } from '@/lib/groq';
import { processImageWithGroq } from '@/lib/groq-vision';

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();
  
  try {
    const formData = await request.formData();
    const prompt = formData.get('prompt') as string;
    const userId = formData.get('userId') as string;
    const subject = formData.get('subject') as string;
    const imageData = formData.get('image') as string;

    if (!prompt && !imageData) {
      throw new Error('No prompt or image provided');
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
        let finalPrompt = prompt;

        // If there's an image, process it first with vision model
        if (imageData) {
          try {
            const extractedText = await processImageWithGroq(
              imageData,
              `Analyze this image and extract the question or problem. Follow these formatting rules:
              1. For mathematical expressions, use LaTeX notation with $ for inline and $$ for display math
              2. Use \\times for multiplication, never use * or x
              3. Format fractions as \\frac{numerator}{denominator}
              4. Format powers using ^, like $x^2$
              5. Format square roots as \\sqrt{x}
              6. If it's a word problem, clearly state the question
              7. If it's a math/physics/chemistry problem, first state the problem, then list any given values or variables
              8. Include all relevant context and information from the image
              
              Format your response as a clear, well-structured question that can be answered.`
            );
            // Process the extracted text to ensure proper math formatting
            finalPrompt = extractedText
              .replace(/\*/g, '\\times')  // Replace any remaining * with \times
              .replace(/(\d+)\s*x\s*(\d+)/g, '$1\\times$2')  // Replace x between numbers with \times
              .replace(/(\d+)\s*×\s*(\d+)/g, '$1\\times$2')  // Replace × with \times
              .replace(/(\d+)\/(\d+)/g, '\\frac{$1}{$2}')    // Convert simple fractions to LaTeX
              .trim();

            // Add subject-specific formatting if needed
            if (subject === 'math' || subject === 'physics') {
              finalPrompt = `${subject.toUpperCase()} PROBLEM:\n\n${finalPrompt}`;
            } else if (subject === 'chemistry') {
              finalPrompt = `CHEMISTRY PROBLEM:\n\n${finalPrompt}`;
            }
          } catch (error) {
            console.error('Error processing image:', error);
            await writer.write('Sorry, I had trouble processing the image. Please try again or type your question.');
            await writer.close();
            return;
          }
        }

        const messages = [
          {
            role: "system",
            content: `You are a specialized ${subject || 'general'} tutor. Format your response according to the subject's template structure. Use LaTeX for mathematical expressions: inline with single $ and display with double $$. For example: $x^2$ or $$\\frac{1}{2}$$`
          },
          {
            role: "user",
            content: finalPrompt
          }
        ];

        const chatCompletion = await startGroqChatSession(messages);
        
        // Handle streaming response
        try {
          for await (const chunk of chatCompletion as any) {
            const content = chunk?.choices?.[0]?.delta?.content || '';
            if (content) {
              // Process content to handle math expressions properly
              const processedContent = content
                .replace(/\\\[/g, '$$')
                .replace(/\\\]/g, '$$')
                .replace(/\\\(/g, '$')
                .replace(/\\\)/g, '$')
                .replace(/\\begin\{equation\}/g, '$$')
                .replace(/\\end\{equation\}/g, '$$')
                .replace(/\\begin\{align\}/g, '$$')
                .replace(/\\end\{align\}/g, '$$')
                .replace(/\\begin\{aligned\}/g, '$$')
                .replace(/\\end\{aligned\}/g, '$$')
                // Ensure proper multiplication symbol rendering
                .replace(/\b(\d+)\s*\.\s*(\d+)\b/g, '$1\\times$2')  // Replace dots between numbers
                .replace(/\b(\d+)\s*\*\s*(\d+)\b/g, '$1\\times$2')  // Replace asterisks
                .replace(/\b(\d+)\s*x\s*(\d+)\b/g, '$1\\times$2')   // Replace 'x' between numbers
                .replace(/\b(\d+)\s*×\s*(\d+)\b/g, '$1\\times$2')   // Replace unicode multiplication
                .replace(/(?<=\$[^$]*)\s*\.\s*(?=[^$]*\$)/g, '\\times')  // Replace dots in inline math
                .replace(/(?<=\$\$[^$]*)\s*\.\s*(?=[^$]*\$\$)/g, '\\times');  // Replace dots in display math
              await writer.write(processedContent);
            }
          }
        } catch {
          // If streaming fails, try to get the full response
          const content = (chatCompletion as any)?.choices?.[0]?.message?.content || '';
          if (content) {
            // Process content to handle math expressions properly
            const processedContent = content
              .replace(/\\\[/g, '$$')
              .replace(/\\\]/g, '$$')
              .replace(/\\\(/g, '$')
              .replace(/\\\)/g, '$')
              .replace(/\\begin\{equation\}/g, '$$')
              .replace(/\\end\{equation\}/g, '$$')
              .replace(/\\begin\{align\}/g, '$$')
              .replace(/\\end\{align\}/g, '$$')
              .replace(/\\begin\{aligned\}/g, '$$')
              .replace(/\\end\{aligned\}/g, '$$')
              // Ensure proper multiplication symbol rendering
              .replace(/\b(\d+)\s*\.\s*(\d+)\b/g, '$1\\times$2')  // Replace dots between numbers
              .replace(/\b(\d+)\s*\*\s*(\d+)\b/g, '$1\\times$2')  // Replace asterisks
              .replace(/\b(\d+)\s*x\s*(\d+)\b/g, '$1\\times$2')   // Replace 'x' between numbers
              .replace(/\b(\d+)\s*×\s*(\d+)\b/g, '$1\\times$2')   // Replace unicode multiplication
              .replace(/(?<=\$[^$]*)\s*\.\s*(?=[^$]*\$)/g, '\\times')  // Replace dots in inline math
              .replace(/(?<=\$\$[^$]*)\s*\.\s*(?=[^$]*\$\$)/g, '\\times');  // Replace dots in display math
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