import React from 'react';
import { authService } from '../services/auth-service';

export const Login: React.FC = () => {
    const handleLogin = () => {
        const authUrl = authService.getAuthUrl();
        window.location.href = authUrl;
    };

    return (
        <div className="p-4">
            <p className="mb-4">Please log in with your Yahoo account to continue:</p>
            <button
                className="button rounded-full px-5 py-2 cursor-pointer transition-colors bg-turq"
                onClick={handleLogin}
            >
                Login with Yahoo
            </button>
        </div>
    );
};
