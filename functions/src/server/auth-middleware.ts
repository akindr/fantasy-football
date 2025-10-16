import { Request, Response, NextFunction } from 'express';
import { auth } from 'firebase-admin';

import { logger } from './services/logger';

/**
 * Middleware to verify Firebase ID token and check for admin claim.
 *
 * This uses Firebase Custom Claims to determine if a user is an admin.
 * Admin claims must be set using the setup script: npm run set-admin -- YOUR_UID
 *
 * See: functions/scripts/set-first-admin.ts
 */
export const firebaseAuthMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    const authorization = req.headers.authorization;

    if (!authorization || !authorization.startsWith('Bearer ')) {
        res.status(401).send('Unauthorized');
        return;
    }

    const idToken = authorization.split('Bearer ')[1];

    try {
        const decodedToken = await auth().verifyIdToken(idToken);

        // Check if user has admin claim
        if (!decodedToken.admin) {
            logger.warn(
                `User with UID ${decodedToken.uid} tried to access admin route without admin claim.`
            );
            res.status(403).send('Forbidden - Admin access required');
            return;
        }

        (req as any).user = decodedToken;
        next();
    } catch (error) {
        logger.error('Error verifying Firebase ID token:', error);
        res.status(401).send('Unauthorized');
    }
};
