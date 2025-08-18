import React from 'react';
import { authService } from '../services/auth-service';

export const Login: React.FC = () => {
    const handleLogin = () => {
        const authUrl = authService.getAuthUrl();
        window.location.href = authUrl;
    };

    return (
        <div className="login">
            <h1>Welcome to Fantasy Football</h1>
            <p>Please log in with your Yahoo account to continue.</p>
            <button onClick={handleLogin}>Login with Yahoo</button>
        </div>
    );
};
