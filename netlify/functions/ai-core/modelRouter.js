import { GoogleGenerativeAI } from '@google/generative-ai';
import { SYSTEM_PROMPT } from "./prompts.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export function getModel({ enableSearch = false, systemInstruction = null } = {}) {
    // Single efficient model for all response generation
    const modelName = "gemini-2.5-flash";

    const config = {
        model: modelName,
        generationConfig: {
            temperature: 0.7, // Slightly creative but focused
            maxOutputTokens: 1000,
        }
    };

    if (systemInstruction) {
        config.systemInstruction = systemInstruction;
    }

    if (enableSearch) {
        config.tools = [{ googleSearch: {} }];
    }

    return genAI.getGenerativeModel(config);
}
