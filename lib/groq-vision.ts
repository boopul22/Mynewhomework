import Groq from 'groq-sdk';

if (!process.env.GROQ_API_KEY) {
  throw new Error("Missing GROQ_API_KEY environment variable");
}

const groq = new Groq();
groq.apiKey = process.env.GROQ_API_KEY;

export const groqVisionConfig = {
  model: "llama-3.2-11b-vision-preview",
  temperature: 1,
  maxTokens: 1024,
  topP: 1,
  stream: false,
};

export async function processImageWithGroq(
  base64Image: string,
  prompt: string = `just extract the text from the image`
) {
  try {
    const formattedBase64 = base64Image.includes('base64,') 
      ? base64Image 
      : `data:image/jpeg;base64,${base64Image}`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: {
                url: formattedBase64,
              },
            },
          ],
        },
      ],
      model: groqVisionConfig.model,
      temperature: groqVisionConfig.temperature,
      max_tokens: groqVisionConfig.maxTokens,
      top_p: groqVisionConfig.topP,
      stream: groqVisionConfig.stream,
    }) as { choices: Array<{ message: { content: string } }> };

    return chatCompletion.choices[0].message.content;
  } catch (error) {
    console.error('Error processing image with Groq:', error);
    throw error;
  }
}

export function encodeImageToBase64(buffer: Buffer): string {
  return buffer.toString('base64');
} 