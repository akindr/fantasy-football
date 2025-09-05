import { GoogleGenAI, Modality } from '@google/genai';
import * as fs from 'node:fs';

export class GeminiGateway {
    ai: GoogleGenAI;

    constructor(apiKey: string) {
        this.ai = new GoogleGenAI({ apiKey });
    }

    generateImage = async (prompt: string) => {
        const response = await this.ai.models.generateContent({
            model: 'gemini-2.0-flash-preview-image-generation',
            contents: prompt,
            config: {
                responseModalities: [Modality.TEXT, Modality.IMAGE],
            },
        });
        for (const part of response?.candidates?.[0]?.content?.parts ?? []) {
            // Based on the part type, either show the text or save the image
            if (part.inlineData) {
                const imageData = part.inlineData.data ?? '';
                const buffer = Buffer.from(imageData ?? '', 'base64');
                return buffer;
            }
        }
        return null;
    };
}
