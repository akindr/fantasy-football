import https from 'https';
import fs from 'fs';
import path from 'path';
import { logger } from './services/logger';
import { getApp } from './app';
import dotenv from 'dotenv';

// Contains our local env variables for secrets and things that should not be committed
dotenv.config({ path: path.join(__dirname, '../../.env.development') });

const port = 3001;

// SSL certificate options
const httpsOptions = {
    key: fs.readFileSync(path.join(__dirname, './.cert/localhost.key.pem')),
    cert: fs.readFileSync(path.join(__dirname, './.cert/localhost.pem')),
};

const clientId = process.env.FF_APP_YAHOO_CLIENT_ID || '';
const clientSecret = process.env.FF_APP_YAHOO_CLIENT_SECRET || '';
const redirectUri = process.env.FF_APP_YAHOO_AUTH_REDIRECT_URL || '';
const geminiApiKey = process.env.FF_APP_GEMINI_API_KEY || '';

const app = getApp(clientId, clientSecret, redirectUri, geminiApiKey, '/api', false);

// Create HTTPS server
https.createServer(httpsOptions, app).listen(port, () => {
    logger.info(`Fantasy football server running at https://localhost:${port}`);
});
