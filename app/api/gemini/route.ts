import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Ensure the API key is loaded from the environment
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error("Missing GEMINI_API_KEY environment variable");
  throw new Error("Missing GEMINI_API_KEY environment variable");
}

const genAI = new GoogleGenerativeAI(apiKey);

// Convert buffer to base64
function arrayBufferToBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const prompt = formData.get('prompt') as string
    const file = formData.get('file') as File | null

    let base64Data: string | undefined
    let mimeType: string | undefined

    if (file) {
      try {
        const buffer = await file.arrayBuffer()
        base64Data = arrayBufferToBase64(buffer)
        mimeType = file.type
        console.log('File processed successfully:', {
          fileName: file.name,
          mimeType,
          size: file.size,
          base64Length: base64Data.length
        })
      } catch (error) {
        console.error('Error processing file:', error)
        return NextResponse.json(
          { error: 'Failed to process uploaded file' },
          { status: 400 }
        )
      }
    }

    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })

      let content: any[] = []

      // Add text prompt if provided
      if (prompt) {
        content.push(prompt)
      }

      // Add image if provided
      if (base64Data && mimeType?.startsWith('image/')) {
        content.push({
          inlineData: {
            data: base64Data,
            mimeType
          }
        })
      } else if (file) {
        // For non-image files, append filename to prompt
        content[0] = (content[0] || '') + `\n\nAttached file name: ${file.name}`
      }
      
      console.log('Request Payload:', content)

      const result = await model.generateContent(content)
      const response = await result.response
      
      if (!response || typeof response.text !== 'string') {
        console.error('Invalid response format:', response)
        return NextResponse.json(
          { error: 'Invalid response format from Gemini API' },
          { status: 500 }
        )
      }

      console.log('Model response received successfully:', response.text)
      return NextResponse.json({ response: response.text })
    } catch (error: any) {
      console.error('Error calling model:', error)
      console.error('Full Error Object:', JSON.stringify(error, null, 2))
      return NextResponse.json(
        { error: error.message || 'Failed to process model response' },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('API Error:', error)
    console.error('Full API Error Object:', error)
    return NextResponse.json(
      {
        error: error.message || 'Failed to process the request',
        details: error.toString()
      },
      { status: 500 }
    )
  }
} 