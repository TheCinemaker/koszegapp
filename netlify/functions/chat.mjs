import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function handler(event) {
  try {
    const { messages: rawMessages } = JSON.parse(event.body);
    if (!rawMessages) throw new Error('Missing messages payload');

    const chatMessages = rawMessages.map(m => ({
      role: m.role,
      content: m.content
    }));

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: chatMessages
    });

    const reply = response.choices?.[0]?.message?.content;
    if (!reply) throw new Error('No reply from OpenAI');

    return {
      statusCode: 200,
      body: JSON.stringify({ reply })
    };
  } catch (err) {
    console.error('Chat function error:', err);
    return {
      statusCode: err.message.includes('Missing') ? 400 : 500,
      body: JSON.stringify({ error: err.message })
    };
  }
}
