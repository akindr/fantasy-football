import https from 'https';
import fs from 'fs';
import path from 'path';
import { logger } from './services/logger';
import { getApp } from './app';

const port = 3001;

// SSL certificate options
const httpsOptions = {
    key: fs.readFileSync(path.join(__dirname, './.cert/localhost.key.pem')),
    cert: fs.readFileSync(path.join(__dirname, './.cert/localhost.pem')),
};

const clientId = process.env.FF_APP_YAHOO_CLIENT_ID || '';
const clientSecret = process.env.FF_APP_YAHOO_CLIENT_SECRET || '';
const redirectUri = process.env.FF_APP_YAHOO_AUTH_REDIRECT_URL || 'localhost:3000';

const app = getApp(clientId, clientSecret, redirectUri, '/api');

// Create HTTPS server
https.createServer(httpsOptions, app).listen(port, () => {
    logger.info(`Fantasy football server running at https://localhost:${port}`);
});
