import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import cookieParser from 'cookie-parser';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { type YahooStandingsResponse, transformStandings } from './data-mappers.ts';

dotenv.config();

// ES Module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface TokenData {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
    token_type?: string;
}

const app = express();
const port = 3001;

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

app.post('/oauth/token', async (req: express.Request, res: express.Response) => {
    try {
        const { code } = req.body;
        console.log(code);

        const clientId = process.env.REACT_APP_YAHOO_CLIENT_ID;
        const clientSecret = process.env.REACT_APP_YAHOO_CLIENT_SECRET;

        if (!clientId || !clientSecret) {
            throw new Error('Missing client credentials');
        }

        const payload = new URLSearchParams({
            grant_type: 'authorization_code',
            redirect_uri: 'https://localhost:3000/auth/callback',
            client_id: clientId,
            client_secret: clientSecret,
            code: code,
        });

        console.log(payload);

        const tokenResponse = await fetch('https://api.login.yahoo.com/oauth2/get_token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: payload,
        });

        const tokenData: TokenData = await tokenResponse.json();
        console.log(JSON.stringify(tokenData, null, 2));

        if (!tokenData?.access_token) {
            throw new Error('Failed to get access token');
        }

        // TODO refresh token
        res.cookie('token', tokenData, {
            httpOnly: true,
            secure: true,
            maxAge: 1000 * 60 * 60 * 24 * 1, // 1 days
            sameSite: 'none',
        });

        res.json(tokenData);
    } catch (error) {
        console.error('Token exchange error:', error);
        res.status(500).json({ error: 'Failed to exchange code for token' });
    }
});

// Proxy to get standings for the FF league
app.get('/api/standings', async (req: express.Request, res: express.Response) => {
    if (!req.cookies.token) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }
    const tokenData = req.cookies.token as TokenData;
    console.log('tokenData', tokenData);
    try {
        // TODO specify league id and year from UI
        const standings = await fetch(
            'https://fantasysports.yahooapis.com/fantasy/v2/league/449.l.33427/standings?format=json',
            {
                headers: {
                    Authorization: `Bearer ${tokenData.access_token}`,
                },
            }
        );
        const response: YahooStandingsResponse = await standings.json();
        const transformedData = transformStandings(response);
        res.json(transformedData);
    } catch (e) {
        console.error('Error fetching standings:', e);
        res.status(500).json({ error: 'Unexpected error', original: e });
    }
});

// Create HTTPS server
https.createServer(httpsOptions, app).listen(port, () => {
    console.log(`OAuth server running at https://localhost:${port}`);
});
