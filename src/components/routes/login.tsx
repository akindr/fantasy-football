import React from 'react';
import { authService } from '../../services/auth-service';
import { useNavigate, useLocation } from 'react-router-dom';

export const Login: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const from = (location.state as { from?: string })?.from || '/';

    const handleYahooLogin = () => {
        // Store the redirect path for after Yahoo callback
        sessionStorage.setItem('redirectAfterLogin', from);
        const authUrl = authService.getYahooAuthUrl();
        window.location.href = authUrl;
    };

    const handleGoogleLogin = async () => {
        try {
            await authService.loginWithGoogle();
            navigate(from); // Redirect to original page or home
        } catch (error) {
            console.error('Google login failed', error);
            // Optionally, show an error message to the user
        }
    };

    return (
        <div className="p-4 flex flex-col items-center justify-center text-center w-full h-full">
            <img src="/login.png" className="w-5/6 md:max-w-[450px] object-cover" />
            <p className="my-4 text-base font-artlab-medium">
                To use the site, you must log in with your Yahoo account
            </p>
            <button
                className="button rounded-full px-5 py-2 cursor-pointer transition-colors bg-purple-500 mb-6 text-white"
                onClick={handleYahooLogin}
            >
                Login with Yahoo
            </button>

            <h2 className="text-base font-artlab-medium mb-2">Optional (for admins only)</h2>
            <button
                className="button rounded-full px-5 py-2 cursor-pointer transition-colors bg-blue-500 text-white"
                onClick={handleGoogleLogin}
            >
                Login with Google (optional)
            </button>
        </div>
    );
};
