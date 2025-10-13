import { yahooAuthService } from './yahoo-auth-service';
import { googleAuthService } from './google-auth-service';
import { User } from 'firebase/auth';

class AuthService {
    // Delegating to YahooAuthService
    getYahooAuthUrl(): string {
        return yahooAuthService.getAuthUrl();
    }

    handleYahooCallback(code: string): Promise<string> {
        return yahooAuthService.handleCallback(code);
    }

    // Delegating to GoogleAuthService
    loginWithGoogle(): Promise<User> {
        return googleAuthService.loginWithGoogle();
    }

    getGoogleIdToken(): Promise<string | null> {
        return googleAuthService.getIdToken();
    }

    getUser(): User | null {
        return googleAuthService.getUser();
    }

    // Combined authentication check
    isAuthenticated(): boolean {
        return yahooAuthService.isAuthenticated();
    }

    // Combined logout
    logout(): void {
        yahooAuthService.logout();
        googleAuthService.logout();
    }
}

export const authService = new AuthService();
