import { NextRequest, NextResponse } from 'next/server';
import { processImageWithGroq } from '@/lib/groq-vision';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { image, prompt } = data;

    if (!image) {
      return NextResponse.json(
        { error: 'Image data is required' },
        { status: 400 }
      );
    }

    // Process the image with a specific prompt for question extraction
    const extractionPrompt = `Extract and format the question from this image. Follow these rules:
    1. Format Requirements:
       - Use LaTeX notation with $ for inline math and $$ for display math
       - ALWAYS wrap mathematical expressions in $ or $$ delimiters
       - Use \\times for multiplication, never use dots (.) or asterisks (*)
       - Format fractions as \\frac{numerator}{denominator}
       - Format powers using ^
       - Format square roots as \\sqrt{x}

    2. Multiple Choice Questions:
       - Keep the exact option labels (i), (ii), (iii), etc.
       - Format each option on a new line
       - Wrap numerical values in options with $ delimiters
       - Maintain the original order of options

    3. Probability Questions:
       - Format probability expressions with proper LaTeX notation
       - Use \\times for multiplication of probabilities
       - Format fractions with \\frac
       - Keep exact numerical values

    4. General Formatting:
       - Start with the problem statement
       - Include all given information
       - Preserve the exact wording
       - Ensure ALL mathematical expressions are wrapped in $ or $$
       - Remove any unnecessary text or markings

    Return the question in a clear, properly formatted way that can be rendered with LaTeX.`;

    const result = await processImageWithGroq(image, prompt || extractionPrompt);
    
    return NextResponse.json({ result });
  } catch (error) {
    console.error('Error processing image:', error);
    return NextResponse.json(
      { error: 'Failed to process image' },
      { status: 500 }
    );
  }
} 