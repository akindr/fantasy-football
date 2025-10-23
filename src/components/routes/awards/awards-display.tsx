import React from 'react';
import type { Award } from '../../../../functions/src/server/types';
import { MatchupOverview } from './matchup-overview';
import { MatchupPlayers } from './awards';
import { MatchupDetails } from './matchup-details';

export const AwardsDisplay = ({ award }: { award: Award }) => {
    return (
        <>
            <div className="h-full w-full relative snap-start bg-linear-to-b bg-black text-white overflow-y-auto">
                <MatchupOverview award={award} />
            </div>
            <div
                className="h-full w-full snap-start overflow-y-auto text-white relative"
                style={{
                    backgroundImage: `linear-gradient(to bottom, rgba(0, 0, 0, 1), rgba(0, 0, 0, 0.75) 30%, rgba(71, 85, 105, 0.75) 70%, rgba(71, 85, 105, 1)), url(${award.award.imageURL})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                }}
            >
                <MatchupDetails award={award} />
            </div>
            <div className="h-full w-full p-4 snap-start bg-linear-to-b from-slate-600 through-slate-500 to-black overflow-y-auto">
                <MatchupPlayers matchup={award.matchup} />
            </div>
        </>
    );
};
