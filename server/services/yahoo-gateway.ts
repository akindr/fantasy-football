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

    _makeRequest = async (resource: string, leagueId: string, req: express.Request) => {
        const tokenData = req.cookies.token as TokenData;
        const leagueSpec = `${GAME_KEY}.l.${leagueId}`;

        const response = await fetch(
            `https://fantasysports.yahooapis.com/fantasy/v2/league/${leagueSpec}/${resource}?format=json`,
            {
                headers: {
                    Authorization: `Bearer ${tokenData.access_token}`,
                },
            }
        );
        const jsonRes = await response.json();
        return jsonRes;
    };

    async getLeagueInfo(leagueId: string) {
        const response = await fetch(`https://fantasysports.yahoo.com/f1/461/teams/${leagueId}`);
        return response.json();
    }

    async getMatchups(req: express.Request) {
        const leagueId = SCHWIFTY_LEAGUE_ID;
        const response = await this._makeRequest('scoreboard', leagueId, req);
        const transformedData = transformMatchups(response);
        return transformedData;
    }

    async getStandings(req: express.Request) {
        const leagueId = SCHWIFTY_LEAGUE_ID;

        const response: YahooStandingsResponse = await this._makeRequest(
            'standings',
            leagueId,
            req
        );
        const transformedData = transformStandings(response);
        return transformedData;
    }

    async getGames(req: express.Request) {
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
