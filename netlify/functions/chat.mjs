import OpenAI from 'openai';
import { searchWeb } from './search.js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function handler(event) {
  try {
    const { messages: raw } = JSON.parse(event.body);
    if (!raw) throw new Error('Missing messages payload');

    const chatMessages = raw.map(m => ({ role: m.role, content: m.content }));
    const lastUser = chatMessages.filter(m => m.role === 'user').pop().content;

    // forced search:
    console.log('[chat] forced searchWeb with query:', lastUser);
    const forcedResults = await searchWeb(lastUser);

    chatMessages.push({
      role: 'function',
      name: 'searchWeb',
      content: JSON.stringify(forcedResults)
    });

    const response = await openai.chat.completions.create({
      model:    'gpt-4o-mini',
      messages: chatMessages
    });

    const reply = response.choices[0].message.content.trim();
    return { statusCode: 200, body: JSON.stringify({ reply }) };
  } catch (err) {
    console.error('Chat function error:', err);
    return {
      statusCode: err.message.includes('Missing') ? 400 : 500,
      body: JSON.stringify({ error: err.message })
    };
  }
}
