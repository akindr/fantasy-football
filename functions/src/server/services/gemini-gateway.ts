import { GoogleGenAI, Modality } from '@google/genai';
import { TEAM_CONTEXT } from '../utils/schwifty-team-context';
import { TeamManager, TransformedPlayer, type TransformedMatchup } from '../data-mappers';
import { logger } from './logger';

const IMAGE_PROMPTS = [
    "A whimsical and fantastical scene where ${personA} floats triumphantly, a glowing aura of victory surrounding them, while ${personB} sits defeated amidst wilted flowers under a soft, glowing twilight sky. The art is in the hand-drawn Studio Ghibli style, with an air of wonder and gentle sadness. The scene is bathed in soft, ethereal light, with a single firefly landing on a defeated ${personB}'s hand.",
    'A poignant and emotional scene from a Pixar film, where a triumphant ${personA} stands with a proud smile, gently offering a hand to a crestfallen and tearful ${personB}, whose shoulders are slumped in defeat. The lighting is warm and inviting, but the expressions tell a story of hard-won victory and deep sadness.',
    'An epic, fairy-tale style illustration of a victorious ${personA} standing boldly over a kneeling, defeated ${personB}. The characters are drawn with clean lines and classic proportions, set against a beautifully detailed and idealized landscape in the style of classic Disney animation. The lighting is dramatic, with a spotlight on the triumphant ${personA} and a looming shadow over the defeated ${personB}.',
    'A dynamic, action-packed scene of a victorious ${personA} standing over a defeated ${personB}. The composition is heroic and bold, with a vibrant energy surrounding ${personA}, while ${personB} is left in a state of exhaustion, dust, and debris. The scene is full of visual energy, with motion lines and a sense of high-stakes combat.',
    "A gritty and atmospheric scene featuring a triumphant ${personA} walking away from a defeated and heartbroken ${personB}, who is huddled in a rain-slicked, neon-lit city alley. The style is dark and moody, with high contrast, dramatic shadows, and a serious, noir-like tone. The lighting from a single streetlamp highlights ${personA}'s confident form while leaving ${personB} in a shadow of despair.",
    "A retro-futuristic, cinematic image of a victorious ${personA} standing over ${personB}, who is disarmed and kneeling on a desolate alien planet. The technology looks worn and lived-in, capturing the 'used universe' aesthetic. The image has a cinematic feel, with wide shots and dramatic lighting from a twin sun setting over their conflict.",
    "An epic, high-fantasy scene where a victorious ${personA} stands tall over a defeated and weary ${personB}, their sword held aloft. The scene is majestic and grand, with a focus on natural elements like wind-swept trees and rocky terrain. The lighting is dramatic, with shafts of light breaking through the clouds to highlight ${personA}'s legendary victory.",
    "A magical and enchanting illustration of a victorious ${personA} with a glowing wand and a look of triumph, while a dejected ${personB} sits on a pile of books, their broken wand beside them. The light from ${personA}'s spell illuminates the dusty, detailed surroundings, creating a sense of magical triumph.",
    "A soft, ethereal illustration of a confident ${personA} gazing away, their head held high, while a tearful ${personB} is painted with translucent washes of color and blurred edges. The scene has a dreamy and gentle feel that contrasts with the emotional pain of ${personB}'s defeat.",
    "A classical and textural portrait of a victorious ${personA} with a triumphant expression, while a defeated ${personB} is in the background, their face blurred and sad, with rich, deep colors and visible brushstrokes. The lighting is chiaroscuro, with dramatic contrasts that highlight ${personA}'s victory.",
    "A meticulously detailed and photorealistic 3D render of a triumphant ${personA} standing over a defeated ${personB} in a sleek, digitally lit environment. The surfaces are smooth, with a focus on accurate textures and precise digital lighting that highlights ${personA}'s victory and ${personB}'s failure.",
    'A delicate and gentle illustration of a smiling ${personA} with their back to a dejected and slumped ${personB}, created with a soft, chalky texture and a muted, soothing color palette that belies the underlying conflict. The image is soft and gentle, with a dreamlike quality that makes the hidden conflict all the more poignant.',
    'A bold and simple illustration of a victorious ${personA} with their weapon held high, while a defeated ${personB} lies in a stylized heap. The style has a minimalist and expressive feel, with limited colors and a focus on their opposition. The rough texture of the chalk gives the scene a raw, unpolished energy.',
    "A vibrant and dynamic anime-style image of a triumphant ${personA} with a final blow, while a defeated ${personB} is in the background, a look of shock and despair on their face. The action is explosive, with bright, dramatic energy effects and fast motion lines that show ${personA}'s victory.",
    'A playful and humorous cartoon of a triumphant ${personA} celebrating a victory, while a comically over-the-top defeated ${personB} is shown with a bruised face and an exaggerated expression of sadness. The scene is full of bright, flat colors and a lighthearted tone, with physical gags and exaggerated movement.',
    "A classic comic book panel of a triumphant ${personA} with a clenched fist, standing over a defeated and battered ${personB}. The image features thick ink outlines, bold colors, and an onomatopoeia like 'KAPOW!' or 'THWACK!', with a gritty, dynamic feel. The scene is composed like a single panel from a comic book, with a sense of frozen action and high impact.",
    'A sophisticated graphic novel-style image of a victorious ${personA} calmly walking away from a defeated ${personB}, who is left slumped against a wall in a defeated position. The art is highly detailed and expressive, with a specific, limited color palette and a cinematic, mature tone. The scene uses dramatic angles and subtle body language to convey a sense of unspoken triumph.',
    'A playful, 90s-inspired illustration of a triumphant ${personA} with a wide grin, while a tearful ${personB} is in the background, surrounded by scattered toys. The characters are drawn with the iconic squiggly lines and exaggerated, bulbous proportions of the Rugrats style.',
    'A high-resolution, sharp, and hyper-detailed image of a cold and tense moment where a victorious ${personA} looks down at a defeated ${personB}. The focus is on perfect rendering of facial expressions, body language, and realistic details that convey their triumph and animosity. The lighting is subtle, but highlights the micro-expressions on their faces.',
    'A dramatic, high-contrast, black and white image of a victorious ${personA} with a slight smirk on their face, standing over a defeated and weary ${personB}. The scene uses strong silhouettes, low-key lighting, and a sense of intrigue. The entire scene is drenched in shadow and harsh light, creating a sense of inescapable danger.',
    'A pair of formal, traditional portraits of a victorious ${personA} with a proud smile, while a portrait of a defeated ${personB} is on the opposite wall, with a subtle look of sadness on their face. The portraits are in a classical style, framed, and lit to look like real paintings. The lighting is soft but precise, drawing attention to their hostile expressions.',
    'An explosive and chaotic scene of a high-tech robot battle, with a robot piloted by a victorious ${personA} standing over a defeated, smoking robot piloted by a sad ${personB}. The image is full of sparks, laser fire, and a sense of futuristic warfare. The scene is dynamic, with glowing energy effects and debris flying through the air.',
    'A wide, cinematic shot of a triumphant ${personA} walking away from a defeated ${personB}, who is laying on the ground. The image is dynamic, with a wide aspect ratio, subtle motion blur, and a focus on high-stakes drama. The scene is full of movement, with fast cuts and a sense of unyielding energy.',
    'A whimsical, early animation style image of a comical, slapstick fight, where a happy ${personA} is celebrating a victory, while a sad ${personB} is laying in a defeated position. The characters are rendered in stark black and white, with simple shapes and a jerky, silent-film feel. The scene has a retro, simple, and quirky charm.',
    'A monumental, sweeping image of a grand confrontation where a victorious ${personA} stands over a defeated ${personB} on a vast and dramatic landscape. The scene should convey a sense of destiny, legend, and immense scale. The lighting is dramatic, with sun rays breaking through clouds to highlight the victorious ${personA}.',
    'A futuristic, neon-drenched scene where a victorious ${personA} is standing over a defeated ${personB} in a rain-slicked, high-tech cityscape. The image is filled with glowing holographic advertisements and intricate cybernetics, with a moody and rebellious feel. The scene is lit by vibrant, clashing neon signs that reflect off the wet streets, creating a sense of urban claustrophobia.',
    'A detailed, anachronistic scene where a victorious ${personA} is standing over a defeated ${personB}, whose steam-powered gadget is broken. The art is rich with brass gears, copper pipes, and ornate Victorian clothing, capturing an adventurous and inventive mood. The scene is bathed in the warm, diffused light of steam and cogs.',
    'A dark and dramatic illustration of a victorious ${personA} with a smirk, standing over a defeated ${personB} in an ornate, crumbling castle hall. The scene should have a sense of romantic dread and dark elegance. The lighting is high-contrast, with beams of light piercing the darkness.',
    'A desolate, high-contrast image of a victorious ${personA} standing over a defeated ${personB} amidst the ruins of a collapsed city. The mood is one of survival and desperation, with a gritty and somber atmosphere. The scene is stark, with a single, harsh light source casting long shadows, emphasizing their isolation.',
    'A dreamlike and illogical scene where a victorious ${personA} stands over a defeated ${personB} in a bizarre, impossible landscape, with their conflict playing out through distorted objects and strange shadows. The image has a mysterious and thought-provoking mood. The lighting is soft and otherworldly, making the impossible seem commonplace.',
    'A bold and graphic image of a triumphant ${personA} with a wide grin, while a defeated ${personB} is shown with a tearful expression. The scene is filled with vibrant, flat colors, heavy outlines, and halftone dots, capturing a playful and energetic mood. The lighting is bright and flat, like a comic book panel.',
    'A soft, painterly image where the conflict between ${personA} and ${personB} is hinted at through blurred forms and the play of light and shadow. A victorious ${personA} is in the light, while a defeated ${personB} is in the shadow. The mood is serene and emotional, despite the underlying tension.',
    'A raw, unfinished image of a triumphant ${personA} with a wide grin, drawn with light pencil lines and quick, expressive scribbles, while a defeated ${personB} is drawn with smudges and dark scribbles on a textured, off-white background. The scene has an immediate and personal feel.',
    'A retro, nostalgic scene of a victorious ${personA} with a triumphant pixelated pose, while a defeated ${personB} is a low-resolution heap of pixels. The image has a charmingly vintage, low-resolution aesthetic. The scene is lit with simple, blocky light sources that create a retro gaming feel.',
    'A classic, worn-in image of a victorious ${personA} with a confident pose, while a defeated ${personB} is shown with a sad expression. The scene uses muted, aged colors, bold typography, and a slightly distressed texture, evoking a sense of golden-age cinema. The lighting is stylized and warm, with a vintage, filtered look.',
    'A striking, stylized scene where a triumphant ${personA} is posing dramatically in haute couture fashion, their victory expressed through their bold poses and intense gazes. The lighting is sharp and the mood is glamorous and theatrical. The scene is lit with precise, dramatic light that highlights the fabrics and their intense expressions.',
    'A dynamic manga-style scene of a victorious ${personA} standing over a defeated ${personB}, their hair flowing in the wind. The image uses sharp, detailed lines, a focus on motion, and a powerful sense of action and drama. The scene is high-contrast, with ink-like shadows and speed lines that enhance the fast-paced action.',
    'A stylish, black and white image of a triumphant ${personA} with a slight smile, standing over a defeated ${personB} in a classic urban setting. The mood is full of suspense and intrigue. The scene is lit by a single, harsh light source that creates long, dramatic shadows.',
    'A retro-futuristic image of a victorious ${personA} with their aura glowing brightly, while a defeated ${personB} is shown with a dim, flickering aura. The scene is vibrant with electronic colors, capturing a nostalgic and energetic mood. The lighting is from neon lights and the setting sun, creating a vibrant, glowing scene.',
    "A whimsical scene that looks like it's made from layered, colored paper, with a triumphant ${personA} standing over a defeated ${personB}. The image has a handcrafted, charming feel. The lighting is soft and diffused, creating clean, distinct shadows for each layer.",
    'An enchanting scene of a magical confrontation where a triumphant ${personA} is surrounded by a magical glow, while a defeated ${personB} is shown with a sad expression. The image has a sense of classic fantasy and playful magic. The scene is bathed in a soft, magical glow from unseen sources, creating a sense of fantasy and wonder.',
    'A bleak and oppressive scene where a triumphant ${personA} stands over a defeated ${personB}, who is huddled in a gray, over-monitored future society. The image is stripped of color and has a sense of hopelessness and conformity. The lighting is harsh and sterile, from overhead fluorescent lights, casting long, stark shadows.',
    "A sweeping, dramatic scene of a triumphant ${personA} standing on a high cliff overlooking a vast fantasy landscape, with a defeated ${personB} below. The art style is hyper-detailed and cinematic, with a focus on epic scale, intricate armor, and a stormy sky. The lighting is dramatic, with shafts of light breaking through the clouds to highlight ${personA}'s victory.",
    'A pixelated, side-scrolling scene of a triumphant ${personA} on a high platform, celebrating a victory, while a defeated ${personB} is in a defeated pose. The art is in a classic 16-bit style, with vibrant, low-resolution sprites, simple backgrounds, and limited but clean colors. The mood is nostalgic and tense, like a final boss battle.',
    'A dark and terrifying scene where a triumphant ${personA} is standing over a terrified ${personB} in a cramped, rotting, and dimly-lit space. The art is gritty and high-contrast, with a focus on eerie shadows and a suffocating sense of paranoia. The lighting is from a single flashlight, creating a sense of claustrophobic danger.',
    'A high-impact, first-person view of a victorious ${personA} standing over a defeated ${personB}, who is laying on the ground. The foreground shows the hands and weapon of ${personA}, with a clear view of a defeated ${personB}. The scene is full of visual noise from explosions and gunshots, with a high-stakes, adrenaline-fueled mood.',
    'A dramatic, colorful VS screen where a triumphant ${personA} is striking a dynamic, aggressive pose against a stylized background, while a defeated ${personB} is shown in a sad pose. The art is full of exaggerated features, special effects like electric auras or fire, and vibrant colors, capturing a competitive, over-the-top, and kinetic mood.',
    'A flamboyant and emotionally charged battle scene where a triumphant ${personA} is standing over a defeated ${personB}. The art style is cinematic and anime-inspired, with intricate character designs and a focus on grand, dramatic gestures. The lighting is highly stylized, with bright, magical glows and dramatic lens flares.',
    'A dusty, cinematic standoff where a triumphant ${personA} has their hand on their hip, looking down at a defeated ${personB} in the middle of a sun-baked street. The scene has a grainy, film-like texture, with the sun casting long shadows and a palpable sense of tension. The mood is classic and gritty, with a feeling of high noon.',
    'A stunning and terrifying image of a triumphant ${personA} standing on a skyscraper rooftop, while a defeated ${personB} is huddled in the corner, with a massive, city-destroying monster fighting another of its kind in the background. The art is dramatic and awe-inspiring, with a focus on both human drama and colossal scale. The lighting is from the explosions of the monster battle, casting a terrifying glow on the scene.',
    'A dark, tense scene where a triumphant ${personA} is walking away from a defeated ${personB} in an isolated cabin in the woods at night. The art is gritty and high-contrast, with a focus on suspense and psychological terror. The lighting is from a flickering lantern or moonlight, creating a creepy, unsettling mood.',
    'An unsettling, disorienting image of a psychological triumph where a confident ${personA} is looking at a terrified ${personB} in a sterile, modern room. The art uses distorted perspectives, blurred focus, and subtle visual tricks to create a feeling of paranoia and confusion. The lighting is flat and unforgiving, emphasizing the uneasy and cerebral conflict.',
    "A low-fidelity, 'found footage' style image of a triumphant ${personA} with a big smile, while a defeated ${personB} is shown with a sad expression. The scene looks like it was captured on a cheap digital camera, with lens flares, motion blur, and a mundane setting. The mood is ironic and uncomfortable, with a sense of forced reality.",
    'A gritty and adventurous image of a triumphant ${personA} standing over a defeated ${personB} in a remote space port, which looks like a dusty frontier town with spaceships instead of horses. The art style is a blend of rugged western aesthetics and futuristic technology. The lighting is from alien suns and glowing holographic signs, creating a unique, pioneering atmosphere.',
    'A candid, spontaneous image of a triumphant ${personA} with a victorious expression, while a defeated ${personB} is shown with a sad expression. The scene has a raw, unposed feel, with other people moving around them and a gritty, realistic texture. The lighting is natural and direct, like a flash from a camera, capturing the moment as it happens.',
    'A surreal, up-close image of a victory where a tiny, triumphant ${personA} is standing on a gigantic object, like a single blade of grass, while a defeated ${personB} is shown in a defeated pose. The focus is on immense detail and texture, with a sense of scale and otherworldly strangeness. The lighting is highly focused, as if from a specialized camera lens.',
    'A charming, miniaturized scene of a triumphant ${personA} standing over a defeated ${personB} within a seemingly small, toy-like world. The image uses selective focus to make a large scene look like a miniature diorama, giving the conflict a whimsical and distant feel. The colors are vibrant and saturated, like a toy set.',
    'A nostalgic, low-fi image of a victorious ${personA} with a triumphant look, while a defeated ${personB} is shown with a sad expression. The scene is framed by a white border, with faded colors and a slightly blurry, retro aesthetic. The mood is bittersweet and melancholic, as if looking at an old memory.',
    'A timeless, high-contrast, black and white photograph of a triumphant ${personA} with a smug expression, while a defeated ${personB} is shown with a sad expression. The focus is on the drama of light and shadow, and the emotional expressions captured in their faces and body language. The mood is classic, dramatic, and elegant.',
    'An image of a triumphant ${personA} standing over a defeated ${personB} in a horrific, mind-bending confrontation amidst a landscape of non-Euclidean geometry and impossible architecture. The mood is one of cosmic horror and impending madness, with a sense of overwhelming, alien chaos. The lighting is from the colossal, tentacled entity.',
    'A grand, mythical scene of a triumphant ${personA} with their hand on their hip, looking down at a defeated ${personB} in the backdrop of an ancient temple. The art style is inspired by Egyptian hieroglyphs and art, with divine figures and mythical creatures looking on. The mood is one of ancient power and divine conflict, lit by a harsh, golden sun.',
    'A dramatic and epic scene of a triumphant ${personA} with their sword held high, standing over a defeated ${personB} in a grand, stone mead hall in Asgard. The mood is one of strength and destiny, with lightning flashing outside and ancient runes glowing on the walls. The scene is lit by the flickering firelight of the hall, creating a sense of legendary power.',
    'A striking, stylized, and high-fashion image of a triumphant ${personA} with a proud pose, while a defeated ${personB} is shown with a sad expression. The art is a mix of high-fashion photography and surrealist elements, with dramatic poses and vibrant, theatrical lighting that highlights their luxurious, avant-garde outfits.',
    'A stylish, geometric scene of a confrontation between a triumphant ${personA} and a defeated ${personB} in a sleek, elegant, and stylized 1920s setting. The art is focused on clean lines, symmetrical patterns, and a limited color palette of golds, blacks, and deep reds. The mood is sophisticated and elegant, with a tense, dramatic feel.',
    'A gloomy and atmospheric scene of a rivalry unfolding on a cobblestone street in a perpetually foggy London, with a triumphant ${personA} walking away from a defeated ${personB}. The art is dark and moody, with a focus on gas lamps, horse-drawn carriages, and a pervasive sense of urban decay and mystery. The lighting is dim and yellow, creating a sense of foreboding.',
    'A breathtaking, high-contrast image of a triumphant ${personA} standing over a defeated ${personB} inside a massive, ornate Gothic cathedral. The art is highly detailed, with a focus on intricate stone carvings and the light filtering through towering stained glass windows. The mood is reverent and dramatic, with a sense of solemnity.',
    'A surreal, digital scene of a victorious ${personA} in a dreamlike, retro-futuristic landscape, while a defeated ${personB} is shown with a sad expression. The art features floating Greek statues, pink and purple gradients, and glitch effects, with a calming, yet unnerving sense of digital melancholy. The lighting is from glowing neon lights and the digital sun.',
    'A retro, classic video game-style scene of a victorious ${personA} with a triumphant pixelated pose, while a defeated ${personB} is shown with a defeated expression. The art is in a simple, low-resolution 8-bit or 16-bit style, with limited colors and a focus on simple, readable sprites. The mood is nostalgic and energetic, like a classic side-scrolling video game.',
];

