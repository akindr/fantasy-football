
import { Router } from 'express';
import { firebaseAuthMiddleware } from './auth-middleware';

export const adminRouter = Router();

adminRouter.get('/hello', firebaseAuthMiddleware, (req, res) => {
    res.send('Hello, admin!');
});
