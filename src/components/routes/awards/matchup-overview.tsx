// Shows the image and the score details
import React from 'react';
import { useInView, useSpring, animated } from '@react-spring/web';

import { Award } from '../../../../functions/src/server/types';
import { numberFormatter } from '../../../utils/number-utils';

export const MatchupOverview = ({ award }: { award: Award }) => {
    const [ref, isInView] = useInView({
        rootMargin: '-10% 0px -10% 0px',
    });

    const styles = useSpring({
        scale: isInView ? 1 : 0,
        config: {
            tension: 300,
        },
        enter: {
            scale: 0,
        },
    });

    return (
        <>
            <img
                src={award.award.imageURL}
                className="w-full h-3/4 object-cover mask-alpha mask-r-from-black mask-r-from-50% mask-r-to-transparent"
            />
            <animated.div
                style={styles}
                ref={ref}
                className="absolute left-0 bottom-12 lg:bottom-[120px] clip-polygon flex flex-col items-start bg-linear-45 from-indigo-500 from-25% to-indigo-700 to-90% 
            pr-8 pb-4 pt-6 pl-3 lg:pr-[100px] lg:py-6 lg:pl-8 max-w-[90vw] border-b-12 lg:border-b-24 border-indigo-400"
            >
                <div className="text-5xl lg:text-6xl text-slate-100 mb-1 lg:mb-4 uppercase">
                    {award.award.title}
                </div>
                <div className="text-xl lg:text-2xl text-slate-300 font-artlab-medium">
                    {award.award.description}
                </div>
            </animated.div>
        </>
    );
};

export const MatchupDetails = ({ award }: { award: Award }) => {
    const { matchup } = award;
    return (
        <div className="flex flex-row text-xl items-center justify-center gap-5 py-2 px-4lg:py-6 lg:px-8">
            <div className="flex flex-col items-center">
                <img src={matchup.team1.logo} className="w-15 h-15 rounded-full" />
                <span>{matchup.team1.name}</span>
                <span className="text-6xl">{numberFormatter.format(matchup.team1.points)}</span>
            </div>
            <span className="text-4xl font-think-loved text-transparent bg-linear-45 from-cyan-600 to-violet-700 bg-clip-text">
                VS
            </span>
            <div className="flex flex-col items-center">
                <img src={matchup.team2.logo} className="w-15 h-15 rounded-full" />
                <span>{matchup.team2.name}</span>
                <span className="text-6xl">{numberFormatter.format(matchup.team2.points)}</span>
            </div>
        </div>
    );
};