export type HeadToHeadYearlyData = {
    year: string;
    matchups: MatchupSummary[];
};

export type MatchupSummary = {
    id: string;
    marginOfVictory: number;
    winningManager: TeamManager;
    winningTeam: string;
    isPlayoffGame: boolean;
} & TransformedMatchup;

// TODO: Prompt tuning for getting the matchup info - DO NOT hallucinate
export class GeminiGateway {
    ai: GoogleGenAI;

    constructor(geminiApiKey: string) {
        const apiKey = geminiApiKey ?? '';

        if (!apiKey) {
            throw new Error('Gemini API key is not set');
        }
        this.ai = new GoogleGenAI({ apiKey });
    }

    generateImagePrompt = (
        teamA: string,
        teamB: string,
        teamADescription: string,
        teamBDescription: string
    ) => {
        const prompt = IMAGE_PROMPTS[Math.floor(Math.random() * IMAGE_PROMPTS.length)];
        return prompt
            .replaceAll('${personA}', teamA)
            .replaceAll('${personB}', teamB)
            .concat(`. Some additional information about "${teamA}" is: ${teamADescription}`)
            .concat(`. Some additional information about "${teamB}" is: ${teamBDescription}`)
            .concat('. Do not include any text in the image.');
    };

    // helper to simplify the player data
    simplifyPlayerData = (players: TransformedPlayer[]) => {
        return players.map(player => ({
            name: player.name,
            position: player.position,
            points: player.stats?.points,
            isStarter: player.isStarter,
        }));
    };

