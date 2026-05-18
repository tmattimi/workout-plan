module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: 'Missing prompt' });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GROQ_API_KEY not configured' });
  }

  try {
    const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        response_format: { type: 'json_object' },
        max_tokens: 8000,
        temperature: 0.3,
        messages: [
          {
            role: 'system',
            content: 'You are an expert personal trainer and exercise scientist. Return only valid JSON with no markdown, no explanation, no code blocks. Your response must start with { and end with }.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    const data = await resp.json();

    if (data.error) {
      console.error('Groq error:', data.error);
      return res.status(500).json({ error: data.error.message || 'AI generation failed' });
    }

    const text = data.choices?.[0]?.message?.content || '{}';

    // Validate parseable JSON
    try {
      JSON.parse(text);
    } catch {
      console.error('Invalid JSON from Groq:', text.slice(0, 200));
      return res.status(500).json({ error: 'AI returned invalid JSON. Please try again.' });
    }

    return res.status(200).json({ result: text });

  } catch (err) {
    console.error('Server error:', err.message);
    return res.status(500).json({ error: err.message || 'Generation failed' });
  }
};
