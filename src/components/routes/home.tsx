import React from 'react';

function Home() {
    return (
        <div className="p-4 text-4xl font-strike flex flex-col items-center justify-center">
            <img src="/logo.png" alt="League logo" className="w-1/2 rounded-full" />
            <div className="text-2xl font-think-loved text-center">
                <p>
                    It&apos;s Time to{' '}
                    <span className="text-6xl bg-linear-to-r from-cyan-200 to-indigo-900 bg-clip-text text-transparent">
                        Get Schwifty
                    </span>
                </p>
                <p>
                    Stay tuned for a brand spanking new website. In the meantime, enjoy this
                    week&apos;s awards!
                </p>
            </div>
        </div>
    );
}

export { Home };
