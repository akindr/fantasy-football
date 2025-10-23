import React from 'react';
import { animated, useInView, useSpring } from '@react-spring/web';

export const FigsGossipCorner: React.FC = () => {
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
        <div className="h-full w-full snap-start overflow-y-auto bg-[url(/figs-gossip-corner.png)] bg-cover bg-center bg-no-repeat relative">
            <animated.div
                style={styles}
                ref={ref}
                className="absolute left-0 bottom-12 lg:bottom-[120px] clip-polygon flex flex-col items-start bg-linear-45 from-teal-500 from-25% to-indigo-500 to-90% 
            pr-8 pb-2 pt-4 pl-2 lg:pr-[100px] lg:py-6 lg:pl-8 max-w-[90vw] border-b-12 lg:border-b-24 border-teal-400"
            >
                <div className="text-6xl lg:text-8xl text-slate-100 mb-1 lg:mb-4">
                    FIG&apos;S GOSSIP CORNER
                </div>
                <div className="text-4xl lg:text-6xl text-slate-300 font-artlab-medium">
                    COMING SOON...
                </div>
            </animated.div>
        </div>
    );
};
