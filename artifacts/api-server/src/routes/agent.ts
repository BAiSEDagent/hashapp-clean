import { Router } from "express";

const router = Router();

const MAX_MESSAGES = 20;
const MAX_CONTENT_LENGTH = 500;
const MAX_REQUEST_BYTES = 12_000;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 10;

const requestBuckets = new Map<string, number[]>();

function getClientIp(req: { ip?: string | undefined; headers: { [key: string]: string | string[] | undefined } }) {
  const forwarded = req.headers['x-forwarded-for'];
  const forwardedIp = Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(',')[0];
  return (forwardedIp || req.ip || 'unknown').trim();
}

function isRateLimited(ip: string, now: number) {
  const windowStart = now - RATE_LIMIT_WINDOW_MS;
  const recent = (requestBuckets.get(ip) ?? []).filter(ts => ts > windowStart);
  if (recent.length >= RATE_LIMIT_MAX_REQUESTS) {
    requestBuckets.set(ip, recent);
    return true;
  }
  recent.push(now);
  requestBuckets.set(ip, recent);
  return false;
}

router.post("/agent/chat", async (req, res) => {
  const clientIp = getClientIp(req);
  const now = Date.now();

  for (const [ip, timestamps] of requestBuckets.entries()) {
    const recent = timestamps.filter(ts => ts > now - RATE_LIMIT_WINDOW_MS);
    if (recent.length === 0) requestBuckets.delete(ip);
    else if (recent.length !== timestamps.length) requestBuckets.set(ip, recent);
  }

  if (isRateLimited(clientIp, now)) {
    return res.status(429).json({ error: 'Too many chat requests' });
  }

  const requestBytes = Buffer.byteLength(JSON.stringify(req.body ?? {}), 'utf8');
  if (requestBytes > MAX_REQUEST_BYTES) {
    return res.status(413).json({ error: 'chat request too large' });
  }

  const apiKey = process.env.VENICE_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "VENICE_API_KEY not set" });
  }

  const rawMessages = Array.isArray(req.body?.messages) ? req.body.messages : null;
  if (!rawMessages) return res.status(400).json({ error: 'messages array is required' });
  if (rawMessages.length > MAX_MESSAGES) {
    return res.status(400).json({ error: `messages array exceeds max length of ${MAX_MESSAGES}` });
  }

  const messages = rawMessages
    .slice(-MAX_MESSAGES)
    .map((message: unknown) => {
      const role = typeof (message as { role?: unknown })?.role === 'string' ? (message as { role: string }).role : '';
      const content = typeof (message as { content?: unknown })?.content === 'string'
        ? (message as { content: string }).content.replace(/[\u0000-\u001F\u007F]/g, ' ').trim().slice(0, MAX_CONTENT_LENGTH)
        : '';
      return { role, content };
    })
    .filter((message: { role: string; content: string }) => (message.role === 'user' || message.role === 'assistant') && message.content.length > 0);

  if (messages.length === 0) {
    return res.status(400).json({ error: 'at least one valid message is required' });
  }

  const rawContext = req.body?.agentContext ?? {};
  const agentLabel = typeof rawContext.agentLabel === 'string' && rawContext.agentLabel.trim() ? rawContext.agentLabel.trim().slice(0, 40) : 'Agent';
  const spendPermissions = Array.isArray(rawContext.spendPermissions) ? rawContext.spendPermissions.slice(0, 8) : [];
  const rulesCount = typeof rawContext.rulesCount === 'number' && Number.isFinite(rawContext.rulesCount)
    ? Math.max(0, Math.min(50, Math.floor(rawContext.rulesCount)))
    : 0;
  const recentActivity = Array.isArray(rawContext.recentActivity) ? rawContext.recentActivity.slice(0, 5) : [];

  const permissionLines = spendPermissions.length > 0
    ? spendPermissions.map((permission: any) => `${permission.vendor ?? 'Unknown vendor'}: ${Number(permission.amount ?? 0)}/${permission.cadence ?? 'period'}`).join('\n')
    : 'None';

  const activityLines = recentActivity.length > 0
    ? recentActivity.map((item: any) => `${item.merchant ?? 'Unknown'} ${item.amountStr ?? ''} — ${item.status ?? ''}`.trim()).join('\n')
    : 'None';

  const systemPrompt = [
    `You are ${agentLabel}, a research agent with delegated USDC spending authority on Base Sepolia.`,
    '',
    'Active spend permissions:',
    permissionLines,
    '',
    `Active rules: ${rulesCount} constraints protecting the wallet.`,
    '',
    'Recent activity:',
    activityLines,
    '',
    'You speak concisely. Explain what you want to purchase, why, and whether it fits your current permissions.',
    'Do not execute transactions — your human approves them.',
    'Keep responses under 60 words.',
  ].join('\n');

  try {
    const veniceRes = await fetch('https://api.venice.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b',
        stream: true,
        max_tokens: 200,
        messages: [{ role: 'system', content: systemPrompt }, ...messages],
        venice_parameters: {
          include_venice_system_prompt: false,
          enable_web_search: 'off',
        },
      }),
    });

    if (!veniceRes.ok) return res.status(502).json({ error: 'Venice unavailable', status: veniceRes.status });
    if (!veniceRes.body) return res.status(502).json({ error: 'Venice returned no body' });

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('Cache-Control', 'no-cache');

    const reader = veniceRes.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let partialContent = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const payload = line.slice(6).trim();
        if (!payload || payload === '[DONE]') continue;
        try {
          const parsed = JSON.parse(payload) as any;
          const delta = parsed.choices?.[0]?.delta?.content;
          if (typeof delta === 'string' && delta.length > 0) {
            partialContent += delta;
            res.write(delta);
          }
        } catch (error) {
          console.debug('[agent-chat] malformed Venice stream chunk', { clientIp, error });
        }
      }
    }

    if (partialContent.length === 0) res.write('[empty response]');
    return res.end();
  } catch {
    return res.status(502).json({ error: 'Venice unavailable' });
  }
});

export default router;
