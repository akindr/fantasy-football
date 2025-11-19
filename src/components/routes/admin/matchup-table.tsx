import React from 'react';
import type { TransformedMatchup, TeamInfo } from '../../../../functions/src/server/data-mappers';
import { numberFormatter } from '../../../utils/number-utils';
import { RankDisplay } from '../awards/matchup-details';
import { StreakDisplay } from '../awards/matchup-details';

const TeamDisplay = ({ team }: { team: TeamInfo }) => {
    return (
        <div className="bg-gray-300/40 rounded-md p-2 flex flex-col gap-1">
            {/* Header: Team logo + name */}
            <div className="flex flex-col items-center gap-2">
                <img src={team.logo} className="w-12 h-12 rounded-full" />
                <span className="text-xl text-center">{team.name}</span>
            </div>
            {/* Total points */}
            <div className="flex flex-col items-center justify-center">
                <span className="text-3xl font-semibold">
                    {numberFormatter.format(team.points)}
                </span>
                <span className="text-gray-300">
                    {numberFormatter.format(team.pointsProjected)} Projected
                </span>
                <span className="text-gray-100 font-bold text-lg">
                    {team.standings?.wins} - {team.standings?.losses}
                </span>
            </div>
            {team.standings?.rank && <RankDisplay rank={team.standings.rank} />}
            {team.standings?.streak && <StreakDisplay streak={team.standings.streak} />}
            {/* Players list */}
            <div className="flex flex-col divide-y divide-white/50">
                {team.players?.map(player => {
                    const points =
                        player.stats?.points != null
                            ? numberFormatter.format(player.stats.points)
                            : '-';
                    return (
                        <div key={player.playerId} className="py-2">
                            <div className="grid grid-cols-[1rem_1fr_auto] items-center gap-3">
                                <span className="text-sm font-medium tabular-nums text-gray-800">
                                    {player.selectedPosition || player.position}
                                </span>
                                <span className="text-sm text-gray-200 truncate">
                                    {player.name}
                                </span>
                                <span className="text-sm font-semibold text-right tabular-nums">
                                    {points}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export const MatchupPlayers = ({ matchup }: { matchup: TransformedMatchup }) => {
    return (
        <div className="h-full w-full snap-start overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <TeamDisplay team={matchup.team1} />
                <TeamDisplay team={matchup.team2} />
            </div>
        </div>
    );
};
