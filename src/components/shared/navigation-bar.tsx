import React from 'react';
import { NavLink } from 'react-router-dom';

const buttonClasses = 'rounded-md px-3 py-2 cursor-pointer transition-colors';

function buttonClassNameHelper({ isActive }: { isActive: boolean }) {
    const color = 'bg-slate-500/80 border border-slate-500/75';
    const textColor = isActive ? 'text-cyan-400' : 'text-white';
    const hover = 'hover:bg-slate-400/75';
    return `${buttonClasses} ${color} ${textColor} ${hover}`;
}

export function NavigationBar() {
    return (
        <div className="flex flex-row gap-2 px-4 py-2 bg-slate-600 text-xl">
            <NavLink role="button" to="/" className={buttonClassNameHelper}>
                Home
            </NavLink>
            {/* <NavLink role="button" to="/standings" className={buttonClassNameHelper}>
                Standings
            </NavLink>
            <NavLink role="button" to="/matchups" className={buttonClassNameHelper}>
                Matchups
            </NavLink>
            <NavLink role="button" to="/image-gen" className={buttonClassNameHelper}>
                Images
            </NavLink>
            <NavLink role="button" to="/login" className={buttonClassNameHelper}>
                Login
            </NavLink>
             */}
            <NavLink role="button" to="/awards" className={buttonClassNameHelper}>
                Awards
            </NavLink>
        </div>
    );
}
