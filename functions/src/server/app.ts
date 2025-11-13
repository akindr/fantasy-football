import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { GeminiGateway } from './services/gemini-gateway';
import { HistoricalYearData, YahooGateway } from './services/yahoo-gateway';
import { logger } from './services/logger';
import type { AwardData, Award, GossipCornerData, TokenData } from './types';
import { DatabaseService } from './services/database-service';
import { StorageService } from './services/storage-service';
import { firebaseAuthMiddleware } from './auth-middleware';
import { multipartFormMiddleware } from './multipart-form-middleware';
import { computeHeadToHeadSummary } from './summary-data-helpers';

import { LEAGUE_YEARS } from './constants';
import { handleMultipartUpload } from './handlers/multipart-form-handler';

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
    app.use(multipartFormMiddleware);

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
            const matchups = await yahooGateway.getMatchupsWithStandingsData(req, res);
            res.json(matchups);
        } catch (e) {
            logger.error('Error fetching matchups:', e);
            res.status(500).json({ error: 'Unexpected error', original: e });
        }
    });

    app.get(`${prefix}/awards`, async (req: express.Request, res: express.Response) => {
        if (!req.cookies.__session) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        try {
            const { week } = req.query;
            if (!week) {
                res.status(400).json({ error: 'week is required query parameter' });
                return;
            }
            const matchups = await yahooGateway.getMatchupsWithStandingsData(req, res);
            const awards: Award[] = [];

            for (const matchup of matchups) {
                const award = await databaseService.get(
                    'awards',
                    `week-${week}-matchup-${matchup.id}`
                );
                if (award) {
                    logger.info('Found award', award);
                    awards.push({ matchup, award });
                }
            }

            res.json({ awards });
        } catch (e) {
            logger.error('Error fetching awards:', e);
            res.status(500).json({ error: 'Unexpected error', original: e });
        }
    });

    app.get(
        `${prefix}/figs-gossip-corner`,
        firebaseAuthMiddleware,
        async (req: express.Request, res: express.Response) => {
            try {
                const { week } = req.query;
                if (!week) {
                    res.status(400).json({ error: 'week is required query parameter' });
                    return;
                }

                const gossip = (await databaseService.get(
                    'figs-gossip-corner',
                    `gossip-${week}`
                )) as GossipCornerData | null;

                res.json({ gossip });
            } catch (e) {
                logger.error('Error fetching figs gossip corner data:', e);
                res.status(500).json({ error: 'Unexpected error', original: e });
            }
        }
    );

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
    // NOTE - this does not listen on the /api prefix because in prod, we use Firebase functions directly. This is due to how they preparse multipart form data
    app.post(
        '/uploadFile',
        firebaseAuthMiddleware,
        async (req: express.Request, res: express.Response) => {
            try {
                if (
                    !req.headers['content-type'] ||
                    !req.headers['content-type'].startsWith('multipart/form-data')
                ) {
                    res.status(400).send('Expected multipart/form-data content type.');
                }

                // @ts-expect-error - Firebase request type is express with one extra field rawBoy
                const { file } = await handleMultipartUpload(req);
                const { publicUrl } = await storageService.uploadImage(
                    file.buffer,
                    file.name,
                    file.mimetype
                );

                res.json({
                    success: true,
                    publicUrl,
                    fileName: file.name,
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
                    matchupId,
                    imageURL,
                    team1,
                    team2,
                    title,
                    description,
                    blurb,
                    funFacts,
                } = req.body as AwardData;
                if (week === undefined || matchupId === undefined) {
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
                    blurb,
                    funFacts,
                };

                if (
                    !awardData.imageURL ||
                    !awardData.team1 ||
                    !awardData.team2 ||
                    !awardData.title ||
                    !awardData.description ||
                    !awardData.blurb ||
                    !awardData.funFacts
                ) {
                    res.status(400).json({
                        error: 'Request body is missing one or more required fields for award data: imageURL, team1, team2, title, description, blurb, funFacts',
                    });
                    return;
                }

                const collection = 'awards';
                const doc = `week-${week}-matchup-${matchupId}`;
                await databaseService.set(collection, doc, awardData);
                res.status(200).send({ success: true });
            } catch (e) {
                logger.error('Error writing to database:', e);
                res.status(500).json({ error: 'Unexpected error', original: e });
            }
        }
    );

    app.post(
        `${prefix}/data/figs-gossip-corner`,
        firebaseAuthMiddleware,
        async (req: express.Request, res: express.Response) => {
            try {
                const { week, predictions } = req.body as GossipCornerData;

                if (typeof week !== 'number' || Number.isNaN(week)) {
                    res.status(400).json({
                        error: 'week is required in the request body and must be a number',
                    });
                    return;
                }

                if (!Array.isArray(predictions) || predictions.length !== 2) {
                    res.status(400).json({
                        error: 'predictions must be an array with exactly two entries',
                    });
                    return;
                }

                for (let i = 0; i < predictions.length; i++) {
                    const prediction = predictions[i];
                    if (
                        !prediction ||
                        typeof prediction.text !== 'string' ||
                        prediction.text.trim() === '' ||
                        typeof prediction.imageURL !== 'string' ||
                        prediction.imageURL.trim() === ''
                    ) {
                        res.status(400).json({
                            error: `prediction at index ${i} is missing required fields (text, imageURL)`,
                        });
                        return;
                    }
                }

                const doc = `gossip-${week}`;
                const payload: GossipCornerData = {
                    week,
                    predictions: [predictions[0], predictions[1]],
                    updatedAt: new Date().toISOString(),
                };

                await databaseService.set('figs-gossip-corner', doc, payload);
                res.status(200).send({ success: true });
            } catch (e) {
                logger.error('Error writing figs gossip corner data:', e);
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
                const currentYear = new Date().getFullYear().toString();

                for (const year of LEAGUE_YEARS) {
                    let yearMatchups: HistoricalYearData | null = null;

                    if (year === currentYear) {
                        yearMatchups = await yahooGateway.getMatchupsForYear(req, res, year);
                    } else {
                        yearMatchups = (await databaseService.get(
                            'historical-data',
                            `matchups-${year}`
                        )) as HistoricalYearData | null;
                    }

                    if (!yearMatchups) {
                        logger.warn(`No matchup data found for year ${year}, skipping`);
                        continue;
                    }

                    const matchupsForTheYear = [];

                    // Go through each week of the year and identify where these teams faced head-to-head
                    for (let weekIdx = 0; weekIdx < yearMatchups.weeklyMatchups.length; weekIdx++) {
                        const weekMatchups = yearMatchups.weeklyMatchups[weekIdx];

                        // check each matchup for that week
                        for (let i = 0; i < weekMatchups.matchups.length; i++) {
                            const matchup = weekMatchups.matchups[i];
                            if (
                                (matchup.team1.manager?.id === team1 &&
                                    matchup.team2.manager?.id === team2) ||
                                (matchup.team1.manager?.id === team2 &&
                                    matchup.team2.manager?.id === team1)
                            ) {
                                // Compute the winner
                                const winner =
                                    matchup.team1.points > matchup.team2.points
                                        ? matchup.team1
                                        : matchup.team2;
                                matchupsForTheYear.push({
                                    winningManager: winner.manager,
                                    winningTeam: winner.name,
                                    marginOfVictory: Math.abs(
                                        matchup.team1.points - matchup.team2.points
                                    ),
                                    isPlayoffGame: weekIdx + 1 > 14,
                                    ...matchup,
                                    week: weekIdx + 1, // Previous json blob didn't have week
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

    app.get(
        `${prefix}/admin/this-year-insights`,
        async (req: express.Request, res: express.Response) => {
            try {
                const { team1, team2, week } = req.query;
                if (!team1 || !team2 || !week) {
                    res.status(400).json({
                        error: 'team1, team2, and week are required query parameters',
                    });
                    return;
                }

                const currentWeek = parseInt(week as string);

                // Get current standings
                const standings = await yahooGateway.getStandings(req, res);

                // Find team names from standings
                const team1Standings = standings.teams.find(s => s.teamId === team1);
                const team2Standings = standings.teams.find(s => s.teamId === team2);

                if (!team1Standings || !team2Standings) {
                    res.status(404).json({
                        error: 'One or both teams not found in standings',
                    });
                    return;
                }

                // Fetch all matchups for the season so far (weeks 1 through previous week)
                const allMatchupsPromises = [];
                for (let weekNum = 1; weekNum <= currentWeek; weekNum++) {
                    // Store the original query and modify it temporarily
                    const originalQuery = req.query;
                    req.query = { ...originalQuery, week: weekNum.toString() };
                    allMatchupsPromises.push(yahooGateway.getMatchups(req, res));
                    req.query = originalQuery; // Restore original query
                }

                const allMatchupsByWeek = await Promise.all(allMatchupsPromises);
                const allMatchupsThisSeason = allMatchupsByWeek.flat();

                // Find the matchup for the desired week to use those players
                const theMatchup = allMatchupsThisSeason.find(matchup => {
                    return (
                        matchup.week === currentWeek &&
                        (matchup.team1.id === team1 || matchup.team2.id === team1)
                    );
                });

                // Compute the comprehensive summary data
                const summaryData = computeHeadToHeadSummary(
                    team1 as string,
                    team1Standings.name,
                    team2 as string,
                    team2Standings.name,
                    currentWeek,
                    standings,
                    allMatchupsThisSeason,
                    theMatchup?.team1.players ?? [],
                    theMatchup?.team2.players ?? []
                );

                const insights = await geminiGateway.getThisYearMatchupInsights(summaryData);
                res.json({ insights, summaryData });
            } catch (e) {
                logger.error('Error getting this year insights:', e);
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

    return app;
}

// Export for firebase useage
export { getApp };
