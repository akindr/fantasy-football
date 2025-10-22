import React from 'react';
import { useTransition, animated } from '@react-spring/web';

interface LoadingSpinnerProps {
    isLoading: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ isLoading }) => {
    const transition = useTransition(isLoading, {
        from: { opacity: 0 },
        enter: { opacity: 1 },
        leave: { opacity: 0 },
        config: { duration: 300 },
    });

    return transition(
        (style, item) =>
            item && (
                <animated.div
                    style={style}
                    className="absolute inset-0 w-full h-full bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50"
                >
                    <div className="w-16 h-16 border-4 border-slate-300 border-t-blue-500 rounded-full animate-spin"></div>
                </animated.div>
            )
    );
};
