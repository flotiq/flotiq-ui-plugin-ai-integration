const PATH_MODEL_PATTERNS = [
    // Cloudflare Workers AI: /ai/run/@cf/meta/llama-3.1-8b-instruct
    // The name carries slashes, so it runs to the end of the path.
    /\/ai\/run\/(.+)$/i,
    // Azure OpenAI: the deployment name stands in for the model.
    /\/openai\/deployments\/([^/?#]+)/i,
    // Gemini native: /v1beta/models/gemini-2.0-flash:generateContent
    /\/models\/([^/?#:]+):[a-z]+/i,
];

export const modelFromUrl = (aiUrl) => {
    let pathname;

    try {
        pathname = new URL(aiUrl).pathname;
    } catch {
        return null;
    }

    for (const pattern of PATH_MODEL_PATTERNS) {
        const match = pathname.match(pattern);
        if (match?.[1]) return decodeURIComponent(match[1]);
    }

    return null;
};
