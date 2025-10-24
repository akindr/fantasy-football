import React from 'react';
import { useInView, useSpring, animated } from '@react-spring/web';
import { AiFillCheckCircle } from 'react-icons/ai';
import { TeamInfo, TransformedPlayer } from '../../../../functions/src/server/data-mappers';
import { numberFormatter } from '../../../utils/number-utils';
import { RankDisplay, StreakDisplay } from './matchup-details';

interface TeamScoreboardProps {
    team: TeamInfo;
    isWinner: boolean;
    highlightPlayers?: TransformedPlayer[];
}

export const TeamScoreboard = ({ team, isWinner, highlightPlayers = [] }: TeamScoreboardProps) => {
    const [ref, isInView] = useInView({
        rootMargin: '-10% 0px -10% 0px',
    });

    const winnerCheckmarkStyles = useSpring({
        from: { scale: 0 },
        to:
            isInView && isWinner
                ? async next => {
                      await next({ scale: 1, config: { tension: 300, friction: 12 } });
                  }
                : { scale: 0 },
    });

    return (
        <div
            ref={ref}
            className="flex flex-col flex-initial flex-grow  items-center justify-center lg:justify-start p-2 lg:p-4 rounded-md bg-slate-900/44 lg:bg-indigo-700/80 h-full relative"
        >
            {isWinner && (
                <animated.div
                    style={winnerCheckmarkStyles}
                    className="absolute top-[-6px] right-[-12px] text-emerald-500 text-4xl w-6 h-6 flex items-center justify-center rounded-full p-0 bg-white/95"
                >
                    <AiFillCheckCircle />
                </animated.div>
            )}
            <div className="hidden lg:block mb-2">
                <img src={team.logo} className="w-14 h-14 object-cover rounded-full" />
            </div>
            <div className="text-xl md:text-2xl lg:text-3xl text-center text-indigo-200">
                {team.name}
            </div>
            <div className="text-5xl md:text-5xl lg:text-6xl mb-2 md:mb-0">
                {numberFormatter.format(team.points)}
            </div>
            <div className="hidden md:block text-indigo-200/66 text-2xl">
                {numberFormatter.format(team.pointsProjected)}{' '}
                <span className="text-base">(proj)</span>
            </div>

            <div className="hidden md:block text-indigo-200/66 text-2xl">
                {team.standings?.wins} - {team.standings?.losses}
            </div>
            {team.standings?.rank && <RankDisplay rank={team.standings.rank} />}
            {team.standings?.streak && <StreakDisplay streak={team.standings.streak} />}
            {team.players.length > 0 && (
                <div className="hidden lg:flex flex-col items-center justify-start p-3 text-2xl w-full bg-slate-900/44 rounded-md">
                    <div className="text-gray-100/96 text-2xl mb-2">
                        {isWinner ? 'The Winning Lineup' : 'The Smelly Stinkers'}
                    </div>
                    {team.players
                        .filter(p => p.isStarter)
                        .map(player => (
                            <div
                                key={player.playerId}
                                className="flex flex-row items-start justify-between w-full text-left font-artlab-medium"
                            >
                                <div className="text-base text-indigo-200/66 w-14 flex-shrink-0 flex-initial">
                                    {player.selectedPosition}
                                </div>
                                <div className="text-base flex-grow">
                                    {player.name}
                                    {highlightPlayers.includes(player)
                                        ? isWinner
                                            ? ' ⭐'
                                            : ' 💩'
                                        : ''}
                                </div>
                                <div className="text-2xl text-emerald-500 font-sink flex-initial w-20 text-right">
                                    {numberFormatter.format(player.stats?.points ?? 0)}
                                </div>
                            </div>
                        ))}
                </div>
            )}
        </div>
    );
};
