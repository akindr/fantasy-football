import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTransition, animated } from '@react-spring/web';
import { useSearchParams } from 'react-router-dom';

import type { Award } from '../../../../functions/src/server/types';
import { AwardsDisplay } from './awards-display';
import { TransformedMatchup } from '../../../../functions/src/server/data-mappers';
import { LoadingSpinner } from '../../shared/loading-spinner';
import { ErrorDialog } from '../../shared/error-dialog';
import { AiOutlineCloseCircle } from 'react-icons/ai';
import { numberFormatter } from '../../../utils/number-utils';
import { RankDisplay } from './matchup-details';
import { StreakDisplay } from './matchup-details';
import { CloverTrends } from './clovers-trends';
import { FigsGossipCorner } from './figs-gossip-corner';
import { EndScreen } from './end-screen';

const WEEK_OPTIONS = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17];
const NO_WEEK_SELECTED = -1;

type ViewState =
    | { type: 'home' }
    | { type: 'awards'; data: Award[] }
    | { type: 'no-awards'; week: number };

export const Awards: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const week = parseInt(searchParams.get('week') ?? NO_WEEK_SELECTED.toString());
    const [error, setError] = useState<string | null>(null);
    const isFirstRender = useRef(true);

    const {
        data: awardsData,
        isLoading,
        error: awardsError,
    } = useQuery<{ awards: Award[] }>({
        queryKey: ['awards', week],
        refetchOnWindowFocus: false,
        enabled: () => {
            return week !== NO_WEEK_SELECTED;
        },
    });

    useEffect(() => {
        if (!error && awardsError) {
            setError(awardsError.message);
        }
    }, [error, awardsError]);

    const handleWeekChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        const nextParams = new URLSearchParams(searchParams);

        if (value) {
            nextParams.set('week', value);
        } else {
            nextParams.delete('week');
        }

        setSearchParams(nextParams);
    };

    // Determine current view state
    const viewState: ViewState | null = useMemo(() => {
        if (isLoading) return null; // Don't transition while loading

        if (week === NO_WEEK_SELECTED) {
            return { type: 'home' };
        }

        if (awardsData?.awards && awardsData.awards.length > 0) {
            return { type: 'awards', data: awardsData.awards };
        }

        return { type: 'no-awards', week };
    }, [week, isLoading, awardsData]);

    // Use transition to animate between states
    const transitions = useTransition(viewState, {
        keys: item => item?.type ?? 'loading',
        from: { opacity: 0, transform: 'translateY(100%)' },
        enter: { opacity: 1, transform: 'translateY(0%)' },
        leave: { opacity: 0, transform: 'translateY(100%)' },
        immediate: isFirstRender.current,
        config: {
            tension: 280,
            friction: 60,
        },
        onRest: () => {
            isFirstRender.current = false;
        },
    });

    const handleReset = () => {
        const nextParams = new URLSearchParams(searchParams);
        nextParams.delete('week');
        setSearchParams(nextParams);
    };

    return (
        <div className="flex flex-col h-full relative w-full overflow-hidden">
            <LoadingSpinner isLoading={isLoading} />
            <ErrorDialog
                message={error}
                onDismiss={() => {
                    setError(null);
                    const nextParams = new URLSearchParams(searchParams);
                    nextParams.delete('week');
                    setSearchParams(nextParams);
                }}
            />
            {transitions((style, item) => {
                if (!item) return null;

                if (item.type === 'home') {
                    return (
                        <animated.div
                            style={style}
                            className="absolute inset-0 flex flex-col justify-center items-center p-4"
                        >
                            <img
                                src="/awards-logo.png"
                                className="w-5/6 md:max-w-[450px] h-auto object-contain"
                            />
                            <p className="text-base my-4 text-center font-artlab-regular">
                                Choose a week to view the awards!
                                <br />
                                <br />
                                Scroll down to see every matchup.
                                <br />
                                <br /> When you&apos;re done, click the &apos;x&apos; to choose
                                another week!
                            </p>
                            <select
                                value={week ?? ''}
                                onChange={handleWeekChange}
                                className="bg-indigo-700 text-white/95 border-1 border-indigo-500 rounded-md p-2 focus:outline-none"
                            >
                                <option value={''}>Select a week</option>
                                {WEEK_OPTIONS.map(w => (
                                    <option key={w} value={w}>
                                        Week {w}
                                    </option>
                                ))}
                            </select>
                        </animated.div>
                    );
                }

                if (item.type === 'no-awards') {
                    return (
                        <animated.div
                            style={style}
                            className="absolute inset-0 flex flex-col justify-center items-center p-4"
                        >
                            <img
                                src="/awards-not-found.png"
                                className="w-5/6 md:max-w-[450px] h-auto object-contain"
                            />
                            <p className="text-base lg:text-xl my-4 text-center font-artlab-regular">
                                No awards found for Week {item.week}
                            </p>
                            <button
                                className="text-2xl text-center my-4 cursor-pointer bg-amber-700 text-white px-4 py-2 rounded-md hover:bg-amber-600 transition-colors"
                                onClick={handleReset}
                            >
                                Choose another week...
                            </button>
                        </animated.div>
                    );
                }

                if (item.type === 'awards') {
                    return (
                        <animated.div style={style} className="absolute inset-0">
                            <div
                                className="absolute top-2 right-2 w-[40px] h-[40px] cursor-pointer text-white text-4xl z-10 hover:text-gray-300 transition-colors flex flex-col items-center justify-center bg-gray-900/50 rounded-full"
                                onClick={handleReset}
                            >
                                <AiOutlineCloseCircle />
                            </div>
                            <AllAwardsContainer awards={item.data} week={week ?? 1} />
                        </animated.div>
                    );
                }

                return null;
            })}
        </div>
    );
};

