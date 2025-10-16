import { GoogleAuthProvider, signInWithPopup, User, onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';

class GoogleAuthService {
    private authReady: Promise<void>;

    constructor() {
        // Set up auth state listener to know when Firebase has restored the session
        this.authReady = new Promise(resolve => {
            // onAuthStateChanged fires immediately with the current state
            // and then again whenever the auth state changes
            const unsubscribe = onAuthStateChanged(auth, () => {
                resolve();
                unsubscribe(); // Only need this once for initialization
            });
        });
    }

    /**
     * Wait for Firebase Auth to finish initializing.
     * This ensures auth.currentUser is populated after page refresh.
     */
    async waitForAuth(): Promise<void> {
        return this.authReady;
    }

    async loginWithGoogle(): Promise<User> {
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            return result.user;
        } catch (error) {
            console.error('Google sign-in error', error);
            throw error;
        }
    }

    async getIdToken(): Promise<string | null | undefined> {
        await this.waitForAuth();
        return auth.currentUser?.getIdToken(true);
    }

    /**
     * Check if the current user has admin privileges via Firebase Custom Claims.
     * This method forces a token refresh to get the latest claims.
     */
    async isAdmin(): Promise<boolean> {
        await this.waitForAuth();
        const user = auth.currentUser;

        if (!user) {
            return false;
        }

        try {
            // Force token refresh to get latest claims
            const tokenResult = await user.getIdTokenResult(true);
            return tokenResult.claims.admin === true;
        } catch (error) {
            console.error('Error checking admin status:', error);
            return false;
        }
    }

    getUser(): User | null {
        return auth.currentUser;
    }

    async isAuthenticated(): Promise<boolean> {
        await this.waitForAuth();
        return !!auth.currentUser;
    }

    logout(): void {
        auth.signOut();
    }
}

export const googleAuthService = new GoogleAuthService();
