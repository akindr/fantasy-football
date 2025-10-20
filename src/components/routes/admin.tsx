import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

import { googleAuthService } from '../../services/google-auth-service';
import { yahooFantasyService } from '../../services/yahoo-fantasy-service';
import { API_CONFIG } from '../../config';
import { TransformedMatchup } from '../../../functions/src/server/data-mappers';
import { MatchupPlayers } from './awards';
import { Button } from '../shared/buttons';

const WEEK_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17];

type MatchupResponse = {
    imageData: string;
    mimeType: string;
} & TransformedMatchup;

export const Admin: React.FC = () => {
    const navigate = useNavigate();
    const [isVerifying, setIsVerifying] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [week, setWeek] = useState(1);
    const [selectedMatchupIndex, setSelectedMatchupIndex] = useState(0);
    const [insights, setInsights] = useState<{ category: string; data: string }[]>([]);

    const {
        data: matchups,
        isLoading,
        error,
    } = useQuery<MatchupResponse[]>({
        queryKey: ['matchups', week],
        refetchOnWindowFocus: false,
        enabled: () => {
            return week !== undefined;
        },
    });

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

        if (!matchups || !matchups[selectedMatchupIndex]) {
            return;
        }

        const selected = matchups[selectedMatchupIndex];

        const awardData = {
            week,
            matchup: selectedMatchupIndex + 1,
            imageURL: `data:${selected.mimeType};base64,${selected.imageData}`,
            team1: {
                name: selected.team1.name,
                logo: selected.team1.logo,
                points: selected.team1.points,
            },
            team2: {
                name: selected.team2.name,
                logo: selected.team2.logo,
                points: selected.team2.points,
            },
            title,
            description,
        } as const;

        // @ts-expect-error server typing TBD
        createAwardMutation.mutate(awardData);
    };

    const handleWeekChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setWeek(Number(e.target.value));
    };

    const getMatchupInsights = async () => {
        const insightData = await yahooFantasyService.makeRequest(
            `${API_CONFIG.apiUri}/admin/insights?matchup=${selectedMatchupIndex + 1}`,
            {
                method: 'GET',
            }
        );
        setInsights(insightData.insights);
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
        <div className="p-4 text-white grid grid-cols-5 gap-4">
            <div className="bg-slate-800 rounded-lg p-6 mb-4 col-span-2">
                <p className="text-gray-300 mb-4 text-2xl">Awards Creator</p>
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

                        <div className="flex flex-row gap-2">
                            <Button
                                type="submit"
                                disabled={createAwardMutation.isPending}
                                onClick={handleSubmit}
                            >
                                {createAwardMutation.isPending ? 'Creating...' : 'Create Award'}
                            </Button>
                            <Button type="button" onClick={getMatchupInsights}>
                                Get Insights for Matchup
                            </Button>
                        </div>
                        {createAwardMutation.isSuccess && (
                            <p className="text-green-400 text-sm">Award created successfully!</p>
                        )}

                        {insights.length > 0 && (
                            <div className="flex flex-col gap-2 bg-slate-300">
                                {insights.map(insight => (
                                    <div key={insight.category}>
                                        <p className="text-lg font-medium text-black">
                                            {insight.category}
                                        </p>
                                        <p className="text-sm text-gray-500">{insight.data}</p>
                                    </div>
                                ))}
                            </div>
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
            <div className="bg-slate-800 rounded-lg p-6 col-span-3">
                <div className="flex flex-col gap-3">
                    <div className="flex flex-row items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <label htmlFor="week" className="text-lg font-medium text-gray-300">
                                Week
                            </label>
                            <select
                                id="week"
                                value={week}
                                onChange={handleWeekChange}
                                className="bg-slate-700 text-white rounded px-3 py-2"
                            >
                                {WEEK_OPTIONS.map(w => (
                                    <option key={w} value={w}>
                                        Week {w}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-center gap-2">
                            <label htmlFor="matchup" className="text-lg font-medium text-gray-300">
                                Matchup
                            </label>
                            <select
                                id="matchup"
                                value={selectedMatchupIndex}
                                onChange={e => setSelectedMatchupIndex(Number(e.target.value))}
                                className="bg-slate-700 text-white rounded px-3 py-2 w-[200px]"
                            >
                                {matchups?.map((m, idx) => (
                                    <option key={m.id} value={idx}>
                                        {m.team1.name} vs {m.team2.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    {isLoading && <div>Loading matchups...</div>}
                    {error && <div>Error loading matchups: {error.message}</div>}
                    {matchups && (
                        <div className="h-full">
                            <MatchupPlayers
                                matchup={matchups[selectedMatchupIndex] as MatchupResponse}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
