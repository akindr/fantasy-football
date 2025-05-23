import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../services/auth-service';
import { yahooFantasyService } from '../services/yahoo-fantasy-service';

export const AuthCallback: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const handleCallback = async () => {
            const code = searchParams.get('code');
            if (!code) {
                setError('No authorization code received');
                return;
            }

            try {
                const token = await authService.handleCallback(code);
                yahooFantasyService.setToken(token);
                navigate('/');
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Authentication failed');
            }
        };

        handleCallback();
    }, [searchParams, navigate]);

    if (error) {
        return (
            <div className="auth-callback error">
                <h2>Authentication Error</h2>
                <p>{error}</p>
                <button onClick={() => navigate('/')}>Return to Home</button>
            </div>
        );
    }

    return (
        <div className="auth-callback loading">
            <h2>Authenticating...</h2>
            <p>Please wait while we complete the authentication process.</p>
        </div>
    );
};
