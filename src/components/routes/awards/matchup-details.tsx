// Shows the image and the score details
import React, { useMemo } from 'react';
import { useInView, useSpring, useChain, useSpringRef, animated } from '@react-spring/web';
import Markdown from 'react-markdown';
import { AiFillCheckCircle, AiOutlineCaretDown, AiOutlineCaretUp } from 'react-icons/ai';

import { Award } from '../../../../functions/src/server/types';
import { numberFormatter } from '../../../utils/number-utils';

export const MatchupDetails = ({ award }: { award: Award }) => {
    const { matchup } = award;
    const { winner, loser } = useMemo(() => {
        return {
            winner: matchup.team1.points > matchup.team2.points ? matchup.team1 : matchup.team2,
            loser: matchup.team1.points < matchup.team2.points ? matchup.team1 : matchup.team2,
        };
    }, [matchup]);

    const topScoringPlayers = useMemo(() => {
        return winner.players
            .filter(p => p.isStarter)
            .sort((a, b) => (b.stats?.points ?? 0) - (a.stats?.points ?? 0))
            .slice(0, 2);
    }, [winner]);

    const lowestScoringPlayers = useMemo(() => {
        return loser.players
            .filter(p => p.isStarter)
            .sort((a, b) => (a.stats?.points ?? 0) - (b.stats?.points ?? 0))
            .slice(0, 2);
    }, [loser]);

    const [ref, isInView] = useInView({
        rootMargin: '-10% 0px -10% 0px',
    });

    const headlineRef = useSpringRef();
    const headlineStyles = useSpring({
        ref: headlineRef,
        from: { scale: 0 },
        to: { scale: isInView ? 1 : 0 },
        config: {
            tension: 300,
        },
    });

    const scoringPlayersRef = useSpringRef();
    const scoringPlayersStyles = useSpring({
        ref: scoringPlayersRef,
        from: { scale: 0 },
        to: { scale: isInView ? 1 : 0 },
        config: {
            tension: 250,
        },
    });

    const winnerCheckmarkRef = useSpringRef();
    const winnerCheckmarkStyles = useSpring({
        ref: winnerCheckmarkRef,
        from: { scale: 0 },
        to: { scale: isInView ? 1 : 0 },
        config: {
            tension: 250,
        },
    });

    useChain(isInView ? [headlineRef, scoringPlayersRef, winnerCheckmarkRef] : [], [0, 0.2, 0.8]);

    return (
        <div className="flex h-full w-full flex-col items-center justify-start p-4 relative">
            {/* <div className="w-full text-center text-3xl md:text-4xl lg:text-5xl mb-4 bg-linear-to-r from-cyan-500 to-indigo-400 text-transparent bg-clip-text">
                {award.award.title}
            </div> */}
            {/* Headline with the team names */}
            <animated.div
                ref={ref}
                style={headlineStyles}
                className="flex w-full flex-row justify-between items-center p-3 rounded-md gap-4 mb-4 text-3xl md:text-4xl lg:text-5xl bg-linear-to-l from-indigo-400/75 to-indigo-600/95 text-white relative"
            >
                <div className="flex flex-col items-center justify-center p-2 rounded-md bg-slate-900/44 h-full relative">
                    <animated.div
                        style={winnerCheckmarkStyles}
                        className="absolute top-[-6px] right-[-12px] text-emerald-500 text-4xl w-6 h-6 flex items-center justify-center rounded-full p-0 bg-white/95"
                    >
                        <AiFillCheckCircle />
                    </animated.div>
                    <div className="text-xl md:text-2xl lg:text-3xl text-center text-indigo-200">
                        {winner.name}
                    </div>
                    <div className="text-5xl md:text-5xl lg:text-6xl mb-2">
                        {numberFormatter.format(winner.points)}
                    </div>
                    {winner.standings?.rank && <RankDisplay rank={winner.standings.rank} />}
                    {winner.standings?.streak && <StreakDisplay streak={winner.standings.streak} />}
                </div>
                <div>
                    <img src="/football-h2h.png" className="w-14 object-cover" />
                </div>
                <div className="flex flex-col items-center justify-center p-2 rounded-md bg-slate-900/44 h-full">
                    <div className="text-xl md:text-2xl lg:text-3xl text-center text-indigo-200">
                        {loser.name}
                    </div>
                    <div className="text-5xl md:text-5xl lg:text-6xl mb-2">
                        {numberFormatter.format(loser.points)}
                    </div>
                    {loser.standings?.rank && <RankDisplay rank={loser.standings.rank} />}
                    {loser.standings?.streak && <StreakDisplay streak={loser.standings.streak} />}
                </div>
            </animated.div>

            {/* Scoring players  */}
            <animated.div
                style={scoringPlayersStyles}
                className="flex flex-col items-center justify-start rounded-md p-3 bg-slate-600/75 text-white w-full"
            >
                {/* <div className="w-full text-center text-3xl mb-1 bg-linear-to-b from-cyan-500 to-indigo-400 text-transparent bg-clip-text">
                    Matchup Highlights
                </div> */}

                <div className="w-full text-left mb-4 text-base font-artlab-regular">
                    <Markdown>{award.award.blurb}</Markdown>
                </div>

                <div className="flex flex-row items-center justify-start w-full text-left">
                    <span className="text-xl text-indigo-400 mr-6">
                        {winner.name}&apos;s <span className="text-gray-100/95">MVPs</span>&nbsp;⭐
                    </span>
                </div>
                {topScoringPlayers.map(player => (
                    <div
                        key={player.playerId}
                        className="flex flex-row items-end justify-between w-full text-left font-artlab-medium"
                    >
                        <span className="text-base">{player.name}</span>
                        <span className="text-2xl text-emerald-500 font-sink">
                            {numberFormatter.format(player.stats?.points ?? 0)}
                        </span>
                    </div>
                ))}

                <div className="flex flex-row items-end justify-start w-full text-left mt-6">
                    <span className="text-xl text-indigo-400 mr-6">
                        {loser.name}&apos;s <span className="text-gray-100/95">Poopy Pants</span>
                        &nbsp;💩
                    </span>
                </div>
                {lowestScoringPlayers.map(player => (
                    <div
                        key={player.playerId}
                        className="flex flex-row items-baseline justify-between w-full text-left font-artlab-medium"
                    >
                        <span className="text-base">{player.name}</span>
                        <span className="text-2xl text-red-300 font-sink">
                            {numberFormatter.format(player.stats?.points ?? 0)}
                        </span>
                    </div>
                ))}

                {award.award.funFacts && (
                    <div className="w-full text-left mb-4 text-base font-artlab-regular">
                        <div className="text-xl text-indigo-400 mb-2">Fun Facts 🎲</div>
                        <Markdown>{award.award.funFacts}</Markdown>
                    </div>
                )}
            </animated.div>
        </div>
    );
};

