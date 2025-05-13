import React from 'react';
import { useQuery } from '@tanstack/react-query';
import type { TransformedStandings } from '../../server/data-mappers';
import './league-overview.css';

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
        <div className="league-overview">
            <h2>League Standings - {standings?.leagueName}</h2>
            <table className="standings-table">
                <thead>
                    <tr>
                        <th>&nbsp;</th>
                        <th>Rank</th>
                        <th>Team</th>
                        <th>W</th>
                        <th>L</th>
                        <th>Points For</th>
                        <th>Points Against</th>
                        <th>Current Streak</th>
                    </tr>
                </thead>
                <tbody>
                    {standings?.teams.map(team => (
                        <tr key={team.teamId}>
                            <td>
                                <img src={team.logoUrl} height="36" className="logo" />
                            </td>
                            <td>{team.rank}</td>
                            <td>{team.name}</td>
                            <td>{team.wins}</td>
                            <td>{team.losses}</td>
                            <td>{team.pointsFor}</td>
                            <td>{team.pointsAgainst}</td>
                            <td>
                                {team.streak.type} {team.streak.value}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
