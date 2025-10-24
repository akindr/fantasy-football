import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../../services/auth-service';
import { LoadingSpinner } from '../shared/loading-spinner';

export const AuthCallback: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const handleCallback = async () => {
            const code = searchParams.get('code');
            if (!code) {
                setError('No authorization code received');
                setIsLoading(false);
                return;
            }

            try {
                await authService.handleYahooCallback(code);
                // Retrieve the redirect path from sessionStorage
                const redirectPath = sessionStorage.getItem('redirectAfterLogin') || '/';
                sessionStorage.removeItem('redirectAfterLogin');
                navigate(redirectPath);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Authentication failed');
                setIsLoading(false);
            }
        };

        handleCallback();
    }, []);

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <div className="bg-red-900/20 border border-red-500 rounded-lg p-8 max-w-md">
                    <h2 className="text-3xl font-bold text-red-400 mb-4">Authentication Error</h2>
                    <p className="text-slate-300 mb-6">{error}</p>
                    <button
                        onClick={() => navigate('/')}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                    >
                        Return to Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="relative h-full flex items-center justify-center">
            <div className="text-center">
                <h2 className="text-3xl font-bold text-slate-100 mb-2">Authenticating...</h2>
            </div>
            <LoadingSpinner isLoading={isLoading} />
        </div>
    );
};
