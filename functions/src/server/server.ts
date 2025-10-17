import https from 'https';
import fs from 'fs';
import path from 'path';
import { initializeApp, cert } from 'firebase-admin/app';
import { logger } from './services/logger';
import { getApp } from './app';
import dotenv from 'dotenv';

// Contains our local env variables for secrets and things that should not be committed
dotenv.config({ path: path.join(__dirname, '../../.env.development') });

// Initialize Firebase Admin for local development
const serviceAccountPath = path.join(__dirname, '../../service-account-key.json');
if (fs.existsSync(serviceAccountPath)) {
    logger.info('Initializing Firebase Admin with service account key...');
    const serviceAccount = require(serviceAccountPath);
    initializeApp({
        credential: cert(serviceAccount),
        projectId: 'get-schwifty-football',
    });
} else {
    logger.warn('⚠️  Service account key not found. Admin endpoints will not work.');
    logger.warn('To fix: Download service account key from Firebase Console');
    logger.warn('Save it as: functions/service-account-key.json');
    logger.warn('See: SETUP_CREDENTIALS.md for instructions');
}

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

const app = getApp(clientId, clientSecret, redirectUri, geminiApiKey, '/api');

// Create HTTPS server
https.createServer(httpsOptions, app).listen(port, () => {
    logger.info(`Fantasy football server running at https://localhost:${port}`);
});
