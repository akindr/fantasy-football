import { GoogleAuthProvider, signInWithPopup, User } from "firebase/auth";
import { auth } from "./firebase";

class GoogleAuthService {
    private static readonly USER_KEY = 'firebase_user';

    async loginWithGoogle(): Promise<User> {
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            localStorage.setItem(GoogleAuthService.USER_KEY, JSON.stringify(result.user));
            return result.user;
        } catch (error) {
            console.error("Google sign-in error", error);
            throw error;
        }
    }

    async getIdToken(): Promise<string | null> {
        const user = this.getUser();
        if (!user) {
            return null;
        }
        // TODO: Figure out how to refresh the token automatically
        return auth.currentUser?.getIdToken(true);
    }

    getUser(): User | null {
        const user = localStorage.getItem(GoogleAuthService.USER_KEY);
        return user ? JSON.parse(user) : null;
    }

    isAuthenticated(): boolean {
        return !!this.getUser();
    }

    logout(): void {
        localStorage.removeItem(GoogleAuthService.USER_KEY);
        auth.signOut();
    }
}

export const googleAuthService = new GoogleAuthService();
