import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { TransformedMatchup } from '../../../server/data-mappers';

type MatchupResponse = {
    imageData: string;
    mimeType: string;
} & TransformedMatchup;

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
        <div className="flex flex-col h-full">
            <div className="flex justify-between items-center flex-0 p-4">
                <h2>League Matchups</h2>
                {/* TODO: add weeks */}
                <select value={week} onChange={handleWeekChange}>
                    <option value={''}>Choose a week</option>
                    <option value={1}>Week 1</option>
                    {/* <option value={2}>Week 2</option>
                    <option value={3}>Week 3</option>
                    <option value={4}>Week 4</option>
                    <option value={5}>Week 5</option>    */}
                </select>
            </div>
            {isLoading && <div>Loading matchups...</div>}
            {error && <div>Error loading matchups: {error.message}</div>}
            {matchups && <MatchupsTable matchups={matchups as MatchupResponse[]} />}
        </div>
    );
};

const MatchupsTable = ({ matchups }: { matchups: MatchupResponse[] }) => {
    const [shownMatchup, setShownMatchup] = useState<number>(0);
    const matchup = matchups[shownMatchup];

    return (
        <div
            key={matchup.id}
            className="flex-1 h-full w-full relative bg-black font-sink overflow-y-auto snap-y snap-mandatory"
        >
            <div className="absolute bottom-4 left-0 right-0 flex flex-col items-center">
                <MatchupDetails matchup={matchup} />
            </div>
            <div
                className="absolute top-1/2 left-0 bg-white/50 cursor-pointer p-3 rounded-r-full text-5xl"
                onClick={() => setShownMatchup(Math.max(0, shownMatchup - 1))}
            >
                ‹
            </div>
            <div
                className="absolute top-1/2 right-0 bg-white/50 cursor-pointer p-3 rounded-l-full text-5xl"
                onClick={() => setShownMatchup(Math.min(matchups.length - 1, shownMatchup + 1))}
            >
                ›
            </div>
            <MatchupImage matchup={matchup} />
            <MatchupPlayers matchup={matchup} />
        </div>
    );
};

const MatchupImage = ({ matchup }: { matchup: MatchupResponse }) => {
    return (
        <div className="flex flex-col items-center h-full w-full snap-start">
            <img
                src={`data:${matchup.mimeType};base64,${matchup.imageData}`}
                className="h-full object-cover object-center"
            />
        </div>
    );
};

const MatchupDetails = ({ matchup }: { matchup: MatchupResponse }) => {
    return (
        <div className="flex flex-row text-xl items-center justify-center gap-5 p-4 bg-white/45 rounded-4xl">
            <div className="flex flex-col items-center">
                <img src={matchup.team1.logo} className="w-15 h-15 rounded-full" />
                <span>{matchup.team1.name}</span>
                <span className="text-6xl">{matchup.team1.points}</span>
            </div>
            <span className="text-4xl font-think-loved text-transparent bg-linear-45 from-cyan-600 to-violet-700 bg-clip-text">
                VS
            </span>
            <div className="flex flex-col items-center">
                <img src={matchup.team2.logo} className="w-15 h-15 rounded-full" />
                <span>{matchup.team2.name}</span>
                <span className="text-6xl">{matchup.team2.points}</span>
            </div>
        </div>
    );
};

const MatchupPlayers = ({ matchup }: { matchup: MatchupResponse }) => {
    return (
        <div className="flex flex-row justify-between items-center h-full w-full p-4 snap-start bg-indigo-500/66">
            <span className="text-2xl font-think-loved">{matchup.team1.name}</span>
            <div className="flex flex-row items-center justify-center gap-2">
                <img src={matchup.team1.logo} className="w-15 h-15 rounded-full" />
                <span className="text-xl">{matchup.team1.name}</span>
            </div>
            <span className="text-2xl font-think-loved">{matchup.team2.name}</span>
            <div className="flex flex-row items-center justify-center gap-2">
                <img src={matchup.team2.logo} className="w-15 h-15 rounded-full" />
                <span className="text-xl">{matchup.team2.name}</span>
            </div>
        </div>
    );
};
