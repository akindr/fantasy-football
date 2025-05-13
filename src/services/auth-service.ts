import { API_CONFIG } from '../config';

class AuthService {
    private static readonly TOKEN_KEY = 'yahoo_fantasy_token';

    getAuthUrl(): string {
        const params = new URLSearchParams({
            client_id: API_CONFIG.clientId,
            redirect_uri: API_CONFIG.redirectUri,
            response_type: 'code',
            state: this.generateRandomState(),
        });

        return `https://api.login.yahoo.com/oauth2/request_auth?${params.toString()}`;
    }

    private generateRandomState(): string {
        return Math.random().toString(36).substring(2, 15);
    }

    async handleCallback(code: string): Promise<string> {
        try {
            const tokenResponse = await fetch('https://localhost:3001/oauth/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ code }),
                // Allow self-signed certificates in development
                mode: 'cors',
                credentials: 'include',
            });

            const { access_token } = await tokenResponse.json();
            this.setToken(access_token);
            return access_token;
        } catch (error) {
            console.error('Token exchange error:', error);
            throw error;
        }
    }

    setToken(token: string): void {
        localStorage.setItem(AuthService.TOKEN_KEY, token);
    }

    getToken(): string | null {
        return localStorage.getItem(AuthService.TOKEN_KEY);
    }

    isAuthenticated(): boolean {
        return !!this.getToken();
    }

    logout(): void {
        localStorage.removeItem(AuthService.TOKEN_KEY);
    }
}

export const authService = new AuthService();
