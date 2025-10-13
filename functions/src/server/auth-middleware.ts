import { Request, Response, NextFunction } from 'express';
import { auth } from 'firebase-admin';
import { logger } from './services/logger';

// The ALLOWED_UID is set as a secret in Firebase.
const { ALLOWED_UID } = process.env;

if (!ALLOWED_UID) {
    logger.warn('ALLOWED_UID secret not set. Admin routes will be inaccessible.');
}

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
