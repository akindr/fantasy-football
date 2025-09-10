import express from 'express';
import {
    transformMatchups,
    transformStandings,
    type YahooStandingsResponse,
} from '../data-mappers.ts';

import { type TokenData } from '../server.ts';
import { GAME_KEY, SCHWIFTY_LEAGUE_ID } from '../constants.ts';
import { logger } from './logger.ts';

export class YahooGateway {
    private clientId: string;
    private clientSecret: string;

    constructor(clientId: string, clientSecret: string) {
        logger.info('YahooGateway constructor', { clientId, clientSecret });
        this.clientId = clientId;
        this.clientSecret = clientSecret;
    }

    _reauthenticate = async (req: express.Request, res: express.Response) => {
        const tokenData = req.cookies.token as TokenData;

        const refreshParams = {
            grant_type: 'refresh_token',
            redirect_uri: 'https://localhost:3000/auth/callback',
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

        const updatedTokenData: TokenData = await tokenResponse.json();
        logger.info('Refresh request token', updatedTokenData);
        res.cookie('token', updatedTokenData, {
            httpOnly: true,
            secure: true,
            maxAge: 1000 * 60 * 60 * 24 * 1, // 1 days
            sameSite: 'none',
        });
    };

    _makeRequest = async (
        resource: string,
        leagueId: string,
        req: express.Request,
        res: express.Response
    ): Promise<any> => {
        const tokenData = req.cookies.token as TokenData;
        const leagueSpec = `${GAME_KEY}.l.${leagueId}`;

        if (tokenData.expiry_server_time && Date.now() >= tokenData.expiry_server_time) {
            logger.info('Token expired, refreshing token');
            await this._reauthenticate(req, res);
        }

        logger.info('Fetching resource', resource);
        const response = await fetch(
            `https://fantasysports.yahooapis.com/fantasy/v2/league/${leagueSpec}/${resource}?format=json&`,
            {
                headers: {
                    Authorization: `Bearer ${tokenData.access_token}`,
                },
            }
        );
        const responseStatus = response.status;
        logger.info('Response status', { status: responseStatus });

        if (responseStatus === 401) {
            throw new Error('Unauthorized, please login again');
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

        const response = await this._makeRequest(`scoreboard;week=${week}`, leagueId, req, res);
        const transformedData = transformMatchups(response);
        return transformedData;
    }

    async getStandings(req: express.Request, res: express.Response) {
        const leagueId = SCHWIFTY_LEAGUE_ID;

        const response: YahooStandingsResponse = await this._makeRequest(
            'standings',
            leagueId,
            req,
            res
        );
        const transformedData = transformStandings(response);
        return transformedData;
    }

    async getGames(req: express.Request, res: express.Response) {
        const tokenData = req.cookies.token as TokenData;

        const response = await fetch(
            'https://fantasysports.yahooapis.com/fantasy/v2/game/nfl?format=json',
            {
                headers: {
                    Authorization: `Bearer ${tokenData.access_token}`,
                },
            }
        );
        const jsonRes = await response.json();
        return jsonRes;
    }
}
