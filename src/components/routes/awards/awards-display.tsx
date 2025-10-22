import React from 'react';
import type { Award } from '../../../../functions/src/server/types';
import { MatchupOverview } from './matchup-overview';
import { MatchupPlayers } from './awards';
import Markdown from 'react-markdown';

export const AwardsDisplay = ({ award }: { award: Award }) => {
    const { award: awardData } = award;

    return (
        <>
            <div className="h-full w-full relative snap-start bg-linear-to-b bg-black text-white overflow-y-auto">
                <MatchupOverview award={award} />
            </div>
            <div className="h-full w-full p-4 snap-start bg-linear-to-b from-black to-indigo-500/66 overflow-y-auto text-white">
                <h1 className="text-4xl mb-4 font-bold bg-linear-to-r from-indigo-500 to-cyan-500 bg-clip-text text-transparent">
                    {awardData.title}
                </h1>
                <p className="text-2xl mb-10">{awardData.description}</p>
                {/* TODO: Can we share this  */}
                <Markdown
                    components={{
                        strong: props => (
                            <strong className="font-bold text-indigo-400" {...props} />
                        ),
                        ul: props => (
                            <ul className="list-disc list-inside text-gray-400 mb-8" {...props} />
                        ),
                        ol: props => <ol className="mt-4" {...props} />,
                        li: props => <li className="mb-1" {...props} />,
                        p: props => <p className="text-lg" {...props} />,
                    }}
                >
                    {awardData.matchupHighlights}
                </Markdown>
            </div>
            <div className="h-full w-full p-4 snap-start bg-linear-to-b from-indigo-500/66 to-cyan-500/66 overflow-y-auto">
                <MatchupPlayers matchup={award.matchup} />
            </div>
        </>
    );
};