    getMatchupInsights = async (matchups: HeadToHeadYearlyData[]) => {
        // Simplify the data model as much as possible for Gemini
        matchups.forEach(yearlyMatchups => {
            const matchups = yearlyMatchups.matchups;
            matchups.forEach(matchup => {
                // @ts-expect-error simply reducing the data model
                matchup.team1.players = this.simplifyPlayerData(matchup.team1.players);
                // @ts-expect-error simply reducing the data model
                matchup.team2.players = this.simplifyPlayerData(matchup.team2.players);
            });
        });

        const matchupContext = JSON.stringify(matchups);
        const systemInstructions = `You are a Fantasy Football Analyst specializing in historical head-to-head matchups and rivalry narratives.
            Your task is to analyze the provided JSON data, which contains the complete historical matchup results (scores, rosters, and player statistics) between two fantasy teams, and identify the top five (5) most interesting and actionable narratives or historical facts about this specific rivalry.

            Analysis Criteria (Prioritize facts that align with these categories):
            1.  **The Dominance Narrative (Streaks & Records):** Look for significant win/loss streaks (3+ games), the all-time head-to-head record, or who has a winning record in playoff/championship games.
            2.  **The Blowout Factor:** Identify the largest margin of victory in the rivalry's history ("Worst Beatdown"). Calculate the average margin of victory for the series.
            3.  **Positional Weakness/Strength:** Analyze weekly positional scoring (QB, RB, WR, etc.) over multiple seasons. Does one team consistently outscore the other at a specific position, regardless of the final outcome? (e.g., Team A always wins the RB score battle, but loses the WR score battle).
            4.  **The "Nemesis" Player:** Identify an individual player (from the provided roster data) who has historically performed significantly better or worse than their season average specifically when playing this opponent.
            5.  **The Missed Opportunity:** Identify a specific historical matchup where a manager lost despite having a superior overall team, often due to a player being left on the bench who scored more than a starter ("Bad Bench Decision").

            Required Output Format: Provide exactly five (5) distinct facts, formatted as a numbered list with an insightful title for each. Each point must state the fact, the supporting data, and a brief narrative explanation.
            `;

        const userPrompt = `
        **JSON Data:**
        ${matchupContext}
        `;

        try {
            const response = await this.ai.models.generateContent({
                model: 'gemini-2.5-flash', // Good for structured analysis and speed
                contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
                config: {
                    systemInstruction: systemInstructions,
                    temperature: 0.5, // Keep it slightly lower for factual analysis
                },
            });

            logger.info('--- Gemini Analysis ---');
            logger.info(response.text);
            return response.text;
        } catch (error) {
            logger.error('Error calling Gemini API:', error);
            return '';
        }
    };

