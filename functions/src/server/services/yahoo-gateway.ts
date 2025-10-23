import express from 'express';
import fs from 'fs';
import path from 'path';
import {
    TransformedMatchup,
    transformMatchups,
    transformPlayerStats,
    transformRoster,
    transformStandings,
    mergeMatchupAndStandingsData,
    type YahooStandingsResponse,
} from '../data-mappers';

import { type TokenData } from '../types';
import { GAME_KEY, OLD_LEAGUE_KEYS, SCHWIFTY_LEAGUE_ID } from '../constants';
import { logger } from './logger';

export type HistoricalYearData = {
    year: string;
    leagueId: string;
    gameKey: string;
    leagueSpec: string;
    weeklyMatchups: WeeklyMatchups[];
};

type WeeklyMatchups = {
    week: number;
    matchups: TransformedMatchup[];
};

export type HistoricalData = Record<string, HistoricalYearData>;

const YAHOO_BASE_URL = 'https://fantasysports.yahooapis.com/fantasy/v2';

function getUrl(pathParams: string, queryParams: string = '') {
    logger.info('Getting URL', { pathParams, queryParams });
    return `${YAHOO_BASE_URL}/${pathParams}?${queryParams}&format=json`;
}

export class YahooGateway {
    private clientId: string;
    private clientSecret: string;
    private redirectUri: string;

    constructor(clientId: string, clientSecret: string, redirectUri: string) {
        logger.info('YahooGateway constructor', { clientId, clientSecret });
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.redirectUri = redirectUri;
    }

