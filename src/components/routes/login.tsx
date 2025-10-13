import React from 'react';
import { authService } from '../../services/auth-service';
import { useNavigate } from 'react-router-dom';

export const Login: React.FC = () => {
    const navigate = useNavigate();
    const handleYahooLogin = () => {
        const authUrl = authService.getYahooAuthUrl();
        window.location.href = authUrl;
    };

    const handleGoogleLogin = async () => {
        try {
            await authService.loginWithGoogle();
            navigate('/'); // Redirect to home page after login
        } catch (error) {
            console.error('Google login failed', error);
            // Optionally, show an error message to the user
        }
    };

    return (
        <div className="p-4 flex flex-col items-start">
            <p className="mb-4">Please log in to continue:</p>
            <button
                className="button rounded-full px-5 py-2 cursor-pointer transition-colors bg-purple-500 mb-4 text-white"
                onClick={handleYahooLogin}
            >
                Login with Yahoo
            </button>
            <button
                className="button rounded-full px-5 py-2 cursor-pointer transition-colors bg-blue-500 text-white"
                onClick={handleGoogleLogin}
            >
                Login with Google
            </button>
        </div>
    );
};
