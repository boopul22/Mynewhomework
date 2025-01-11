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

    // Process the image data directly without removing the prefix
    const result = await processImageWithGroq(image, prompt);
    
    return NextResponse.json({ result });
  } catch (error) {
    console.error('Error processing image:', error);
    return NextResponse.json(
      { error: 'Failed to process image' },
      { status: 500 }
    );
  }
} 