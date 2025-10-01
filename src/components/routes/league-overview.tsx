import React from 'react';
import { useQuery } from '@tanstack/react-query';
// todo, uh? is this ok from the server data mappers?
import type { TransformedStandings } from '../../../functions/src/server/data-mappers';

export const LeagueOverview: React.FC = () => {
    const {
        data: standings,
        isLoading,
        error,
    } = useQuery<TransformedStandings>({
        queryKey: ['standings'],
    });

    if (isLoading) {
        return <div>Loading standings...</div>;
    }

    if (error) {
        return <div>Error loading standings: {error.message}</div>;
    }

    return (
        <div className="p-4">
            <table className="table table-auto">
                <thead>
                    <tr>
                        <th className="px-4 py-3 min-w-18">&nbsp;</th>
                        <th className="px-4 py-3">Rank</th>
                        <th className="px-4 py-3">Team</th>
                        <th className="px-4 py-3">W</th>
                        <th className="px-4 py-3">L</th>
                        <th className="px-4 py-3">Points For</th>
                        <th className="px-4 py-3">Points Against</th>
                        <th className="px-4 py-3">Current Streak</th>
                    </tr>
                </thead>
                <tbody>
                    {standings?.teams.map(team => (
                        <tr key={team.teamId} className="mb-2">
                            <td className="px-4 py-3 w-18">
                                <img
                                    src={team.logoUrl}
                                    className="w-18 object-cover object-center rounded-full"
                                />
                            </td>
                            <td className="px-4 py-3">{team.rank}</td>
                            <td className="px-4 py-3">{team.name}</td>
                            <td className="px-4 py-3">{team.wins}</td>
                            <td className="px-4 py-3">{team.losses}</td>
                            <td className="px-4 py-3">{team.pointsFor}</td>
                            <td className="px-4 py-3">{team.pointsAgainst}</td>
                            <td className="px-4 py-3">
                                {team.streak.type} {team.streak.value}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
