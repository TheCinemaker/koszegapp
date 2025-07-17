// functions/chat.mjs
import OpenAI from 'openai';
import { searchWeb } from './search.js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const functions = [
  {
    name: 'searchWeb',
    description: 'Keresés a weben releváns információkért',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'A keresési lekérdezés' }
      },
      required: ['query']
    }
  }
];

export async function handler(event) {
  try {
    const { messages: rawMessages } = JSON.parse(event.body);
    if (!rawMessages) throw new Error('Missing messages payload');

    const chatMessages = rawMessages.map(m => ({
      role:    m.role,
      content: m.content
    }));

    // 1) Modell eldönti, hív‑e függvényt
    const response = await openai.chat.completions.create({
      model:         'gpt-4o-mini',
      messages:      chatMessages,
      functions,
      function_call: 'auto'
    });
    const msg0 = response.choices[0].message;
    console.log('🧠 openai response:', JSON.stringify(msg0, null, 2));

    let reply;

    if (msg0.function_call?.name === 'searchWeb') {
      // 2) Ha kérte, futtassuk a keresést
      console.log('🔔 model asked for function_call:', msg0.function_call);
      const { query } = JSON.parse(msg0.function_call.arguments);
      console.log('🕵️ parsed args:', query);

      const results = await searchWeb(query);
      console.log('🔎 searchWeb results:', results);

      // 3) Visszaküldjük a találatokat a modellnek
      const followUp = await openai.chat.completions.create({
        model:    'gpt-4o-mini',
        messages: [
          ...chatMessages,
          msg0,
          {
            role:    'function',
            name:    'searchWeb',
            content: JSON.stringify(results)
          }
        ]
      });
      reply = followUp.choices[0].message.content;
    } else {
      // 4) Ha nem kért keresést, marad a sima válasz
      console.log('🚫 model did NOT call searchWeb.');
      reply = msg0.content;
    }

    return {
      statusCode: 200,
      body:       JSON.stringify({ reply: reply.trim() })
    };
  } catch (err) {
    console.error('Chat function error:', err);
    return {
      statusCode: err.message.includes('Missing') ? 400 : 500,
      body:       JSON.stringify({ error: err.message })
    };
  }
}
