import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import { googleAuthService } from '../../../services/google-auth-service';
import { TransformedMatchup } from '../../../../functions/src/server/data-mappers';
import { MatchupPlayers } from '../awards/awards';
import { Insights } from '../../insights';
import { AwardsForm } from './awards-form';

const WEEK_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17];

type MatchupResponse = {
    imageData: string;
    mimeType: string;
} & TransformedMatchup;

export const Admin: React.FC = () => {
    const navigate = useNavigate();
    const [isVerifying, setIsVerifying] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [week, setWeek] = useState(1);
    const [selectedMatchupIndex, setSelectedMatchupIndex] = useState(0);
    const [historicInsights, setHistoricInsights] = useState<string>('');
    const [thisYearInsights, setThisYearInsights] = useState<string>('');

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

    const handleWeekChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setWeek(Number(e.target.value));
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
        <div className="p-4 text-white grid grid-cols-12 gap-4 h-full overflow-y-auto text-base font-helvetica">
            <AwardsForm
                week={week}
                matchups={matchups}
                selectedMatchupIndex={selectedMatchupIndex}
                onInsightsLoaded={setHistoricInsights}
                onThisYearInsightsLoaded={setThisYearInsights}
            />
            <div className="bg-slate-800 rounded-lg p-6 col-span-3 flex flex-col gap-3 h-full overflow-y-auto">
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
            <div className="col-span-3 h-full bg-slate-800 rounded-lg p-2 overflow-y-auto">
                {historicInsights && <Insights insights={historicInsights} />}
            </div>
            <div className="col-span-3 h-full bg-slate-800 rounded-lg p-2 overflow-y-auto">
                {thisYearInsights && <Insights insights={thisYearInsights} />}
            </div>
        </div>
    );
};
