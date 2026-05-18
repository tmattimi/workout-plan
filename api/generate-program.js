const Anthropic = require('@anthropic-ai/sdk');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: 'Missing prompt' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });
  }

  try {
    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
      system: 'You are an expert personal trainer and exercise scientist. Return only valid JSON with no markdown, no explanation, no code blocks. Your response must start with { and end with }.',
      messages: [{ role: 'user', content: prompt }],
    });

    const text = message.content?.[0]?.text || '{}';
    
    // Validate it's parseable JSON
    try {
      JSON.parse(text);
    } catch {
      return res.status(500).json({ error: 'AI returned invalid JSON. Please try again.' });
    }

    return res.status(200).json({ result: text });

  } catch (err) {
    console.error('Anthropic error:', err.message);
    return res.status(500).json({ error: err.message || 'AI generation failed' });
  }
};
