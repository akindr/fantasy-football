import { GoogleGenAI, Modality } from '@google/genai';

import { TeamManager, TransformedPlayer, type TransformedMatchup } from '../data-mappers';
import { logger } from './logger';
import { HeadToHeadSummaryData } from '../types';

export type HeadToHeadYearlyData = {
    year: string;
    matchups: MatchupSummary[];
};

export type MatchupSummary = {
    id: string;
    marginOfVictory: number;
    winningManager: TeamManager | null;
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

            **Analysis Criteria (You MUST select the 5 MOST compelling facts from this list of 8 categories):**

            1.  **The Dominance Narrative (Streaks & Records):** Look for significant win/loss streaks (3+ games), the all-time head-to-head record, or who has a winning record in playoff/championship games.
            2.  **The Blowout Factor:** Identify the largest margin of victory in the rivalry's history ("Worst Beatdown"). Calculate and state the average margin of victory across all matchups.
            3.  **Positional Weakness/Strength:** Analyze weekly positional scoring (QB, RB, WR, etc.) over multiple seasons. Does one team consistently outscore the other at a specific position, even if they lose the overall matchup? (e.g., Team A always wins the RB score battle, but loses the WR score battle).
            4.  **The "Nemesis" Player:** Identify an individual player (from the provided roster detail) who has historically performed **significantly better** than their season average specifically when playing this opponent.
            5.  **The Missed Opportunity (Bench Fails):** Identify a specific historical matchup where the losing manager had a benched player (IsStarter: false) who scored more points than a starter, and the point difference would have been enough to win the matchup.
            6.  **The Score Floor/Ceiling (Luck Factor):** Identify the game where one team had their highest score but still lost, or their lowest score but still won.
            7.  **The Roster Value Play (Efficiency):** Based on the points scored in rivalry matchups, identify a player who was added via waivers/trades (a high-value pick-up, often a player with a low season-long reputation) but was consistently a top scorer in the rivalry games.
            8.  **The Activity Narrative:** Identify the most active manager in the rivalry, based on the number of moves and trades they have made. Do they have a high remaining budget? Do they make a lot of moves?
            
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

    getThisYearMatchupInsights = async (matchups: HeadToHeadSummaryData) => {
        const matchupContext = JSON.stringify(matchups);
        const systemInstructions = `
        You are a professional Fantasy Football Matchup Review Analyst. Your task is to analyze the provided JSON data, which contains the Year-to-Date (YTD) performance context and specific player scores for a completed head-to-head matchup.

Identify and present **five (5) critical, diagnostic facts** that explain *why* the observed outcome occurred.

**Matchup Review JSON Data (Must include YTD Summaries AND MatchupRosterDetail):**
<INSERT_YOUR_PREVIOUS_MATCHUP_REVIEW_JSON_DATA_HERE>

---

**Analysis Criteria (You MUST prioritize facts that align with these categories to diagnose the result. These are in no particular order of importance):**

1.  **The Decisive Player Factor (The Hero/Goat):** Identify the single player whose score was the largest positive deviation (for the winner) or largest negative deviation (for the loser) from their team's average positional score, making them the most statistically responsible for the outcome.
2.  **The Trend-Breaker:** Did the team with the superior momentum (streaks or recent point trend) win the game? If not, identify the key data point that explains how the underdog was able to break the trend.
3.  **Positional Decisive Factor:** Identify the single position (QB, RB, WR, etc.) where the winning team's total score definitively crushed the losing team's score, making it the factual decisive factor for the final outcome.
4.  **The O/U Performance Swing:** Compare the YTD Average Over/Under Performance of each team to their actual Over/Under Performance *this week*. Which team's efficiency swing (positive or negative) most directly determined the win?
5.  **The Statistical Context:** Compare the final winning and losing scores to the **League Average Score** and the **Highest Score of the Season**. Was this matchup a high-scoring or low-scoring affair relative to the league landscape for that week?
6. **Sit start decisions:** Identify the players who were benched (IsStarter: false) and the players who were started (IsStarter: true) and the difference in points between the two. Would the outcome have been different if the manager made a different decision?

---

**Required Output Format:**

Provide **exactly five (5) distinct facts**, formatted as a numbered list with a bold, diagnostic title for each. Each point must state the key finding, the supporting data (Player Name, Points, O/U Deltas, Averages), and a brief, compelling analytical summary of *why* the factor determined the result.

Finally, summarize the highlights into a two to five sentence paragraph with a succinct conclusion that includes key findings and statistics.
        `;

        const userPrompt = `
        **Current Matchup JSON Data:**
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
