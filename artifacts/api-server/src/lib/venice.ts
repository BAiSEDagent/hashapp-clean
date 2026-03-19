import OpenAI from 'openai';

let veniceClient: OpenAI | null = null;

function getVeniceClient(): OpenAI {
  if (veniceClient) return veniceClient;

  const apiKey = process.env.VENICE_API_KEY;
  if (!apiKey) {
    throw new Error('VENICE_API_KEY is not configured');
  }

  veniceClient = new OpenAI({
    apiKey,
    baseURL: 'https://api.venice.ai/api/v1',
  });

  return veniceClient;
}

export async function analyzeWithVenice(prompt: string): Promise<{
  summary: string;
  model: string;
}> {
  const client = getVeniceClient();

  const response = await client.chat.completions.create({
    model: 'llama-3.3-70b',
    messages: [
      {
        role: 'system',
        content: 'You are a private financial reasoning assistant for an AI spending agent. Analyze the given context and return a concise reasoning summary (2-3 sentences). Focus on risk assessment, value comparison, or vendor evaluation. Be direct and factual.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    max_tokens: 200,
    temperature: 0.3,
  });

  const summary = response.choices[0]?.message?.content?.trim() || 'No analysis produced.';
  const model = response.model || 'llama-3.3-70b';

  return { summary, model };
}
