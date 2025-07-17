// netlify/functions/chat.mjs
import OpenAI from 'openai';
import { searchWeb } from './search.js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function handler(event) {
  try {
    const { messages: rawMessages } = JSON.parse(event.body);
    if (!rawMessages) throw new Error('Missing messages payload');

    // Alakítsd át a bejövő üzeneteket
    const chatMessages = rawMessages.map(m => ({
      role:    m.role,
      content: m.content
    }));

    // Vedd ki a legutóbbi user-üzenetet
    const lastUser = chatMessages.filter(m => m.role === 'user').pop().content;

    // --- 0) MINDIG először lefuttatjuk a webes keresést ---
    console.log('[chat] forced searchWeb with query:', lastUser);
    const forcedResults = await searchWeb(lastUser);
    console.log('[chat] forcedResults:', forcedResults);

    // --- 1) Injectáljuk a találatokat function message-ként ---
    chatMessages.push({
      role:    'function',
      name:    'searchWeb',
      content: JSON.stringify(forcedResults)
    });

    // --- 2) Ezután kérdezzük meg a modellt a teljes kontextussal ---
    const response = await openai.chat.completions.create({
      model:    'gpt-4o-mini',
      messages: chatMessages
    });

    const reply = response.choices?.[0]?.message?.content?.trim();
    if (!reply) throw new Error('No reply from OpenAI');

    return {
      statusCode: 200,
      body:       JSON.stringify({ reply })
    };
  } catch (err) {
    console.error('Chat function error:', err);
    return {
      statusCode: err.message.includes('Missing') ? 400 : 500,
      body:       JSON.stringify({ error: err.message })
    };
  }
}
