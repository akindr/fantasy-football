import React from 'react';
import { NavLink } from 'react-router-dom';
import { authService } from '../../services/auth-service';
function Home() {
    const isAuthenticated = authService.isAuthenticated();

    return (
        <div className="py-2 px-4 md:p-4 text-4xl font-strike flex flex-col items-center justify-start h-full w-full overflow-y-auto">
            <img src="/logo-transparent.png" alt="League logo" className="w-2/3 object-cover" />
            <div className="text-xl md:text-2xl font-think-loved text-center">
                <p className="mb-8">
                    It&apos;s Time to{' '}
                    <span className="text-3xl md:text-6xl bg-linear-to-r from-cyan-200 to-indigo-900 bg-clip-text text-transparent">
                        Get Schwifty
                    </span>
                </p>
                {!isAuthenticated ? (
                    <>
                        <p className="mb-4 text-left">
                            Welcome to Get Schwifty Football, the greatest fantasy football league
                            on the planet.
                        </p>
                        <p className="mb-4 text-left">
                            <NavLink to="/login" className="text-indigo-400 hover:text-cyan-200">
                                Log in
                            </NavLink>{' '}
                            with your Yahoo account to start viewing our awards!
                        </p>
                    </>
                ) : (
                    <>
                        <p className="mb-2 text-left">
                            Welcome back fellow Footballer. You&apos;re probably here for your
                            weekly awards, eh?
                        </p>
                        <p className="text-left">
                            <NavLink to="/awards" className="text-indigo-400 hover:text-cyan-200">
                                Click here to get started!
                            </NavLink>
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}

export { Home };
