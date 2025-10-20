import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { GeminiGateway } from './services/gemini-gateway';
import { YahooGateway } from './services/yahoo-gateway';
import { logger } from './services/logger';
import { type TokenData } from './types';
import { DatabaseService } from './services/database-service';
import { firebaseAuthMiddleware } from './auth-middleware';
import { adminRouter } from './admin-routes';

dotenv.config();

function getApp(
    yahooClientId: string,
    yahooClientSecret: string,
    yahooRedirectUri: string,
    geminiApiKey: string,
    prefix: string = ''
) {
    const app = express();
    const geminiGateway = new GeminiGateway(geminiApiKey);
    const yahooGateway = new YahooGateway(yahooClientId, yahooClientSecret, yahooRedirectUri);
    const databaseService = new DatabaseService();

    // CORS configuration
    app.use(
        cors({
            origin: [
                'https://lvh.me:3000',
                'https://localhost:3000',
                'https://localhost:3002',
                'https://lvh.me:3002',
            ],
            credentials: true,
        })
    );

    // JSON + COOKIES middlewares
    app.use(express.json());
    app.use(cookieParser());

    // TODO move into gateway
    app.post(`${prefix}/oauth/token`, async (req: express.Request, res: express.Response) => {
        try {
            const { code } = req.body;
            logger.info('Requesting token', { code, redirectUri: yahooRedirectUri });

            const payload = new URLSearchParams({
                grant_type: 'authorization_code',
                redirect_uri: yahooRedirectUri,
                client_id: yahooClientId,
                client_secret: yahooClientSecret,
                code: code,
            });

            logger.info(payload);

            const tokenResponse = await fetch('https://api.login.yahoo.com/oauth2/get_token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: payload,
            });

            const tokenData: TokenData = await tokenResponse.json();
            tokenData.expiry_server_time = Date.now() + (tokenData.expires_in || 0) * 1000;

            logger.info('Token data', tokenData);

            if (!tokenData?.access_token) {
                throw new Error('Failed to get access token');
            }

            // Note this is a special-sauce cookie that Firebase won't strip
            res.cookie('__session', tokenData, {
                httpOnly: true,
                secure: true,
                maxAge: 1000 * 60 * 60 * 24 * 1, // 1 days
                sameSite: 'none',
            });

            res.json(tokenData);
        } catch (error) {
            logger.error('Token exchange error:', error);
            res.status(500).json({ error: 'Failed to exchange code for token' });
        }
    });

    // Proxy to get standings for the FF league
    app.get(`${prefix}/standings`, async (req: express.Request, res: express.Response) => {
        logger.info('Fetching standings', req.cookies);
        if (!req.cookies.__session) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        try {
            // TODO specify league id and year from UI
            const standings = await yahooGateway.getStandings(req, res);
            res.json(standings);
        } catch (e) {
            logger.error('Error fetching standings:', e);
            res.status(500).json({ error: 'Unexpected error', original: e });
        }
    });

    // Proxy to get matchups for the FF league
    app.get(`${prefix}/matchups`, async (req: express.Request, res: express.Response) => {
        if (!req.cookies.__session) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        try {
            const matchups = await yahooGateway.getMatchups(req, res);
            // const images = matchups;
            // DO NOT UNCOMMENT, shit is expensive
            // await geminiGateway.generateAllMatchupImages(matchups);
            // res.setHeader('Cache-Control', 'no-store');
            // res.setHeader('Pragma', 'no-cache');
            // res.setHeader('Expires', '0');
            res.json(matchups);
        } catch (e) {
            logger.error('Error fetching matchups:', e);
            res.status(500).json({ error: 'Unexpected error', original: e });
        }
    });

    // Debug endpoint to get available NFL games
    app.get(`${prefix}/games-debug`, async (req: express.Request, res: express.Response) => {
        if (!req.cookies.__session) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        try {
            const games = await yahooGateway.getGames(req, res);
            res.json(games);
        } catch (e) {
            logger.error('Error fetching games:', e);
            res.status(500).json({ error: 'Unexpected error', original: e });
        }
    });

    app.get(`${prefix}/generate-image`, async (req: express.Request, res: express.Response) => {
        logger.info('Generating image', { prompt: req.query.prompt });
        const prompt = req.query.prompt as string;
        const imageBuffer = await geminiGateway.generateImage(prompt);
        if (!imageBuffer) {
            res.status(500).json({ error: 'Failed to generate image' });
            return;
        }
        res.type('image/png');
        res.send(imageBuffer);
    });

    app.post(
        `${prefix}/data/awards`,
        firebaseAuthMiddleware,
        async (req: express.Request, res: express.Response) => {
            try {
                const {
                    week,
                    matchup,
                    imageURL,
                    team1,
                    team2,
                    title,
                    description,
                    matchupHighlights,
                } = req.body;
                if (week === undefined || matchup === undefined) {
                    res.status(400).json({
                        error: 'week and matchup are required in the request body',
                    });
                    return;
                }

                const awardData = {
                    imageURL,
                    team1,
                    team2,
                    title,
                    description,
                    matchupHighlights,
                };

                if (
                    !awardData.imageURL ||
                    !awardData.team1 ||
                    !awardData.team2 ||
                    !awardData.title ||
                    !awardData.description ||
                    !awardData.matchupHighlights
                ) {
                    res.status(400).json({
                        error: 'Request body is missing one or more required fields for award data: imageURL, team1, team2, title, description, matchupHighlights',
                    });
                    return;
                }

                const collection = 'awards';
                const doc = `week-${week}-matchup-${matchup}`;
                await databaseService.set(collection, doc, awardData);
                res.status(200).send({ success: true });
            } catch (e) {
                logger.error('Error writing to database:', e);
                res.status(500).json({ error: 'Unexpected error', original: e });
            }
        }
    );

    app.get(
        `${prefix}/admin/insights`,
        firebaseAuthMiddleware,
        async (req: express.Request, res: express.Response) => {
            try {
                /* TODO: We need to do the following:
                1. Get the entire scoreboard for the CURRENT year.
                2. Get the same data for previous seasons (there should be 5+). Not every team will be there, so we need to match on team ID
                Rivalry calculation
                Metric,Calculation,Insight
Overall Record,Total Wins - Total Losses (Head-to-Head only),Who has the historical edge?
Win Percentage,Wins / Total Matchups,A more standard comparison for an uneven number of games.
Average Margin,Average of (Winner's Score - Loser's Score),"The typical ""blowout"" factor in their games."
Worst Beatdown,The largest single-game point differential.,Defines the ultimate low point for the losing team and the trash-talk gold for the winner.
Max Win Streak,Longest consecutive wins by either manager.,Highlights periods of dominance for one side.
Clutch Record,Record in playoff/championship matchups (if applicable).,Who performs under pressure?
Average Score,Average Points For (PF) in all matchups.,Who generally scores better when they play each other?
                
                4. Player-centric. We need for EVERY SINGLE team, EACH week to get the positional data. Then we can calculate

                Metric,Data Needed,Insight
Positional Dominance,"Average total fantasy points scored by a position group (e.g., RB, WR, QB) in all head-to-head games.","Does Team A consistently win the RB battle against Team B, even if they lose the overall matchup?"
"""Benched"" Player Points",Sum of points from starting players vs. sum of points from players on the bench who were available to play.,Did one manager lose because they benched a player who outperformed a starter in that specific rivalry game?
"The ""Nemesis"" Player",Identify a player on one team who had their best historical performance against the other team.,"""He always kills us!""—validate the urban legend of a specific player dominating the rivalry."
"The ""Flop"" Player",Identify a player on one team who had their worst historical performance against the other team.,Highlights a player that consistently underperforms when the rivalry heat is on.


                */
                const { matchup } = req.query;
                if (!matchup) {
                    res.status(400).json({ error: 'matchup is required query parameter' });
                    return;
                }
                res.json({
                    insights: [
                        { category: 'Win Percentage', data: 'Tingleberries wins 75% of the time' },
                        {
                            category: 'Average Margin',
                            data: 'Tingleberries average margin is 10 points',
                        },
                        {
                            category: 'Worst Beatdown',
                            data: 'Tingleberries worst beatdown was 30 points',
                        },
                        {
                            category: 'Max Win Streak',
                            data: 'Tingleberries max win streak was 5 games',
                        },
                        { category: 'Clutch Record', data: 'Tingleberries clutch record is 3-1' },
                        {
                            category: 'Average Score',
                            data: 'Tingleberries average score is 100 points',
                        },
                    ],
                });
            } catch (e) {
                logger.error('Error getting insights:', e);
                res.status(500).json({ error: 'Unexpected error', original: e });
            }
        }
    );

    app.get(`${prefix}/data/awards`, async (req: express.Request, res: express.Response) => {
        try {
            const { week, matchup } = req.query;
            if (!week || !matchup) {
                res.status(400).json({ error: 'week and matchup are required query parameters' });
                return;
            }
            const collection = 'awards';
            const doc = `week-${week}-matchup-${matchup}`;
            const data = await databaseService.get(collection, doc as string);
            if (data) {
                res.json(data);
            } else {
                res.status(404).json({ error: 'Awards data not found' });
            }
        } catch (e) {
            logger.error('Error reading from database:', e);
            res.status(500).json({ error: 'Unexpected error', original: e });
        }
    });

    // Mount admin routes
    app.use(`${prefix}/admin`, adminRouter);

    return app;
}

// Export for firebase useage
export { getApp };
