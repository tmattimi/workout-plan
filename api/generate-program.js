module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: 'Missing prompt' });
  }

  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8000,
        system: 'You are an expert personal trainer and exercise scientist. Return only valid JSON with no markdown, no explanation, no code blocks. Your response must start with { and end with }.',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    const data = await resp.json();

    if (data.error) {
      console.error('Anthropic error:', data.error);
      return res.status(500).json({ error: data.error.message || 'AI generation failed' });
    }

    const text = data.content?.[0]?.text || '{}';

    // Strip any accidental markdown fences
    const clean = text.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();

    try {
      JSON.parse(clean);
    } catch {
      console.error('Invalid JSON from Anthropic:', clean.slice(0, 200));
      return res.status(500).json({ error: 'AI returned invalid JSON. Please try again.' });
    }

    return res.status(200).json({ result: clean });

  } catch (err) {
    console.error('Server error:', err.message);
    return res.status(500).json({ error: err.message || 'Generation failed' });
  }
};
