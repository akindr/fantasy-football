import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { GiHamburgerMenu } from 'react-icons/gi';
import { AiOutlineCloseCircle } from 'react-icons/ai';
import { useTransition, animated } from '@react-spring/web';

import { authService } from '../../services/auth-service';

const buttonClasses = 'rounded-md px-3 py-2 cursor-pointer transition-colors';

function buttonClassNameHelper({ isActive }: { isActive: boolean }) {
    const color = 'bg-slate-500/80 border border-slate-500/75';
    const textColor = isActive ? 'text-cyan-400' : 'text-white';
    const hover = 'hover:bg-slate-400/75';
    return `${buttonClasses} ${color} ${textColor} ${hover}`;
}

function mobileMenuButtonClassNameHelper({ isActive }: { isActive: boolean }) {
    const color = 'text-center bg-slate-500/80 border border-slate-500/75 w-full';
    const textColor = isActive ? 'text-cyan-400' : 'text-white';
    const hover = 'hover:bg-slate-400/75';
    return `${buttonClasses} ${color} ${textColor} ${hover}`;
}

export function NavigationBar() {
    const navigate = useNavigate();
    const isAuthenticated = authService.isAuthenticated();
    const user = authService.getUser();

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    return (
        <>
            <MobileNavigationBar handleLogout={handleLogout} />
            <div className="hidden lg:flex flex-row gap-2 px-4 py-2 bg-slate-600 text-xl items-center">
                <NavLink role="button" to="/" className={buttonClassNameHelper}>
                    Home
                </NavLink>
                <NavLink role="button" to="/awards" className={buttonClassNameHelper}>
                    Awards
                </NavLink>
                <div className="flex-grow" />
                {isAuthenticated ? (
                    <>
                        <span className="text-white mr-4">
                            Welcome, {user?.displayName || 'User'}
                        </span>
                        <button
                            onClick={handleLogout}
                            className={buttonClassNameHelper({ isActive: false })}
                        >
                            Logout
                        </button>
                    </>
                ) : (
                    <NavLink role="button" to="/login" className={buttonClassNameHelper}>
                        Login
                    </NavLink>
                )}
            </div>
        </>
    );
}

function MobileNavigationBar({ handleLogout }: { handleLogout: () => void }) {
    const [isOpen, setIsOpen] = useState(false);

    const handleToggle = () => {
        setIsOpen(!isOpen);
    };

    const transitions = useTransition(isOpen, {
        from: { transform: 'translateX(100%)' },
        enter: { transform: 'translateX(0%)' },
        leave: { transform: 'translateX(100%)' },
        config: { tension: 280, friction: 30 },
    });

    return (
        <>
            <div
                className="fixed top-2 right-0 lg:hidden flex-row gap-2 px-4 py-2 text-4xl items-center text-white cursor-pointer z-50"
                onClick={handleToggle}
            >
                <GiHamburgerMenu />
            </div>
            {transitions(
                (style, item) =>
                    item && (
                        <animated.div
                            style={style}
                            className="fixed top-0 right-0 w-full h-full bg-slate-600 z-50"
                        >
                            <div className="flex flex-row justify-end items-center text-white">
                                <span
                                    onClick={handleToggle}
                                    className="text-4xl p-4 cursor-pointer"
                                >
                                    <AiOutlineCloseCircle />
                                </span>
                            </div>
                            <div className="flex flex-col gap-2 px-4 py-2 text-xl items-center text-white">
                                <NavLink
                                    role="button"
                                    to="/"
                                    className={mobileMenuButtonClassNameHelper}
                                    onClick={handleToggle}
                                >
                                    Home
                                </NavLink>
                                <NavLink
                                    role="button"
                                    to="/awards"
                                    className={mobileMenuButtonClassNameHelper}
                                    onClick={handleToggle}
                                >
                                    Awards
                                </NavLink>
                                <NavLink
                                    role="button"
                                    to="/login"
                                    className={mobileMenuButtonClassNameHelper}
                                    onClick={handleToggle}
                                >
                                    Login
                                </NavLink>
                                <button
                                    onClick={() => {
                                        handleToggle();
                                        handleLogout();
                                    }}
                                    className={`text-center ${mobileMenuButtonClassNameHelper({ isActive: false })}`}
                                >
                                    Logout
                                </button>
                                <img src="/logo-inverted.png" alt="League logo" className="w-3/4" />
                            </div>
                        </animated.div>
                    )
            )}
        </>
    );
}
