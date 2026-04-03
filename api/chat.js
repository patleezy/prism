// In-memory rate limit store — resets on cold start (sufficient for abuse prevention)
const rateLimitStore = new Map();
const RATE_LIMIT = 25;        // max requests
const WINDOW_MS = 60 * 60 * 1000; // per hour
const MAX_BODY_BYTES = 32768; // 32kb max request size

function getClientIP(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.socket?.remoteAddress ||
    'unknown'
  );
}

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);

  if (!entry || now - entry.windowStart > WINDOW_MS) {
    rateLimitStore.set(ip, { count: 1, windowStart: now });
    return { allowed: true, remaining: RATE_LIMIT - 1 };
  }

  if (entry.count >= RATE_LIMIT) {
    const resetIn = Math.ceil((WINDOW_MS - (now - entry.windowStart)) / 60000);
    return { allowed: false, resetIn };
  }

  entry.count++;
  return { allowed: true, remaining: RATE_LIMIT - entry.count };
}

export default async function handler(req, res) {
  // Method check
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limiting
  const ip = getClientIP(req);
  const limit = checkRateLimit(ip);
  if (!limit.allowed) {
    return res.status(429).json({
      error: `Rate limit reached. Try again in ${limit.resetIn} minute${limit.resetIn !== 1 ? 's' : ''}.`
    });
  }

  // Request size check
  const bodyStr = JSON.stringify(req.body);
  if (bodyStr.length > MAX_BODY_BYTES) {
    return res.status(413).json({ error: 'Request too large.' });
  }

  // Strip any attempt to override the model or inject system-level abuse
  const body = req.body;
  if (!body?.messages || !Array.isArray(body.messages)) {
    return res.status(400).json({ error: 'Invalid request format.' });
  }

  // Force safe model — prevent using expensive models via prompt injection
  body.model = 'claude-sonnet-4-20250514';

  // Cap max_tokens
  if (!body.max_tokens || body.max_tokens > 4000) {
    body.max_tokens = 2500;
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    // Add rate limit headers so frontend can surface them if needed
    res.setHeader('X-RateLimit-Remaining', limit.remaining);
    return res.status(200).json(data);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