export const AllAwardsContainer = ({ awards, week }: { awards: Award[]; week: number }) => {
    return (
        <div className="flex-1 h-full w-full relative overflow-y-auto snap-y snap-mandatory">
            {awards.map(award => (
                <AwardsDisplay key={award.matchup.id} award={award} />
            ))}
            <CloverTrends />
            <FigsGossipCorner week={week} />
            <EndScreen week={week} />
        </div>
    );
};

export const MatchupPlayers = ({ matchup }: { matchup: TransformedMatchup }) => {
    return (
        <div className="h-full w-full snap-start overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Team 1 Column */}
                <div className="bg-slate-400/40 rounded-3xl p-4 flex flex-col gap-4">
                    {/* Header: Team logo + name */}
                    <div className="flex flex-col items-center gap-2">
                        <img src={matchup.team1.logo} className="w-16 h-16 rounded-full" />
                        <span className="text-2xl font-think-loved text-center">
                            {matchup.team1.name}
                        </span>
                    </div>
                    {/* Total points */}
                    <div className="flex flex-col items-center justify-center">
                        <span className="text-5xl font-semibold">
                            {numberFormatter.format(matchup.team1.points)}
                        </span>
                        <span className="text-xl text-gray-300">
                            {numberFormatter.format(matchup.team1.pointsProjected)} Projected
                        </span>
                        <span className="text-xl text-gray-100">
                            {matchup.team1.standings?.wins} - {matchup.team1.standings?.losses}
                        </span>
                    </div>
                    {matchup.team1.standings?.rank && (
                        <RankDisplay rank={matchup.team1.standings.rank} />
                    )}
                    {matchup.team1.standings?.streak && (
                        <StreakDisplay streak={matchup.team1.standings.streak} />
                    )}
                    {/* Players list */}
                    <div className="flex flex-col divide-y divide-white/50">
                        {matchup.team1.players?.map(player => {
                            const points =
                                player.stats?.points != null
                                    ? numberFormatter.format(player.stats.points)
                                    : '-';
                            return (
                                <div key={player.playerId} className="py-2">
                                    <div className="grid grid-cols-[3rem_1fr_auto] items-center gap-3">
                                        <span className="text-sm font-medium tabular-nums text-gray-800">
                                            {player.selectedPosition || player.position}
                                        </span>
                                        <span className="text-base text-gray-200 truncate">
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
                <div className="bg-slate-400/40 rounded-3xl p-4 flex flex-col gap-4">
                    {/* Header: Team logo + name */}
                    <div className="flex flex-col items-center gap-2">
                        <img src={matchup.team2.logo} className="w-16 h-16 rounded-full" />
                        <span className="text-2xl font-think-loved text-center">
                            {matchup.team2.name}
                        </span>
                    </div>
                    {/* Total points */}
                    <div className="flex flex-col items-center justify-center">
                        <span className="text-5xl font-semibold">
                            {numberFormatter.format(matchup.team2.points)}
                        </span>
                        <span className="text-xl text-gray-300">
                            {numberFormatter.format(matchup.team2.pointsProjected)} Projected
                        </span>
                        <span className="text-xl text-gray-100">
                            {matchup.team2.standings?.wins} - {matchup.team2.standings?.losses}
                        </span>
                    </div>
                    {matchup.team2.standings?.rank && (
                        <RankDisplay rank={matchup.team2.standings.rank} />
                    )}
                    {matchup.team2.standings?.streak && (
                        <StreakDisplay streak={matchup.team2.standings.streak} />
                    )}
                    {/* Players list */}
                    <div className="flex flex-col divide-y divide-white/50">
                        {matchup.team2.players?.map(player => {
                            const points =
                                player.stats?.points != null
                                    ? numberFormatter.format(player.stats.points)
                                    : '-';
                            return (
                                <div key={player.playerId} className="py-2">
                                    <div className="grid grid-cols-[3rem_1fr_auto] items-center gap-3">
                                        <span className="text-sm font-medium tabular-nums text-gray-800">
                                            {player.selectedPosition || player.position}
                                        </span>
                                        <span className="text-base text-gray-200 truncate">
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
