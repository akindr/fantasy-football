import React, { useMemo } from 'react';
import { animated, useInView, useSpring } from '@react-spring/web';
import { useQuery } from '@tanstack/react-query';
import Markdown from 'react-markdown';

import type { GossipCornerData } from '../../../../functions/src/server/types';

type FigsGossipCornerProps = {
    week: number;
};

type GossipPrediction = GossipCornerData['predictions'][number];

const CATCH_PHRASES = [
    'OMG!',
    'You guys!!',
    'Spill the kibble!',
    'NO TAIL!',
    'Paws up, people!',
    'Just in!',
    'Sniffed it out!',
    'Wiggle wiggle!!',
    'BUTT SNIFF`D!',
    'Bark, bark, bark!',
    'Trust the floof!',
    'Nuh-uh!',
    'Zoomies activated!',
    'Low rider knows!',
    'Heard that!',
    'Hot dog!',
    'Must sniff-TV!',
    'The drama!',
    'OH HECK!',
    'Blep!',
];

const PredictionSlide: React.FC<{
    prediction: GossipPrediction;
    index: number;
    week: number;
}> = ({ prediction, index }) => {
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

    const phrase = useMemo(() => {
        return CATCH_PHRASES[Math.floor(Math.random() * CATCH_PHRASES.length)];
    }, []);

    return (
        <div className="h-full w-full relative snap-start bg-black text-white overflow-hidden">
            <img
                src={prediction.imageURL}
                className="w-full h-full object-cover mask-alpha mask-r-from-black mask-r-from-50% mask-r-to-transparent"
                alt={`Fig's Gossip Corner (${index + 1})`}
            />
            <animated.div
                style={styles}
                ref={ref}
                className="absolute left-0 bottom-12 lg:bottom-[120px] clip-polygon flex flex-col items-start bg-linear-45 from-cyan-500 from-25% to-cyan-700 to-90% 
            pr-6 pb-4 pt-6 pl-4 lg:pr-[100px] lg:py-6 lg:pl-8 max-w-[90vw] border-b-12 lg:border-b-24 border-cyan-400 gap-3"
            >
                <div className="text-5xl lg:text-6xl  text-slate-100 uppercase tracking-wider">
                    {phrase}
                </div>
                <div className="text-xl lg:text-2xl text-slate-100 font-artlab-regular leading-relaxed markdown-content pr-6">
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
                        {prediction.text}
                    </Markdown>
                </div>
            </animated.div>
        </div>
    );
};

const IntroSlide: React.FC<{ subtitle: string }> = ({ subtitle }) => {
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
        <div className="h-full w-full snap-start overflow-hidden bg-[url(/figs-gossip-corner.png)] bg-cover bg-center bg-no-repeat relative">
            <animated.div
                style={styles}
                ref={ref}
                className="absolute left-0 bottom-12 lg:bottom-[120px] clip-polygon flex flex-col items-start bg-linear-45 from-teal-500 from-25% to-indigo-500 to-90% 
            pr-12 pb-2 pt-4 pl-2 lg:pr-[100px] lg:py-6 lg:pl-8 max-w-[90vw] border-b-12 lg:border-b-24 border-teal-400 gap-2"
            >
                <div className="text-6xl lg:text-8xl text-slate-100 mb-1 lg:mb-4">
                    FIG&apos;S GOSSIP CORNER
                </div>
                <div className="text-2xl lg:text-4xl text-slate-300 font-artlab-medium max-w-3xl leading-snug">
                    {subtitle}
                </div>
            </animated.div>
        </div>
    );
};

export const FigsGossipCorner: React.FC<FigsGossipCornerProps> = ({ week }) => {
    const { data, isLoading, isError } = useQuery<{ gossip: GossipCornerData | null }>({
        queryKey: ['figs-gossip-corner', week],
        refetchOnWindowFocus: false,
        enabled: () => Boolean(week),
    });

    const slides = useMemo(() => {
        if (!data?.gossip) {
            return [
                <IntroSlide
                    key="intro"
                    subtitle="We couldn’t load this week’s gossip. Try again soon!"
                />,
            ];
        }

        return [
            <IntroSlide key="intro" subtitle={data.gossip.subtitle} />,
            ...data.gossip.predictions.map((prediction, index) => (
                <PredictionSlide
                    key={`prediction-${index}`}
                    prediction={prediction}
                    index={index}
                    week={week}
                />
            )),
        ];
    }, [data]);

    if (isLoading) {
        return <IntroSlide subtitle="Fetching the latest rumors from Fig..." />;
    }

    if (isError) {
        return <IntroSlide subtitle="We couldn’t load this week’s gossip. Try again soon!" />;
    }

    return <>{slides}</>;
};
