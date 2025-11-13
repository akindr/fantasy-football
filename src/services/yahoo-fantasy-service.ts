import { API_CONFIG } from '../config';
import { googleAuthService } from './google-auth-service';
import { authService } from './auth-service';

export class AuthenticationRedirectError extends Error {
    constructor(message = 'Redirecting to Yahoo login') {
        super(message);
        this.name = 'AuthenticationRedirectError';
    }
}

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
    _baseURL: string;

    constructor() {
        this._baseURL = API_CONFIG.apiUri;
    }

    async makeRequest(url: string, options: RequestInit = {}) {
        const idToken = await googleAuthService.getIdToken();

        const headers: Record<string, string> = {
            ...(options.headers as Record<string, string>),
        };

        if (idToken) {
            headers['Authorization'] = `Bearer ${idToken}`;
        }

        const response = await fetch(url, {
            ...options,
            headers,
            credentials: 'include',
        });
        if (!response.ok) {
            const status = response.status;
            if (status === 401 || status === 403) {
                if (typeof window !== 'undefined') {
                    const { pathname, search, hash } = window.location;
                    const redirectDestination = `${pathname}${search}${hash}`;
                    if (pathname !== '/login' && pathname !== '/auth/callback') {
                        try {
                            sessionStorage.setItem(
                                'redirectAfterLogin',
                                redirectDestination || '/'
                            );
                        } catch (storageError) {
                            console.warn('Failed to persist redirect path', storageError);
                        }
                        const authUrl = authService.getYahooAuthUrl();
                        window.location.assign(authUrl);
                    }
                }
                throw new AuthenticationRedirectError();
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
