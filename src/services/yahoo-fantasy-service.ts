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

function getBaseURL() {
    return process.env.NODE_ENV === 'production'
        ? 'https://us-central1-get-schwifty-football.cloudfunctions.net/api'
        : 'https://localhost:3001/api';
}

export class YahooFantasyService {
    _baseURL: string;

    constructor() {
        this._baseURL = getBaseURL();
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
        const response = await this.makeRequest(
            `${this._baseURL}/${queryKey[0]}?week=${queryKey[1]}`
        );
        return response;
    }
}

export const yahooFantasyService = new YahooFantasyService();
