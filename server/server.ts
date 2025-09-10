import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import cookieParser from 'cookie-parser';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GeminiGateway } from './services/gemini-gateway.ts';
import { YahooGateway } from './services/yahoo-gateway.ts';
import { logger } from './services/logger.ts';

dotenv.config();

// ES Module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const clientId = process.env.REACT_APP_YAHOO_CLIENT_ID || '';
const clientSecret = process.env.REACT_APP_YAHOO_CLIENT_SECRET || '';

export interface TokenData {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
    token_type?: string;
    expiry_server_time?: number;
}

const app = express();
const port = 3001;
const geminiGateway = new GeminiGateway();
const yahooGateway = new YahooGateway(clientId, clientSecret);

// SSL certificate options
const httpsOptions = {
    key: fs.readFileSync(path.join(__dirname, '../.cert/localhost.key.pem')),
    cert: fs.readFileSync(path.join(__dirname, '../.cert/localhost.pem')),
};

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
app.post('/oauth/token', async (req: express.Request, res: express.Response) => {
    try {
        const { code } = req.body;
        logger.info('oauth code', { code });

        const payload = new URLSearchParams({
            grant_type: 'authorization_code',
            redirect_uri: 'https://localhost:3000/auth/callback',
            client_id: clientId,
            client_secret: clientSecret,
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

        if (!tokenData?.access_token) {
            throw new Error('Failed to get access token');
        }

        res.cookie('token', tokenData, {
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
app.get('/api/standings', async (req: express.Request, res: express.Response) => {
    if (!req.cookies.token) {
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
app.get('/api/matchups', async (req: express.Request, res: express.Response) => {
    if (!req.cookies.token) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }
    try {
        const matchups = await yahooGateway.getMatchups(req, res);
        const images = await geminiGateway.generateAllMatchupImages(matchups);
        res.setHeader('Cache-Control', 'no-store');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.json(images);
    } catch (e) {
        logger.error('Error fetching matchups:', e);
        res.status(500).json({ error: 'Unexpected error', original: e });
    }
});

// Debug endpoint to get available NFL games
app.get('/api/games-debug', async (req: express.Request, res: express.Response) => {
    if (!req.cookies.token) {
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

app.get('/api/generate-image', async (req: express.Request, res: express.Response) => {
    const prompt = req.query.prompt as string;
    const imageBuffer = await geminiGateway.generateImage(prompt);
    if (!imageBuffer) {
        res.status(500).json({ error: 'Failed to generate image' });
        return;
    }
    res.type('image/png');
    res.send(imageBuffer);
});

// Create HTTPS server
https.createServer(httpsOptions, app).listen(port, () => {
    logger.info(`Fantasy football server running at https://localhost:${port}`);
});
