
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateAIResponse = async (prompt: string, context: string = ''): Promise<string> => {
    try {
        const systemInstruction = `
        You are the "Vetly AI Assistant", a highly intelligent, helpful and friendly virtual assistant for a Greek veterinary platform called Vetly.
        Your goal is to help pet owners with advice, app navigation, and finding vets.
        
        Key Rules:
        1. ALWAYS reply in GREEK (Ελληνικά).
        2. Keep answers detailed yet accessible.
        3. If the user asks for medical diagnosis, state clearly that you are an AI and they should visit a professional vet on the platform.
        4. Use the provided context (e.g., available vets or user pet info) to personalize the answer if relevant.
        
        Context: ${context}
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: prompt,
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.7,
            }
        });

        return response.text || 'Συγγνώμη, αντιμετώπισα ένα πρόβλημα. Παρακαλώ δοκιμάστε ξανά.';
    } catch (error) {
        console.error("Gemini API Error:", error);
        return "Υπήρξε ένα σφάλμα επικοινωνίας με τον AI βοηθό. Παρακαλώ ελέγξτε τη σύνδεσή σας.";
    }
};
