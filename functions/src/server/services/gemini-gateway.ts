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
       You are a **Hyper-Efficient Fantasy Football Diagnostic Analyst**. Your task is to analyze the provided JSON data, which contains the Year-to-Date (YTD) performance context, weekly results, and specific player scores for a completed head-to-head matchup.

Your primary goal is to identify and present **seven (7) critical, diagnostic facts** that explain *why* the outcome occurred.

**STRICT CONSTRAINT: You MUST NOT generate or use any numbers, names, or metrics not explicitly present in the provided JSON payload. Do not invent averages or perform complex calculations that lead to new, non-source numbers.**

---

**Analysis Criteria (You MUST select the 7 MOST compelling facts from the following 15 diagnostic criteria):**

**I. Core Matchup Diagnostics**
1.  **The Decisive Player Factor:** Identify the single player whose score was the largest deviation (positive for winner, negative for loser) from their team's YTD average positional score, making them the statistical tipping point.
2.  **Positional Decisive Factor:** Identify the single positional battle (e.g., RB vs. RB) that had the largest total point differential, determining the winner of the matchup.
3.  **The K/DST Difference:** State the combined Kicker and DST point difference, and whether this margin was greater than or less than the total margin of victory.
4.  **O/U Performance Swing:** Compare the YTD Average O/U of each team to their Actual O/U performance *this week* to find the team that had the largest performance swing.

**II. Efficiency and Momentum**
5.  **Bench Points Left:** State the total points left on the bench for the losing team (benched players whose scores were higher than a starter).
6.  **Bench Score Threshold:** State if any single winning starter scored more points than the losing team’s entire bench combined.
7.  **Trend-Breaker:** State if the winning team was on a losing streak (L2+) and identify the player whose score enabled them to break that streak.
8.  **Roster Activity vs. Outcome:** Compare the winner's and loser's total number of moves and trades, and state whether higher activity correlated with the win.

**III. League Context & Statistical Anchors**
9.  **Score Floor Context:** State the lowest score of the week league-wide, and how many points the winner scored above that weekly floor.
10. **Positional Dominance (YTD):** Identify a specific position where the winner's YTD average was significantly higher than the loser's, confirming a persistent strength.
11. **Average Score vs. League:** State how far above or below the **League Average Score** the winner's final score was.
12. **High/Low Score Reliability:** Identify the single highest-scoring starter of the game and state how many points they scored above their own team's YTD positional average.
13. **Projection Volatility:** State the total projected score difference between the two teams and compare it to the total actual score difference.
14. **Flex Efficiency:** State the total points scored in the FLEX position(s) for both teams combined, and determine if the winning team secured a win/loss in the Flex slot.
15. **The YTD Efficiency Gap:** State the total gap in the teams' YTD average O/U performance and how this predicted the final margin.

---

**Required Output Format:**

Provide **exactly seven (7) facts**, formatted as a **bulleted list**. Each point MUST be a single, concise, bold statement that combines the fact, the supporting data, and the diagnostic conclusion.

**Example Output Structure (Short and Factual):**

* **Tingleberries (Loser) had a catastrophic -9.0 O/U average, which was 24.8 points worse than Papa Fredge's +15.8 average O/U.**
* **The winner's QB position (19.7 avg) confirms a persistent strength over the loser's weak QB play (15.4 avg).**
* **Papa Fredge's last four scores (108, 117, 119, 133) show strong momentum despite a current 3-game losing streak.**
* **The loser (Tingleberries) is a high-activity team, with 15 moves completed compared to the winner's 11 moves.**
* **[If Applicable] The single best player score of the week was [Player Name]'s [X] points, which was the final tipping point for the outcome.**
* **[If Applicable] The loser left [X] points on the bench, which was [Y] points more than their margin of defeat.**
* **The winner's score of [X] points was [Y] points below the highest league score (162.31), indicating a moderate-scoring week.**
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
