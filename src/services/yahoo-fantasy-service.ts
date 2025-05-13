import YahooFantasy from 'yahoo-fantasy';
import { API_CONFIG } from '../config';

export interface Team {
    team_id: string;
    name: string;
    rank: number;
    wins: number;
    losses: number;
    ties: number;
    percentage: string;
    games_behind: string;
}

export class YahooFantasyService {
    private yf: any;
    private token: string | null = null;

    constructor() {
        try {
            if (!API_CONFIG.clientId || !API_CONFIG.clientSecret) {
                throw new Error('Yahoo API credentials are missing. Please check your .env file.');
            }

            // Initialize with credentials
            this.yf = new YahooFantasy(API_CONFIG.clientId, API_CONFIG.clientSecret);
            // Check if auth token is in session storage
            const token = sessionStorage.getItem('yahoo_fantasy_token');
            if (token) {
                this.setToken(token);
            }
        } catch (error) {
            console.error('Error initializing YahooFantasyService:', error);
            throw error;
        }
    }

    setToken(token: string) {
        try {
            sessionStorage.setItem('yahoo_fantasy_token', token);
            this.token = token;
            this.yf.setUserToken(token);
        } catch (error) {
            console.error('Error setting token:', error);
            throw error;
        }
    }

    async makeRequest(url: string, options: RequestInit = {}) {
        const response = await fetch(url, {
            ...options,
            credentials: 'include',
        });
        if (!response.ok) {
            const status = response.status;
            if (status === 401) {
                throw new Error('Unauthorized');
            }
            throw new Error(`Unexpected error, status: ${status}`);
        }
        return response.json();
    }

    /**
     * Make a request to the server API
     * @param queryKey - this is a basic request path for things like standings, teams, etc.
     * @returns
     */
    async query(queryKey: string[]) {
        const response = await this.makeRequest(`https://localhost:3001/api/${queryKey[0]}`);
        return response;
    }
}

export const yahooFantasyService = new YahooFantasyService();
