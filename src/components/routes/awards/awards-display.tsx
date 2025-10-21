import React from 'react';
import type { Award } from '../../../../functions/src/server/types';
import { MatchupOverview } from './matchup-overview';
import { MatchupPlayers } from './awards';

export const AwardsDisplay = ({ award }: { award: Award }) => {
    const { award: awardData } = award;

    return (
        <>
            <div className="h-full w-full relative snap-start bg-linear-to-b bg-black text-white overflow-y-auto">
                <MatchupOverview award={award} />
            </div>
            <div className="h-full w-full p-4 snap-start bg-linear-to-b from-black to-indigo-500/66 overflow-y-auto">
                <h1>{awardData.title}</h1>
                <p>{awardData.description}</p>
            </div>
            <div className="h-full w-full p-4 snap-start bg-linear-to-b from-indigo-500/66 to-cyan-500/66 overflow-y-auto">
                <MatchupPlayers matchup={award.matchup} />
            </div>
        </>
    );
};
