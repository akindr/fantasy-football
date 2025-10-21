import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Award } from '../../../../functions/src/server/types';
import { AwardsDisplay } from './awards-display';
import { TransformedMatchup } from '../../../../functions/src/server/data-mappers';

const WEEK_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17];

export const Awards: React.FC = () => {
    const [week, setWeek] = useState<number | undefined>(undefined);

    const {
        data: awardsData,
        isLoading,
        error,
    } = useQuery<{ awards: Award[] }>({
        queryKey: ['awards', week],
        refetchOnWindowFocus: false,
        enabled: () => {
            return week !== undefined;
        },
    });

    const handleWeekChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setWeek(Number(e.target.value));
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex justify-between items-center flex-0 p-4">
                <h2>League Matchups</h2>
                <select value={week} onChange={handleWeekChange}>
                    <option value={''}>Choose a week</option>
                    {WEEK_OPTIONS.map(w => (
                        <option key={w} value={w}>
                            Week {w}
                        </option>
                    ))}
                </select>
            </div>
            {isLoading && <div>Loading matchups...</div>}
            {error && <div>Error loading matchups: {error.message}</div>}
            {awardsData?.awards && <AllAwardsContainer awards={awardsData?.awards} />}
        </div>
    );
};

export const AllAwardsContainer = ({ awards }: { awards: Award[] }) => {
    return (
        <div className="flex-1 h-full w-full relative bg-black font-sink overflow-y-auto snap-y snap-mandatory">
            {awards.map(award => (
                <AwardsDisplay key={award.matchup.id} award={award} />
            ))}
        </div>
    );
};

export const MatchupPlayers = ({ matchup }: { matchup: TransformedMatchup }) => {
    return (
        <div className="h-full w-full p-4 snap-start bg-indigo-500/66 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Team 1 Column */}
                <div className="bg-white/40 rounded-3xl p-4 flex flex-col gap-4">
                    {/* Header: Team logo + name */}
                    <div className="flex flex-col items-center gap-2">
                        <img src={matchup.team1.logo} className="w-16 h-16 rounded-full" />
                        <span className="text-2xl font-think-loved text-center">
                            {matchup.team1.name}
                        </span>
                    </div>
                    {/* Total points */}
                    <div className="flex items-center justify-center">
                        <span className="text-5xl font-semibold">{matchup.team1.points}</span>
                    </div>
                    {/* Players list */}
                    <div className="flex flex-col divide-y divide-white/50">
                        {matchup.team1.players?.map(player => {
                            const points = player.stats?.points ?? '-';
                            return (
                                <div key={player.playerId} className="py-2">
                                    <div className="grid grid-cols-[3rem_1fr_auto] items-center gap-3">
                                        <span className="text-sm font-medium tabular-nums text-gray-800">
                                            {player.selectedPosition || player.position}
                                        </span>
                                        <span className="text-base text-gray-900 truncate">
                                            {player.name}
                                        </span>
                                        <span className="text-base font-semibold text-right tabular-nums">
                                            {points}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Team 2 Column */}
                <div className="bg-white/40 rounded-3xl p-4 flex flex-col gap-4">
                    {/* Header: Team logo + name */}
                    <div className="flex flex-col items-center gap-2">
                        <img src={matchup.team2.logo} className="w-16 h-16 rounded-full" />
                        <span className="text-2xl font-think-loved text-center">
                            {matchup.team2.name}
                        </span>
                    </div>
                    {/* Total points */}
                    <div className="flex items-center justify-center">
                        <span className="text-5xl font-semibold">{matchup.team2.points}</span>
                    </div>
                    {/* Players list */}
                    <div className="flex flex-col divide-y divide-white/50">
                        {matchup.team2.players?.map(player => {
                            const points = player.stats?.points ?? '-';
                            return (
                                <div key={player.playerId} className="py-2">
                                    <div className="grid grid-cols-[3rem_1fr_auto] items-center gap-3">
                                        <span className="text-sm font-medium tabular-nums text-gray-800">
                                            {player.selectedPosition || player.position}
                                        </span>
                                        <span className="text-base text-gray-900 truncate">
                                            {player.name}
                                        </span>
                                        <span className="text-base font-semibold text-right tabular-nums">
                                            {points}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};
