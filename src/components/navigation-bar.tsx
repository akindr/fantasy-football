import React from 'react';
// import { useLocation } from 'react-router-dom';
import { NavLink } from 'react-router-dom';

const buttonClasses =
    'rounded-full px-5 py-2 cursor-pointer transition-colors font-strike text-2xl';

function buttonClassNameHelper({ isActive }: { isActive: boolean }) {
    const color = isActive ? 'bg-light-purple' : 'bg-purple';
    const textColor = isActive ? 'text-inherit' : 'text-white';
    const hover = '';
    return `${buttonClasses} ${color} ${textColor} ${hover}`;
}

export function NavigationBar() {
    // get current route
    // const location = useLocation();

    return (
        <div className="flex flex-row gap-2">
            <NavLink role="button" to="/" className={buttonClassNameHelper}>
                Home
            </NavLink>
            <NavLink role="button" to="/standings" className={buttonClassNameHelper}>
                Standings
            </NavLink>
            <NavLink role="button" to="/login" className={buttonClassNameHelper}>
                Login
            </NavLink>
        </div>
    );
}
