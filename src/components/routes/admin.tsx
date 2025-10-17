import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { googleAuthService } from '../../services/google-auth-service';
import { yahooFantasyService } from '../../services/yahoo-fantasy-service';
import { API_CONFIG } from '../../config';

export const Admin: React.FC = () => {
    const navigate = useNavigate();
    const [isVerifying, setIsVerifying] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');

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

    // React Query mutation for creating an award
    const createAwardMutation = useMutation({
        // TODO type the data
        mutationFn: async awardData => {
            return yahooFantasyService.makeRequest(`${API_CONFIG.apiUri}/data/awards`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(awardData),
            });
        },
        onSuccess: () => {
            console.log('Award created successfully!');
            setTitle('');
            setDescription('');
        },
        onError: error => {
            console.error('Error creating award:', error);
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Create dummy data for the required fields
        const dummyAwardData = {
            week: 1,
            matchup: 1,
            imageURL: 'https://via.placeholder.com/600x400',
            team1: {
                name: 'Team Alpha',
                logo: 'https://via.placeholder.com/100',
                points: 120.5,
            },
            team2: {
                name: 'Team Beta',
                logo: 'https://via.placeholder.com/100',
                points: 115.3,
            },
            title,
            description,
            matchupHighlights: [
                { player: 'Player 1', points: 25.5 },
                { player: 'Player 2', points: 22.3 },
            ],
        };

        // @ts-expect-error - this is a dummy data
        createAwardMutation.mutate(dummyAwardData);
    };

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
                <p className="text-gray-300 mb-4 text-4xl">Awards Creator</p>
                <div className="my-6 p-4 bg-slate-700 rounded">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="title" className="block text-md font-medium mb-2">
                                Title
                            </label>
                            <input
                                id="title"
                                type="text"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-600 text-white rounded border border-slate-500 focus:outline-none focus:border-blue-500"
                                placeholder="Enter award title"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="description" className="block text-md font-medium mb-2">
                                Description
                            </label>
                            <textarea
                                id="description"
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-600 text-white rounded border border-slate-500 focus:outline-none focus:border-blue-500 min-h-[100px]"
                                placeholder="Enter award description"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={createAwardMutation.isPending}
                            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-500 disabled:cursor-not-allowed"
                        >
                            {createAwardMutation.isPending ? 'Creating...' : 'Create Award'}
                        </button>

                        {createAwardMutation.isSuccess && (
                            <p className="text-green-400 text-sm">Award created successfully!</p>
                        )}

                        {createAwardMutation.isError && (
                            <p className="text-red-400 text-sm">
                                Error: {createAwardMutation.error?.message}
                            </p>
                        )}
                    </form>
                </div>

                <button
                    onClick={async () => {
                        const idToken = await googleAuthService.getIdToken();
                        fetch(`${API_CONFIG.apiUri}/data/awards?week=1&matchup=1`, {
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
                    Get Awards
                </button>
            </div>
        </div>
    );
};
