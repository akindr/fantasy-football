import { onRequest, type Request } from 'firebase-functions/v2/https';
import { logger, setGlobalOptions } from 'firebase-functions';
import { defineSecret, defineString } from 'firebase-functions/params';
import { initializeApp } from 'firebase-admin/app';

import { getApp } from './server/app';
import { uploadFile } from './file-upload';

setGlobalOptions({ maxInstances: 2 });

// Initialize Firebase
initializeApp({
    projectId: 'get-schwifty-football',
    storageBucket: 'get-schwifty-football.firebasestorage.app',
});

// Define secrets
const yahooClientId = defineSecret('YAHOO_CLIENT_ID');
const yahooClientSecret = defineSecret('YAHOO_CLIENT_SECRET');
const geminiApiKey = defineSecret('GEMINI_API_KEY');

// Regular params
const yahooRedirectUri = defineString('YAHOO_AUTH_REDIRECT_URL');

let app: any = null;

function createAppWithSecrets() {
    if (!app) {
        // Create express app
        app = getApp(
            yahooClientId.value(),
            yahooClientSecret.value(),
            yahooRedirectUri.value(),
            geminiApiKey.value(),
            '/api'
        );
    }
    return app;
}

// Normal API requests go through express
exports.api = onRequest(
    {
        secrets: [yahooClientId, yahooClientSecret, geminiApiKey],
    },
    (req: Request, res) => {
        logger.info('Handling inbound request');
        const app = createAppWithSecrets();
        app(req, res);
    }
);

// File uploads are a separate function
exports.uploadFile = onRequest(
    {
        secrets: [yahooClientId, yahooClientSecret, geminiApiKey],
    },
    (req: Request, res) => {
        uploadFile(req, res);
    }
);
