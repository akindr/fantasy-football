// Shows the image and the score details
import React from 'react';
import { Award } from '../../../../functions/src/server/types';

export const MatchupOverview = ({ award }: { award: Award }) => {
    return (
        <>
            <img
                src={award.award.imageURL}
                className="w-full h-full object-contain mask-alpha mask-r-from-black mask-r-from-50% mask-r-to-transparent"
            />
            <div className="absolute left-0 bottom-[200px] clip-polygon flex flex-col items-start bg-linear-45 from-indigo-500 from-25% to-indigo-700 to-90% pr-[100px] shadow-lg pt-6 pb-4 pl-8 max-w-[75vw] border-b-24 border-indigo-400">
                <div className="text-6xl text-slate-100 mb-4">{award.award.title}</div>
                <div className="text-3xl text-slate-300">{award.award.description}</div>
            </div>
        </>
    );
};

export const MatchupDetails = ({ award }: { award: Award }) => {
    const { matchup } = award;
    return (
        <div className="flex flex-row text-xl items-center justify-center gap-5 py-6 px-8">
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