    generateAllMatchupImages = async (matchups: TransformedMatchup[]) => {
        const images = await Promise.all(
            matchups.map(async matchup => {
                const winner =
                    matchup.team1.points > matchup.team2.points ? matchup.team1 : matchup.team2;
                const loser =
                    matchup.team1.points > matchup.team2.points ? matchup.team2 : matchup.team1;
                const teamA = TEAM_CONTEXT.find(team => team.id === winner.id);
                const teamB = TEAM_CONTEXT.find(team => team.id === loser.id);

                if (!teamA || !teamB) {
                    throw new Error('Team not found');
                }

                const prompt = this.generateImagePrompt(
                    teamA.name,
                    teamB.name,
                    teamA.description,
                    teamB.description
                );

                logger.info('prompt', { prompt });

                const response = await this.ai.models.generateContent({
                    model: 'gemini-2.5-flash-image-preview',
                    contents: prompt,
                    config: {
                        responseModalities: [Modality.IMAGE],
                    },
                });
                return {
                    response,
                    matchupId: matchup.id,
                };
            })
        );

        return matchups.map(matchup => {
            const generatedImage = images.find(image => image.matchupId === matchup.id);

            if (!generatedImage) {
                return matchup;
            }

            for (const part of generatedImage.response?.candidates?.[0]?.content?.parts ?? []) {
                if (part.inlineData) {
                    const imageData = part.inlineData.data ?? '';
                    const mimeType = part.inlineData.mimeType ?? '';
                    return {
                        ...matchup,
                        imageData,
                        mimeType,
                    };
                }
            }

            return matchup;
        });
    };

    // TODO take teams from UI
    generateMatchupImage = async (teamAID: string, teamBID: string) => {
        const teamA = TEAM_CONTEXT.find(team => team.id === teamAID);
        const teamB = TEAM_CONTEXT.find(team => team.id === teamBID);

        if (!teamA || !teamB) {
            throw new Error('Team not found');
        }

        const prompt = this.generateImagePrompt(
            teamA.mascot,
            teamB.mascot,
            teamA.description,
            teamB.description
        );

        logger.info('prompt', { prompt });

        const response = await this.ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: prompt,
            config: {
                responseModalities: [Modality.IMAGE],
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

    generateImage = async (prompt: string) => {
        const response = await this.ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: prompt,
            config: {
                responseModalities: [Modality.IMAGE],
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
