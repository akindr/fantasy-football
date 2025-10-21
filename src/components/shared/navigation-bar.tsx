import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { authService } from '../../services/auth-service';

const buttonClasses = 'rounded-md px-3 py-2 cursor-pointer transition-colors';

function buttonClassNameHelper({ isActive }: { isActive: boolean }) {
    const color = 'bg-slate-500/80 border border-slate-500/75';
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
        <div className="flex flex-row gap-2 px-4 py-2 bg-slate-600 text-xl items-center">
            <NavLink role="button" to="/" className={buttonClassNameHelper}>
                Home
            </NavLink>
            <NavLink role="button" to="/awards" className={buttonClassNameHelper}>
                Awards
            </NavLink>
            <div className="flex-grow" />
            {isAuthenticated ? (
                <>
                    <span className="text-white mr-4">Welcome, {user?.displayName || 'User'}</span>
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
    );
}
