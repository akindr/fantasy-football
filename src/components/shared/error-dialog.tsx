import React, { useEffect } from 'react';
import { useTransition, animated } from '@react-spring/web';

interface ErrorDialogProps {
    message: string | null;
    onDismiss: () => void;
    duration?: number;
}

export const ErrorDialog: React.FC<ErrorDialogProps> = ({
    message,
    onDismiss,
    duration = 5000,
}) => {
    const transition = useTransition(message !== null, {
        from: { transform: 'translateY(-100%)' },
        enter: { transform: 'translateY(0%)' },
        leave: { transform: 'translateY(-100%)' },
        config: { tension: 300, friction: 30 },
    });

    useEffect(() => {
        if (message !== null) {
            const timer = setTimeout(() => {
                onDismiss();
            }, duration);

            return () => clearTimeout(timer);
        }
    }, [message, duration, onDismiss]);

    return transition(
        (style, item) =>
            item && (
                <animated.div
                    style={style}
                    className="fixed top-0 left-0 right-0 z-50 flex justify-center p-4"
                >
                    <div className="bg-red-500 text-white px-6 py-4 rounded-lg shadow-lg max-w-md w-full flex items-center justify-between">
                        <span className="flex-1">{message}</span>
                        <button
                            onClick={onDismiss}
                            className="ml-4 text-white hover:text-red-200 font-bold text-xl"
                            aria-label="Dismiss"
                        >
                            ×
                        </button>
                    </div>
                </animated.div>
            )
    );
};
