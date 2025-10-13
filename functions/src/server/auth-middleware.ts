import { Request, Response, NextFunction } from 'express';
import { auth } from 'firebase-admin';
import { defineSecret } from 'firebase-functions/params';

import { logger } from './services/logger';

let ALLOWED_UID: string | null = null;

export const firebaseAuthMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    const authorization = req.headers.authorization;

    if (!authorization || !authorization.startsWith('Bearer ')) {
        res.status(401).send('Unauthorized');
        next();
        return;
    }

    const idToken = authorization.split('Bearer ')[1];

    try {
        const decodedToken = await auth().verifyIdToken(idToken);
        const uid = decodedToken.uid;

        if (!ALLOWED_UID) {
            // check env then firebase
            ALLOWED_UID = process.env.FF_APP_ALLOWED_UID || '';
            if (!ALLOWED_UID) {
                const alloweUidSecret = defineSecret('ALLOWED_UID');
                ALLOWED_UID = alloweUidSecret.value();
            }
        }

        if (uid !== ALLOWED_UID) {
            logger.warn(`User with UID ${uid} tried to access an admin route.`);
            res.status(403).send('Forbidden');
            next();
            return;
        }

        (req as any).user = decodedToken;
        next();
        return;
    } catch (error) {
        logger.error('Error verifying Firebase ID token:', error);
        res.status(401).send('Unauthorized');
        next();
        return;
    }
};
