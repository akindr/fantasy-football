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
     * @param queryKey - Array where:
     *   - String elements are path segments: ['admin', 'insights'] -> /admin/insights
     *   - Object at the end is query params: [{ week: 1 }] -> ?week=1
     * @example ['admin', 'insights', { matchup: 1, team1: '123' }] -> /admin/insights?matchup=1&team1=123
     * @example ['awards', { week: 5 }] -> /awards?week=5
     * @example ['standings'] -> /standings
     * @returns
     */
    async query(queryKey: (string | Record<string, string | number>)[]) {
        if (queryKey.length === 0) {
            throw new Error('Query key must contain at least one element');
        }

        const pathSegments: string[] = [];
        let queryParams: Record<string, string | number> | null = null;

        for (const segment of queryKey) {
            if (typeof segment === 'string') {
                pathSegments.push(segment);
            } else if (typeof segment === 'object' && segment !== null) {
                // Object is treated as query params (must be last)
                queryParams = segment as Record<string, string | number>;
                break;
            }
        }

        // Build the path
        const path = pathSegments.join('/');

        // Build query string
        let queryString = '';
        if (queryParams) {
            const params = new URLSearchParams();
            Object.entries(queryParams).forEach(([key, value]) => {
                if (value !== null && value !== undefined) {
                    params.append(key, String(value));
                }
            });
            queryString = params.toString();
            if (queryString) {
                queryString = '?' + queryString;
            }
        }

        const url = `${this._baseURL}/${path}${queryString}`;
        return this.makeRequest(url);
    }
}

export const yahooFantasyService = new YahooFantasyService();
