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
        let toReturn = '';
        for (const part of response?.candidates?.[0]?.content?.parts ?? []) {
            // Based on the part type, either show the text or save the image
            if (part.text) {
                toReturn = part.text;
                console.log(part.text);
            } else if (part.inlineData) {
                const imageData = part.inlineData.data ?? '';
                const buffer = Buffer.from(imageData ?? '', 'base64');
                fs.writeFileSync('gemini-native-image.png', buffer);
                console.log('Image saved as gemini-native-image.png');
                toReturn = imageData;
            }
        }
        return toReturn;
    };
}
