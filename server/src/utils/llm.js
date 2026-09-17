// Provider-agnostic LLM helper used by the chatbot and AI test generation.
// Configure ONE of: GEMINI_API_KEY (Google AI Studio, has a free tier) or OPENAI_API_KEY
// (any OpenAI-compatible endpoint via OPENAI_BASE_URL, e.g. Groq / OpenRouter / local Ollama).

export const llmProvider = () => {
  if (process.env.GEMINI_API_KEY) return 'gemini';
  if (process.env.OPENAI_API_KEY) return 'openai';
  return null;
};

const withTimeout = async (fn, ms) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fn(controller.signal);
  } finally {
    clearTimeout(timer);
  }
};

/**
 * @param {object} p
 * @param {string} p.system   system instructions
 * @param {Array<{role:'user'|'assistant', content:string}>} [p.history]
 * @param {string} p.message  latest user message
 * @param {boolean} [p.json]  ask the model for a JSON response
 * @param {number} [p.maxTokens]
 * @param {number} [p.temperature]
 * @param {number} [p.timeoutMs]
 * @returns {Promise<{ text: string, provider: string }>}
 */
export const generateText = async ({ system, history = [], message, json = false, maxTokens = 800, temperature = 0.4, timeoutMs = 25000 }) => {
  const provider = llmProvider();
  if (!provider) throw new Error('No LLM API key configured');

  if (provider === 'gemini') {
    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    const text = await withTimeout(async (signal) => {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: 'POST',
        signal,
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: [
            ...history.map(h => ({ role: h.role === 'assistant' ? 'model' : 'user', parts: [{ text: h.content }] })),
            { role: 'user', parts: [{ text: message }] },
          ],
          generationConfig: {
            temperature,
            maxOutputTokens: maxTokens,
            ...(json ? { responseMimeType: 'application/json' } : {}),
          },
        }),
      });
      if (!res.ok) throw new Error(`Gemini ${res.status}: ${(await res.text()).slice(0, 300)}`);
      const data = await res.json();
      return data?.candidates?.[0]?.content?.parts?.map(p => p.text).join('') || '';
    }, timeoutMs);
    return { text, provider };
  }

  const base = (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '');
  const text = await withTimeout(async (signal) => {
    const res = await fetch(`${base}/chat/completions`, {
      method: 'POST',
      signal,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        temperature,
        max_tokens: maxTokens,
        ...(json ? { response_format: { type: 'json_object' } } : {}),
        messages: [{ role: 'system', content: system }, ...history, { role: 'user', content: message }],
      }),
    });
    if (!res.ok) throw new Error(`OpenAI-compatible API ${res.status}: ${(await res.text()).slice(0, 300)}`);
    const data = await res.json();
    return data?.choices?.[0]?.message?.content || '';
  }, timeoutMs);
  return { text, provider };
};

// Extract the first JSON object/array from a model response (handles ```json fences)
export const parseJSONResponse = (text) => {
  const cleaned = String(text || '').replace(/```(?:json)?/gi, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch (_) {
    const start = cleaned.search(/[[{]/);
    const end = Math.max(cleaned.lastIndexOf('}'), cleaned.lastIndexOf(']'));
    if (start >= 0 && end > start) return JSON.parse(cleaned.slice(start, end + 1));
    throw new Error('Model did not return valid JSON');
  }
};
