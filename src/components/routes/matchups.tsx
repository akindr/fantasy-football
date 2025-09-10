import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

type MatchupResponse = {
    imageData: string;
    mimeType: string;
    teamAID: string;
    teamBID: string;
};

export const Matchups: React.FC = () => {
    const [week, setWeek] = useState<number | undefined>(undefined);

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

    const handleWeekChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setWeek(Number(e.target.value));
    };

    return (
        <div className="p-4">
            <div className="flex justify-between items-center">
                <h2>League Matchups</h2>
                {/* TODO: add weeks */}
                <select value={week} onChange={handleWeekChange}>
                    <option value={''}>Choose a week</option>
                    <option value={1}>Week 1</option>
                    <option value={2}>Week 2</option>
                    <option value={3}>Week 3</option>
                    <option value={4}>Week 4</option>
                    <option value={5}>Week 5</option>
                </select>
            </div>
            {isLoading && <div>Loading matchups...</div>}
            {error && <div>Error loading matchups: {error.message}</div>}
            {matchups && <MatchupsTable matchups={matchups as MatchupResponse[]} />}
        </div>
    );
};

const MatchupsTable = ({ matchups }: { matchups: MatchupResponse[] }) => {
    return matchups.map(matchup => {
        if (!matchup?.imageData) {
            return null;
        }
        return (
            <div key={matchup.teamAID} className="mb-4 p-2">
                <img
                    src={`data:${matchup.mimeType};base64,${matchup.imageData}`}
                    className="w-full h-auto"
                />
            </div>
        );
    });
};
