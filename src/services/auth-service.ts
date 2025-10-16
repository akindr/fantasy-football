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

    // Wait for Firebase auth to initialize
    waitForAuth(): Promise<void> {
        return googleAuthService.waitForAuth();
    }

    // Combined authentication check
    isAuthenticated(): boolean {
        return yahooAuthService.isAuthenticated();
    }

    // Check if user is authenticated with Google
    async isGoogleAuthenticated(): Promise<boolean> {
        return googleAuthService.isAuthenticated();
    }

    // Combined logout
    logout(): void {
        yahooAuthService.logout();
        googleAuthService.logout();
    }
}

export const authService = new AuthService();
