import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import multer from 'multer';
import { GeminiGateway } from './services/gemini-gateway';
import { HistoricalYearData, YahooGateway } from './services/yahoo-gateway';
import { logger } from './services/logger';
import { type TokenData } from './types';
import { DatabaseService } from './services/database-service';
import { StorageService } from './services/storage-service';
import { firebaseAuthMiddleware } from './auth-middleware';
import { adminRouter } from './admin-routes';
import { LEAGUE_YEARS } from './constants';

dotenv.config();

function getApp(
    yahooClientId: string,
    yahooClientSecret: string,
    yahooRedirectUri: string,
    geminiApiKey: string,
    prefix: string = ''
) {
    const app = express();
    const geminiGateway = new GeminiGateway(geminiApiKey);
    const yahooGateway = new YahooGateway(yahooClientId, yahooClientSecret, yahooRedirectUri);
    const databaseService = new DatabaseService();
    const storageService = new StorageService();

    // Multer configuration for file uploads (store in memory)
    const upload = multer({
        storage: multer.memoryStorage(),
        limits: {
            fileSize: 5 * 1024 * 1024, // 5MB limit
        },
        fileFilter: (req, file, cb) => {
            // Only allow image files
            if (file.mimetype.startsWith('image/')) {
                cb(null, true);
            } else {
                cb(new Error('Only image files are allowed'));
            }
        },
    });

    // CORS configuration
    app.use(
        cors({
            origin: [
                'https://lvh.me:3000',
                'https://localhost:3000',
                'https://localhost:3002',
                'https://lvh.me:3002',
            ],
            credentials: true,
        })
    );

    // JSON + COOKIES middlewares
    app.use(express.json());
    app.use(cookieParser());

    // TODO move into gateway
    app.post(`${prefix}/oauth/token`, async (req: express.Request, res: express.Response) => {
        try {
            const { code } = req.body;
            logger.info('Requesting token', { code, redirectUri: yahooRedirectUri });

            const payload = new URLSearchParams({
                grant_type: 'authorization_code',
                redirect_uri: yahooRedirectUri,
                client_id: yahooClientId,
                client_secret: yahooClientSecret,
                code: code,
            });

            logger.info(payload);

            const tokenResponse = await fetch('https://api.login.yahoo.com/oauth2/get_token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: payload,
            });

            const tokenData: TokenData = await tokenResponse.json();
            tokenData.expiry_server_time = Date.now() + (tokenData.expires_in || 0) * 1000;

            logger.info('Token data', tokenData);

            if (!tokenData?.access_token) {
                throw new Error('Failed to get access token');
            }

            // Note this is a special-sauce cookie that Firebase won't strip
            res.cookie('__session', tokenData, {
                httpOnly: true,
                secure: true,
                maxAge: 1000 * 60 * 60 * 24 * 1, // 1 days
                sameSite: 'none',
            });

            res.json(tokenData);
        } catch (error) {
            logger.error('Token exchange error:', error);
            res.status(500).json({ error: 'Failed to exchange code for token' });
        }
    });

    // Proxy to get standings for the FF league
    app.get(`${prefix}/standings`, async (req: express.Request, res: express.Response) => {
        logger.info('Fetching standings', req.cookies);
        if (!req.cookies.__session) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        try {
            // TODO specify league id and year from UI
            const standings = await yahooGateway.getStandings(req, res);
            res.json(standings);
        } catch (e) {
            logger.error('Error fetching standings:', e);
            res.status(500).json({ error: 'Unexpected error', original: e });
        }
    });

    // Proxy to get matchups for the FF league
    app.get(`${prefix}/matchups`, async (req: express.Request, res: express.Response) => {
        if (!req.cookies.__session) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        try {
            const matchups = await yahooGateway.getMatchups(req, res);
            // const images = matchups;
            // DO NOT UNCOMMENT, shit is expensive
            // await geminiGateway.generateAllMatchupImages(matchups);
            // res.setHeader('Cache-Control', 'no-store');
            // res.setHeader('Pragma', 'no-cache');
            // res.setHeader('Expires', '0');
            res.json(matchups);
        } catch (e) {
            logger.error('Error fetching matchups:', e);
            res.status(500).json({ error: 'Unexpected error', original: e });
        }
    });

    // Debug endpoint to get available NFL games
    app.get(`${prefix}/games-debug`, async (req: express.Request, res: express.Response) => {
        if (!req.cookies.__session) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        try {
            const games = await yahooGateway.getGames(req, res);
            res.json(games);
        } catch (e) {
            logger.error('Error fetching games:', e);
            res.status(500).json({ error: 'Unexpected error', original: e });
        }
    });

    app.get(`${prefix}/league-debug`, async (req: express.Request, res: express.Response) => {
        if (!req.cookies.__session) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        try {
            const league = await yahooGateway.getLeague(req, res);
            res.json(league);
        } catch (e) {
            logger.error('Error fetching league:', e);
            res.status(500).json({ error: 'Unexpected error', original: e });
        }
    });

    app.get(`${prefix}/generate-image`, async (req: express.Request, res: express.Response) => {
        logger.info('Generating image', { prompt: req.query.prompt });
        const prompt = req.query.prompt as string;
        const imageBuffer = await geminiGateway.generateImage(prompt);
        if (!imageBuffer) {
            res.status(500).json({ error: 'Failed to generate image' });
            return;
        }
        res.type('image/png');
        res.send(imageBuffer);
    });

    // Image upload endpoint
    app.post(
        `${prefix}/upload/image`,
        firebaseAuthMiddleware,
        upload.single('image'),
        async (req: express.Request, res: express.Response) => {
            try {
                if (!req.file) {
                    res.status(400).json({ error: 'No file uploaded' });
                    return;
                }

                // Generate a unique filename
                const timestamp = Date.now();
                const fileExtension = req.file.originalname.split('.').pop();
                const fileName = `award-images/${timestamp}.${fileExtension}`;

                // Upload to Firebase Storage
                const publicUrl = await storageService.uploadFile(
                    req.file.buffer,
                    fileName,
                    req.file.mimetype
                );

                logger.info('Image uploaded successfully', { fileName, publicUrl });

                res.json({
                    success: true,
                    url: publicUrl,
                    fileName,
                });
            } catch (error) {
                logger.error('Error uploading image:', error);
                res.status(500).json({
                    error: 'Failed to upload image',
                    details: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        }
    );

    app.post(
        `${prefix}/data/awards`,
        firebaseAuthMiddleware,
        async (req: express.Request, res: express.Response) => {
            try {
                const {
                    week,
                    matchup,
                    imageURL,
                    team1,
                    team2,
                    title,
                    description,
                    matchupHighlights,
                } = req.body;
                if (week === undefined || matchup === undefined) {
                    res.status(400).json({
                        error: 'week and matchup are required in the request body',
                    });
                    return;
                }

                const awardData = {
                    imageURL,
                    team1,
                    team2,
                    title,
                    description,
                    matchupHighlights,
                };

                if (
                    !awardData.imageURL ||
                    !awardData.team1 ||
                    !awardData.team2 ||
                    !awardData.title ||
                    !awardData.description ||
                    !awardData.matchupHighlights
                ) {
                    res.status(400).json({
                        error: 'Request body is missing one or more required fields for award data: imageURL, team1, team2, title, description, matchupHighlights',
                    });
                    return;
                }

                const collection = 'awards';
                const doc = `week-${week}-matchup-${matchup}`;
                await databaseService.set(collection, doc, awardData);
                res.status(200).send({ success: true });
            } catch (e) {
                logger.error('Error writing to database:', e);
                res.status(500).json({ error: 'Unexpected error', original: e });
            }
        }
    );

    app.get(
        `${prefix}/admin/insights`,
        firebaseAuthMiddleware,
        async (req: express.Request, res: express.Response) => {
            try {
                const { matchup, team1, team2 } = req.query;
                if (!matchup || !team1 || !team2) {
                    res.status(400).json({
                        error: 'matchup, team1, and team2 are required query parameters',
                    });
                    return;
                }

                // First, check database if we've already given insights for these two teams
                try {
                    const insights = await databaseService.get(
                        'insights',
                        `team1-${team1}-vs-team2-${team2}`
                    );
                    if (insights) {
                        logger.info('Found existing insights in database', insights);
                        res.json(insights);
                        return;
                    } else {
                        logger.info(
                            'No insights found in database for these teams, continuing to calculate'
                        );
                    }
                } catch (e) {
                    logger.warn('Could not check database for existing insights', e);
                }

                const matchesFeaturingTeams = [];

                for (const year of LEAGUE_YEARS) {
                    const yearMatchups = (await databaseService.get(
                        'historical-data',
                        `matchups-${year}`
                    )) as HistoricalYearData;

                    const matchupsForTheYear = [];

                    // Go through each week of the year and identify where these teams faced head-to-head
                    for (let weekIdx = 0; weekIdx < yearMatchups.weeklyMatchups.length; weekIdx++) {
                        const weekMatchups = yearMatchups.weeklyMatchups[weekIdx];

                        // check each matchup for that week
                        for (let i = 0; i < weekMatchups.matchups.length; i++) {
                            const matchup = weekMatchups.matchups[i];
                            if (
                                (matchup.team1.manager.id === team1 &&
                                    matchup.team2.manager.id === team2) ||
                                (matchup.team1.manager.id === team2 &&
                                    matchup.team2.manager.id === team1)
                            ) {
                                // Compute the winner
                                const winner =
                                    matchup.team1.points > matchup.team2.points
                                        ? matchup.team1
                                        : matchup.team2;
                                matchupsForTheYear.push({
                                    week: weekIdx + 1,
                                    winningManager: winner.manager,
                                    winningTeam: winner.name,
                                    marginOfVictory: Math.abs(
                                        matchup.team1.points - matchup.team2.points
                                    ),
                                    isPlayoffGame: weekIdx + 1 >= 14,
                                    ...matchup,
                                });
                            }
                        }
                    }

                    matchesFeaturingTeams.push({
                        year,
                        gameKey: yearMatchups.gameKey,
                        leagueId: yearMatchups.leagueId,
                        matchups: matchupsForTheYear,
                    });
                }

                // Next, get the players per roster for each matchup
                for (const match of matchesFeaturingTeams) {
                    for (const matchup of match.matchups) {
                        const team1Players = await yahooGateway.getTeamPlayers(
                            req,
                            res,
                            matchup.team1.id,
                            matchup.week.toString(),
                            match.leagueId,
                            match.gameKey
                        );
                        const team2Players = await yahooGateway.getTeamPlayers(
                            req,
                            res,
                            matchup.team2.id,
                            matchup.week.toString(),
                            match.leagueId,
                            match.gameKey
                        );
                        matchup.team1.players = team1Players;
                        matchup.team2.players = team2Players;
                    }
                }

                const insights = await geminiGateway.getMatchupInsights(matchesFeaturingTeams);

                // Persist, then we continue
                await databaseService.set('insights', `team1-${team1}-vs-team2-${team2}`, {
                    insights,
                });

                res.json({
                    insights,
                });
            } catch (e) {
                logger.error('Error getting insights:', e);
                res.status(500).json({ error: 'Unexpected error', original: e });
            }
        }
    );

    app.get(`${prefix}/data/awards`, async (req: express.Request, res: express.Response) => {
        try {
            const { week, matchup } = req.query;
            if (!week || !matchup) {
                res.status(400).json({ error: 'week and matchup are required query parameters' });
                return;
            }
            const collection = 'awards';
            const doc = `week-${week}-matchup-${matchup}`;
            const data = await databaseService.get(collection, doc as string);
            if (data) {
                res.json(data);
            } else {
                res.status(404).json({ error: 'Awards data not found' });
            }
        } catch (e) {
            logger.error('Error reading from database:', e);
            res.status(500).json({ error: 'Unexpected error', original: e });
        }
    });

    // TODO clean this up
    // Mount admin routes
    app.use(`${prefix}/admin`, adminRouter);

    return app;
}

// Export for firebase useage
export { getApp };
