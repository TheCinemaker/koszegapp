import { GoogleGenerativeAI } from '@google/generative-ai';
import { CONFIG } from './config.js';

const genAI = new GoogleGenerativeAI(CONFIG.GEMINI_API_KEY || 'dummy-key');

export function getModel(type) {
    switch (type) {
        case "classifier":
            return genAI.getGenerativeModel({
                model: "gemini-2.5-flash",
                generationConfig: {
                    temperature: 0.3,
                    maxOutputTokens: 20
                }
            });

        case "complex":
            return genAI.getGenerativeModel({
                model: "gemini-2.5-pro",
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 1000
                }
            });

        case "default":
        default:
            return genAI.getGenerativeModel({
                model: "gemini-2.5-flash",
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 800
                },
                tools: [
                    { googleSearch: {} } // Enable search for default model
                ]
            });
    }
}
