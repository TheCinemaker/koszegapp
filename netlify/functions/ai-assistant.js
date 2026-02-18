import { runAI } from './ai-core/index.js';

export async function handler(event) {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    try {
        if (!event.body) {
            throw new Error("No body provided");
        }

        const { query, conversationHistory = [] } = JSON.parse(event.body);

        if (!query) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Query is required' }),
            };
        }

        // Run the AI Engine
        const result = await runAI({
            query,
            history: conversationHistory
        });

        // Ensure result has the expected structure for frontend
        // Frontend expects: { role: 'assistant', content: string, action: object }
        // AI Core returns: { text: string, action: object, confidence: number }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                role: 'assistant',
                content: result.text,
                action: result.action,
                debug: {
                    confidence: result.confidence,
                    intent: result.intent // If we passed intent through, but we didn't in runAI return.
                }
            }),
        };

    } catch (error) {
        console.error('Handler error:', error);
        return {
            statusCode: 200, // Return 200 to show error in UI
            headers,
            body: JSON.stringify({
                role: 'assistant',
                content: "Most nem tudok válaszolni, de megmutatom a fő programokat.",
                action: { type: "navigate_to_events", params: {} },
                debug: process.env.NODE_ENV === 'development' ? error.message : undefined
            })
        };
    }
}