export function StreakDisplay({ streak }: { streak: { type: string; value: number } }) {
    const isWinStreak = streak.type.toLocaleLowerCase() === 'win';
    const streakValue = Math.abs(streak.value);

    // Determine color intensity based on streak value
    const colorClass = useMemo(() => {
        if (isWinStreak) {
            if (streakValue >= 6) return 'text-emerald-500';
            if (streakValue >= 4) return 'text-emerald-400';
            if (streakValue >= 2) return 'text-emerald-300';
            return 'text-emerald-200';
        } else {
            if (streakValue >= 6) return 'text-rose-500';
            if (streakValue >= 4) return 'text-rose-400';
            if (streakValue >= 2) return 'text-rose-300';
            return 'text-rose-200';
        }
    }, [isWinStreak, streakValue]);

    return (
        <div className="flex flex-row items-center justify-between gap-1 text-base text-indigo-200 w-full">
            Streak:
            <div className="flex flex-row items-center justify-end gap-1">
                {isWinStreak ? (
                    <AiOutlineCaretUp className={colorClass} />
                ) : (
                    <AiOutlineCaretDown className={colorClass} />
                )}
                <span className={`text-base md:text-2xl lg:text-3xl font-bold ${colorClass}`}>
                    {streakValue}
                </span>
            </div>
        </div>
    );
}

export function RankDisplay({ rank }: { rank: number }) {
    const TOTAL_TEAMS = 12;

    // Determine emoji based on rank
    const emoji = useMemo(() => {
        if (rank === 1) return '🥇';
        if (rank === 2) return '🥈';
        if (rank === 3) return '🥉';
        if (rank < TOTAL_TEAMS && rank > 8) return '💩';
        if (rank === TOTAL_TEAMS) return '🚽';
        return '';
    }, [rank]);

    // Determine color based on rank
    const colorClass = useMemo(() => {
        if (rank === 1) return 'text-yellow-400';
        if (rank === 2) return 'text-gray-300';
        if (rank === 3) return 'text-amber-600';
        if (rank === TOTAL_TEAMS) return 'text-rose-400';
        if (rank <= 4) return 'text-emerald-400';
        if (rank <= 8) return 'text-indigo-300';
        return 'text-slate-400';
    }, [rank]);

    return (
        <div className="flex flex-row items-center justify-between gap-1 text-base text-indigo-200 w-full">
            Rank:&nbsp;
            <div className="flex flex-row items-center justify-end gap-1">
                {emoji && <span className="text-xl">{emoji}</span>}
                <span className={`text-base md:text-2xl lg:text-3xl font-bold ${colorClass}`}>
                    {rank}
                </span>
            </div>
        </div>
    );
}
