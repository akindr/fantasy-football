
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
    const databaseService = new DatabaseService(logger);

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
            const images = matchups;
            // DO NOT UNCOMMENT, shit is expensive
            // await geminiGateway.generateAllMatchupImages(matchups);
            // res.setHeader('Cache-Control', 'no-store');
            // res.setHeader('Pragma', 'no-cache');
            // res.setHeader('Expires', '0');
            res.json(images);
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

    app.post(`${prefix}/data/awards`, async (req: express.Request, res: express.Response) => {
        try {
            const { week, matchup, imageURL, team1, team2, title, description, matchupHighlights } = req.body;
            if (week === undefined || matchup === undefined) {
                res.status(400).json({ error: 'week and matchup are required in the request body' });
                return;
            }
    
            const awardData = {
                imageURL,
                team1,
                team2,
                title,
                description,
                matchupHighlights
            };
    
            if (!awardData.imageURL || !awardData.team1 || !awardData.team2 || !awardData.title || !awardData.description || !awardData.matchupHighlights) {
                res.status(400).json({ error: 'Request body is missing one or more required fields for award data: imageURL, team1, team2, title, description, matchupHighlights' });
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
    });

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

    return app;
}

// Export for firebase useage
export { getApp };
