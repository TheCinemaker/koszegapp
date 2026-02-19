export function getFallbackResponse(query) {
    return {
        text: "Nem értettem pontosan. Miben segíthetek? Parkolást, programokat, látnivalókat vagy szállást keresel?",
        action: null,
        confidence: 0.3
    };
}
