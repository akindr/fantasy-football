import React from 'react';
import { animated, useInView, useSpring } from '@react-spring/web';
import { useQuery } from '@tanstack/react-query';
import Markdown from 'react-markdown';

import type { MedleysStinkerData } from '../../../../functions/src/server/types';

const INTRO_IMAGE_URL =
    'https://storage.googleapis.com/get-schwifty-football.firebasestorage.app/award-images/Gemini_Generated_Image_9kh2y09kh2y09kh2.jpeg';

type MedleysStinkerProps = {
    week: number;
};

const LandmineSlide: React.FC<{ stinker: MedleysStinkerData }> = ({ stinker }) => {
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
        <div className="relative h-full w-full snap-start bg-black text-white overflow-hidden">
            <div className="absolute inset-0 lg:static lg:h-full">
                <div className="relative h-5/7 w-full min-h-[220px] lg:h-full lg:min-h-0">
                    <img
                        src={stinker.imageURL}
                        className="h-full w-full object-cover lg:mask-alpha lg:mask-r-from-black lg:mask-r-from-50% lg:mask-r-to-transparent"
                        alt={`Medley's Weekly Landmine: ${stinker.playerName}`}
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/40 to-black lg:hidden" />
                </div>
            </div>
            <animated.div
                style={styles}
                ref={ref}
                className="absolute left-0 bottom-12 lg:bottom-[120px] clip-polygon flex flex-col items-start bg-linear-45 from-amber-800 from-25% to-amber-950 to-90% 
            pr-6 pb-4 pt-6 pl-4 lg:pr-[100px] lg:py-6 lg:pl-8 max-w-[90vw] border-b-12 lg:border-b-24 border-amber-700 gap-3"
            >
                <div className="text-5xl lg:text-6xl text-slate-100 uppercase tracking-wider">
                    {stinker.playerName}
                </div>
                <div className="text-base lg:text-2xl text-slate-100 font-artlab-regular leading-relaxed markdown-content pr-6">
                    <Markdown
                        components={{
                            p: props => <p className="mb-2 lg:mb-3 last:mb-0" {...props} />,
                            ul: props => (
                                <ul className="list-disc list-inside mb-2 lg:mb-3" {...props} />
                            ),
                            ol: props => (
                                <ol className="list-decimal list-inside mb-2 lg:mb-3" {...props} />
                            ),
                            li: props => <li className="mb-1" {...props} />,
                        }}
                    >
                        {stinker.description}
                    </Markdown>
                </div>
            </animated.div>
        </div>
    );
};

const IntroSlide: React.FC = () => {
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
        <div
            className="h-full w-full snap-start overflow-hidden bg-stone-950 bg-cover bg-center bg-no-repeat relative"
            style={{ backgroundImage: `url(${INTRO_IMAGE_URL})` }}
        >
            <animated.div
                style={styles}
                ref={ref}
                className="absolute left-0 bottom-12 lg:bottom-[120px] clip-polygon flex flex-col items-start bg-linear-45 from-amber-800 from-25% to-amber-950 to-90% 
            pr-12 pb-2 pt-4 pl-2 lg:pr-[100px] lg:py-6 lg:pl-8 max-w-[90vw] border-b-12 lg:border-b-24 border-amber-700 gap-2"
            >
                <div className="text-6xl lg:text-8xl text-slate-100 mb-1 lg:mb-4">
                    MEDLEY&apos;S WEEKLY LANDMINE
                </div>
            </animated.div>
        </div>
    );
};

export const MedleysStinker: React.FC<MedleysStinkerProps> = ({ week }) => {
    const { data } = useQuery<{ stinker: MedleysStinkerData | null }>({
        queryKey: ['medleys-stinker', { week }],
        refetchOnWindowFocus: false,
        enabled: () => Boolean(week),
    });

    // Nothing to show until a stinker has been saved for this week
    if (!data?.stinker) {
        return null;
    }

    return (
        <>
            <IntroSlide />
            <LandmineSlide stinker={data.stinker} />
        </>
    );
};
