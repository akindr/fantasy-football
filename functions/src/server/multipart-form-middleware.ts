import type { Request, Response, NextFunction } from 'express';

interface RequestWithRawBody extends Request {
    rawBody?: Buffer;
}

export const multipartFormMiddleware = (
    req: RequestWithRawBody,
    res: Response,
    next: NextFunction
): void => {
    // Only process if it's a POST and multipart/form-data
    if (
        req.method === 'POST' &&
        req.headers['content-type'] &&
        req.headers['content-type'].startsWith('multipart/form-data') &&
        !req.rawBody
    ) {
        const data: Buffer[] = [];
        req.on('data', chunk => data.push(chunk));
        req.on('end', () => {
            req.rawBody = Buffer.concat(data); // Populate req.rawBody for consistency
            next();
        });
        req.on('error', err => next(err)); // Handle stream errors
    } else {
        next();
    }
};
