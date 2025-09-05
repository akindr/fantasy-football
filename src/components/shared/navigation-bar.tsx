import React from 'react';
import { NavLink } from 'react-router-dom';

const buttonClasses = 'rounded-full px-5 py-2 cursor-pointer transition-colors';

function buttonClassNameHelper({ isActive }: { isActive: boolean }) {
    const color = 'bg-transparent';
    const textColor = isActive ? 'text-light-blue' : 'text-white';
    const hover = 'hover:text-light-blue';
    return `${buttonClasses} ${color} ${textColor} ${hover}`;
}

export function NavigationBar() {
    return (
        <div className="flex flex-row gap-2 px-4 py-2 bg-medium-blue">
            <NavLink role="button" to="/" className={buttonClassNameHelper}>
                Home
            </NavLink>
            <NavLink role="button" to="/standings" className={buttonClassNameHelper}>
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
        </div>
    );
}
