import { Router } from 'express';
import { firebaseAuthMiddleware } from './auth-middleware';

export const adminRouter = Router();

/**
 * Admin routes - all routes require admin claim via Firebase Custom Claims
 *
 * To set up the first admin, use the setup script:
 *   cd functions
 *   npm run set-admin -- YOUR_FIREBASE_UID
 *
 * See: functions/scripts/set-first-admin.ts
 */

// Test endpoint to verify admin access
adminRouter.get('/hello', firebaseAuthMiddleware, (req, res) => {
    res.json({
        message: 'Hello, admin!',
        user: (req as any).user.uid,
    });
});
