// A simple token estimator based on text length
// This is a rough approximation, as actual token counts depend on the tokenizer used
export function estimateTokenCount(text: string): number {
  // Assuming average of 4 characters per token (this is a rough estimate)
  return Math.ceil(text.length / 4);
}

export function calculateUsageStats(prompt: string, response: string) {
  const promptTokens = estimateTokenCount(prompt);
  const completionTokens = estimateTokenCount(response);
  
  return {
    promptTokens,
    completionTokens,
    totalTokens: promptTokens + completionTokens
  };
} 