    _reauthenticate = async (req: express.Request, res: express.Response) => {
        const tokenData = req.cookies.__session as TokenData;

        const refreshParams = {
            grant_type: 'refresh_token',
            redirect_uri: this.redirectUri,
            refresh_token: tokenData.refresh_token || '',
            client_secret: this.clientSecret || '',
            client_id: this.clientId || '',
        };
        const payload = new URLSearchParams(refreshParams);
        logger.info('Refresh request payload', {
            ...refreshParams,
            clientID: `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`,
        });
        const tokenResponse = await fetch('https://api.login.yahoo.com/oauth2/get_token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Authorization: `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`,
            },
            body: payload,
        });

        const updatedTokenData = (await tokenResponse.json()) as TokenData;
        updatedTokenData.expiry_server_time =
            Date.now() + (updatedTokenData.expires_in || 0) * 1000;

        logger.info('Refresh request token', updatedTokenData);
        res.cookie('__session', updatedTokenData, {
            httpOnly: true,
            secure: true,
            maxAge: 1000 * 60 * 60 * 24 * 1, // 1 days
            sameSite: 'none',
        });
    };

    _makeRequest = async (
        url: string,
        req: express.Request,
        res: express.Response,
        retry: boolean = false
    ): Promise<any> => {
        const tokenData = req.cookies.__session as TokenData;

        if (tokenData.expiry_server_time && Date.now() >= tokenData.expiry_server_time) {
            logger.info('Token expired, refreshing token');
            await this._reauthenticate(req, res);
        }

        logger.info('Fetching resource', { url });
        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${tokenData.access_token}`,
            },
        });
        const responseStatus = response.status;
        logger.info('Response status', { status: responseStatus });

        if (responseStatus === 401 && !retry) {
            await this._reauthenticate(req, res);
            return this._makeRequest(url, req, res, true);
        } else if (responseStatus !== 200) {
            throw new Error(`Unexpected error, status: ${responseStatus}`);
        }

        const jsonRes = await response.json();
        return jsonRes;
    };

    async getLeagueInfo(leagueId: string) {
        const response = await fetch(`https://fantasysports.yahoo.com/f1/461/teams/${leagueId}`);
        return response.json();
    }

    async getMatchups(req: express.Request, res: express.Response) {
        const leagueId = SCHWIFTY_LEAGUE_ID;
        const week = req.query.week as string;

        if (!week) {
            throw new Error('Week is required');
        }
        const leagueSpec = `${GAME_KEY}.l.${leagueId}`;

        const url = getUrl(`league/${leagueSpec}/scoreboard;week=${week}`);
        logger.info('Fetching matchups', { url });
        const matchupsResponse = await this._makeRequest(url, req, res);
        const standingsData = await this.getStandings(req, res);

        const transformedMatchups = transformMatchups(matchupsResponse);

        const mergedMatchupData = mergeMatchupAndStandingsData(transformedMatchups, standingsData);

        // Collect all unique team IDs from matchups
        const teamIds = [];
        for (const matchup of mergedMatchupData) {
            teamIds.push(matchup.team1.id);
            teamIds.push(matchup.team2.id);
        }

        // Fetch all rosters in parallel
        const rosterPromises = teamIds.map(teamId =>
            this.getTeamPlayers(req, res, teamId, week, SCHWIFTY_LEAGUE_ID, GAME_KEY)
        );
        const rosterResults = await Promise.all(rosterPromises);

        // Create a map of team ID to roster data
        const rosterMap = new Map<string, any>();
        teamIds.forEach((teamId, index) => {
            rosterMap.set(teamId, rosterResults[index]);
        });

        // Map the roster data back to the matchups
        for (const matchup of mergedMatchupData) {
            matchup.team1.players = rosterMap.get(matchup.team1.id);
            matchup.team2.players = rosterMap.get(matchup.team2.id);
        }

        return mergedMatchupData;
    }

    async getTeamPlayers(
        req: express.Request,
        res: express.Response,
        teamId: string,
        week: string,
        leagueId: string,
        gameKey: string
    ) {
        const teamKey = `${gameKey}.l.${leagueId}.t.${teamId}`;

        const url = getUrl(`team/${teamKey}/roster;week=${week}`);
        const response = await this._makeRequest(url, req, res);
        const transformedRosterData = transformRoster(response);

        // Next get the stats for each player via bulk api
        const leagueKey = `${gameKey}.l.${leagueId}`;
        const playersUrl = getUrl(
            `league/${leagueKey}/players;player_keys=${transformedRosterData.map(player => `${gameKey}.p.${player.playerId}`).join(',')}/stats;type=week;week=${week}`
        );

        // TODO this could be cleaner
        const playerStatsResponse = await this._makeRequest(playersUrl, req, res);
        const playerStatsData = transformPlayerStats(playerStatsResponse);

        transformedRosterData.forEach(player => {
            const playerStats = playerStatsData.get(player.playerId);
            if (playerStats) {
                player.stats = playerStats;
            }
        });

        return transformedRosterData;
    }

    async getPlayerStats(
        req: express.Request,
        res: express.Response,
        playerKey: string,
        week: string
    ) {
        const url = getUrl(`player/${playerKey}/stats;type=week;week=${week}`);
        const response = await this._makeRequest(url, req, res);
        return response;
    }

    async getStandings(req: express.Request, res: express.Response) {
        const leagueId = SCHWIFTY_LEAGUE_ID;
        const leagueSpec = `${GAME_KEY}.l.${leagueId}`;
        const url = getUrl(`league/${leagueSpec}/standings`);

        const response: YahooStandingsResponse = await this._makeRequest(url, req, res);
        const transformedData = transformStandings(response);

        return transformedData;
    }

    async getGames(req: express.Request, res: express.Response) {
        const url = getUrl(`game/nfl`);
        const response = await this._makeRequest(url, req, res);
        return response;
    }

    async getLeague(req: express.Request, res: express.Response) {
        const allMatchups = [];

        for (const year of Object.keys(OLD_LEAGUE_KEYS) as (keyof typeof OLD_LEAGUE_KEYS)[]) {
            const leagueId = OLD_LEAGUE_KEYS[year].leagueID;
            const gameKey = OLD_LEAGUE_KEYS[year].gameID;
            const leagueSpec = `${gameKey}.l.${leagueId}`;
            const url = getUrl(`league/${leagueSpec}/scoreboard;week=1`);
            const response = await this._makeRequest(url, req, res);
            allMatchups.push(response);
        }

        const allMatchupsResults = await Promise.all(allMatchups);
        const matchupsByYear = allMatchupsResults.map(result => transformMatchups(result));
        return matchupsByYear;
    }

    // For now, unexposed. We can expose again if necessary. This helps get every matchup for each week of our league's history
    async getAllMatchups(req: express.Request, res: express.Response): Promise<HistoricalData> {
        const dataFilePath = path.join(__dirname, '../../../../data/historical-matchups.json');

        // Fetch fresh data from Yahoo API
        logger.info('Fetching fresh matchup data from Yahoo API');
        const weeks = Array.from({ length: 18 }, (_, i) => i + 1);
        const historicalData: HistoricalData = {};

        for (const year of Object.keys(OLD_LEAGUE_KEYS) as (keyof typeof OLD_LEAGUE_KEYS)[]) {
            const leagueId = OLD_LEAGUE_KEYS[year].leagueID;
            const gameKey = OLD_LEAGUE_KEYS[year].gameID;
            const leagueSpec = `${gameKey}.l.${leagueId}`;
            const yearMatchupRequests = [];

            for (const week of weeks) {
                const url = getUrl(`league/${leagueSpec}/scoreboard;week=${week}`);
                const response = this._makeRequest(url, req, res);
                yearMatchupRequests.push(response);
            }
            const yearMatchupResults = await Promise.all(yearMatchupRequests);
            const transformedYearlyMatchups = yearMatchupResults.map((result, index) => ({
                week: index + 1,
                matchups: transformMatchups(result),
            }));

            // Prepare data for JSON file
            historicalData[year] = {
                year,
                leagueId,
                gameKey,
                leagueSpec,
                weeklyMatchups: transformedYearlyMatchups,
            };
        }

        try {
            // Ensure directory exists
            const dataDir = path.dirname(dataFilePath);
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }

            fs.writeFileSync(dataFilePath, JSON.stringify(historicalData, null, 2));
            logger.info('Historical matchup data written to JSON file');
        } catch (error) {
            logger.error('Error writing historical data file:', error);
        }

        return historicalData;
    }
}
