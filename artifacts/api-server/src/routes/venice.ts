import { Router } from 'express';
import { analyzeWithVenice } from '../lib/venice';

const router = Router();

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 10;
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now >= entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

function generateDemoResponse(prompt: string): { summary: string; model: string } {
  const merchant = prompt.match(/for\s+(.+?)(?:\s+at|\s+costing|\.|$)/i)?.[1] || 'this vendor';
  const amount = prompt.match(/\$[\d,.]+/)?.[0] || '';
  const summary = `Evaluated ${merchant} spend request${amount ? ` (${amount})` : ''}. Pricing is within normal range for this service category. No unusual risk factors identified based on vendor history and market comparisons.`;
  return { summary, model: 'demo-fallback' };
}

router.post('/venice/analyze', async (req, res) => {
  const hasVeniceKey = !!process.env.VENICE_API_KEY;

  const expectedToken = process.env.AGENT_API_TOKEN || process.env.SCOUT_API_TOKEN;
  const authHeader = req.headers.authorization;
  if (expectedToken) {
    const providedToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!providedToken || providedToken !== expectedToken) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
  }

  const rateLimitKey = authHeader?.slice(0, 16) || req.ip || 'anon';
  if (!checkRateLimit(rateLimitKey)) {
    res.status(429).json({ error: 'Rate limit exceeded. Max 10 requests per minute.' });
    return;
  }

  const { prompt } = req.body;

  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    res.status(400).json({ error: 'prompt is required and must be a non-empty string' });
    return;
  }

  if (prompt.length > 2000) {
    res.status(400).json({ error: 'prompt must be 2000 characters or less' });
    return;
  }

  if (!hasVeniceKey) {
    const demo = generateDemoResponse(prompt.trim());
    console.log('[Venice] No VENICE_API_KEY — returning demo response');
    res.json({
      summary: demo.summary,
      model: demo.model,
      provider: 'Venice',
      demo: true,
    });
    return;
  }

  try {
    const result = await analyzeWithVenice(prompt.trim());
    res.json({
      summary: result.summary,
      model: result.model,
      provider: 'Venice',
      demo: false,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Venice analysis failed';
    console.error('[Venice] Analysis error:', message);
    res.status(502).json({ error: 'Venice analysis failed' });
  }
});

export default router;
