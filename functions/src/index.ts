// Just host the express app
import { onRequest } from 'firebase-functions/v2/https';
import { logger, setGlobalOptions } from 'firebase-functions';
import { defineSecret, defineString } from 'firebase-functions/params';
import { getApp } from './server/app';

setGlobalOptions({ maxInstances: 2 });

// Define secrets
const yahooClientId = defineSecret('YAHOO_CLIENT_ID');
const yahooClientSecret = defineSecret('YAHOO_CLIENT_SECRET');
const geminiApiKey = defineSecret('GEMINI_API_KEY');

// Regular params
const yahooRedirectUri = defineString('YAHOO_AUTH_REDIRECT_URL');

let app: any = null;

function createAppWithSecrets() {
    if (!app) {
        app = getApp(yahooClientId.value(), yahooClientSecret.value(), yahooRedirectUri.value());
    }
    return app;
}

exports.api = onRequest(
    {
        secrets: [yahooClientId, yahooClientSecret, geminiApiKey],
    },
    (req, res) => {
        const app = createAppWithSecrets();
        logger.info('making request', { req: req.path });
        app(req, res);
    }
);
