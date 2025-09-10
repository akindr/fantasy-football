import express from 'express';
import {
    transformMatchups,
    transformStandings,
    type YahooStandingsResponse,
} from '../data-mappers.ts';

import { type TokenData } from '../server.ts';
import { GAME_KEY, SCHWIFTY_LEAGUE_ID } from '../constants.ts';

export class YahooGateway {
    constructor() {}

    _makeRequest = async (
        resource: string,
        leagueId: string,
        req: express.Request,
        res: express.Response,
        shouldRetry: boolean | undefined = true
    ) => {
        const tokenData = req.cookies.token as TokenData;
        const leagueSpec = `${GAME_KEY}.l.${leagueId}`;

        try {
            const response = await fetch(
                `https://fantasysports.yahooapis.com/fantasy/v2/league/${leagueSpec}/${resource}?format=json&`,
                {
                    headers: {
                        Authorization: `Bearer ${tokenData.access_token}`,
                    },
                }
            );
            const jsonRes = await response.json();
            return jsonRes;
        } catch (e) {
            console.error('Error fetching resource:', e);
            const tokenData = req.cookies.token as TokenData;

            const clientId = process.env.REACT_APP_YAHOO_CLIENT_ID;
            const clientSecret = process.env.REACT_APP_YAHOO_CLIENT_SECRET;

            const payload = new URLSearchParams({
                grant_type: 'refresh_token',
                redirect_uri: 'https://localhost:3000/auth/callback',
                refresh_token: tokenData.refresh_token || '',
            });
            const tokenResponse = await fetch('https://api.login.yahoo.com/oauth2/get_token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
                },
                body: payload,
            });

            const updatedTokenData: TokenData = await tokenResponse.json();
            res.cookie('token', updatedTokenData, {
                httpOnly: true,
                secure: true,
                maxAge: 1000 * 60 * 60 * 24 * 1, // 1 days
                sameSite: 'none',
            });

            // Try the request again
            return this._makeRequest(resource, leagueId, req, res, false);
        }
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
