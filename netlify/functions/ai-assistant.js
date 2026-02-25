/**
 * ai-assistant.js – KőszegAI v2.1 Entry Point
 * Netlify serverless function.
 * 
 * CRITICAL: Frontend MUST send Authorization: Bearer <JWT> header.
 * Without it, Supabase RLS will reject all DB writes.
 */
import { runAI } from './ai-core-v2/index.js';

export async function handler(event) {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    try {
        if (!event.body) throw new Error("No body provided");

        const { query, conversationHistory = [], context = {} } = JSON.parse(event.body);

        if (!query) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Query is required' })
            };
        }

        // Extract JWT from Authorization header
        const token = event.headers.authorization?.replace('Bearer ', '')
            || event.headers.Authorization?.replace('Bearer ', '');

        // Run v2 AI Engine
        const result = await runAI({
            query,
            history: conversationHistory,
            frontendContext: context,
            token
        });

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                role: 'assistant',
                content: result.text,
                action: result.action ?? null,
                sessionState: result.newState ?? null  // ← guest state passback
            })
        };

    } catch (error) {
        console.error('AI handler error:', error);
        return {
            statusCode: 200, // Return 200 so UI shows the error gracefully
            headers,
            body: JSON.stringify({
                role: 'assistant',
                content: `Sajnos hiba történt: ${error.message}`,
                action: null,
                debug: error.message
            })
        };
    }
}
