import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { googleAuthService } from '../../services/google-auth-service';
import { API_CONFIG } from '../../config';

export const Admin: React.FC = () => {
    const navigate = useNavigate();
    const [isVerifying, setIsVerifying] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        const verifyAdminAccess = async () => {
            try {
                // Wait for Firebase to restore the session
                await googleAuthService.waitForAuth();

                // Check if user is authenticated with Google
                const isAuthenticated = await googleAuthService.isAuthenticated();
                if (!isAuthenticated) {
                    console.log('User is not authenticated');
                    navigate('/');
                    return;
                }

                // Check admin claim directly from Firebase token - NO API CALL NEEDED!
                const isAdmin = await googleAuthService.isAdmin();

                if (!isAdmin) {
                    console.log('User is not an admin');
                    navigate('/');
                    return;
                }

                setIsAuthorized(true);
            } catch (error) {
                console.error('Error verifying admin access:', error);
                navigate('/');
            } finally {
                setIsVerifying(false);
            }
        };

        verifyAdminAccess();
    }, [navigate]);

    if (isVerifying) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-white text-2xl">Verifying admin access...</div>
            </div>
        );
    }

    if (!isAuthorized) {
        return null;
    }

    return (
        <div className="p-4 text-white">
            <div className="bg-slate-800 rounded-lg p-6">
                <p className="text-gray-300 mb-4">
                    You have successfully authenticated as an administrator.
                </p>
                <div className="my-6 p-4 bg-slate-700 rounded">
                    <h3 className="text-lg font-semibold mb-2">Admin Status</h3>
                    <p className="text-green-400">✓ Admin privileges active</p>
                    <p className="text-sm text-gray-400 mt-2">
                        Your admin status is verified via Firebase Custom Claims
                    </p>
                </div>
                <button
                    onClick={async () => {
                        const idToken = await googleAuthService.getIdToken();
                        fetch(`${API_CONFIG.apiUri}/admin/hello`, {
                            headers: {
                                Authorization: `Bearer ${idToken}`,
                            },
                        })
                            .then(response => response.json())
                            .then(data => console.log(data))
                            .catch(error => console.error('Error testing admin endpoint:', error));
                    }}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                    Test Admin Endpoint
                </button>
            </div>
        </div>
    );
};
