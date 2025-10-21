import React from 'react';
import { useTransition, animated } from '@react-spring/web';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Login } from './routes/login';
import { AuthCallback } from './routes/auth-callback';
import { ImageGen } from './routes/image-gen';
import { authService } from '../services/auth-service';
import { Home } from './routes/home';
import { LeagueOverview } from './routes/league-overview';
import { Awards } from './routes/awards/awards';
import { Admin } from './routes/admin';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return authService.isAuthenticated() ? <>{children}</> : <Navigate to="/login" />;
};

export function RoutesContainer() {
    const location = useLocation();

    const routeSpring = useTransition(location, {
        from: { opacity: 0, transform: 'translate3d(100%,0,0)' },
        enter: { opacity: 1, transform: 'translate3d(0%,0,0)' },
        leave: { opacity: 0, transform: 'translate3d(-50%,0,0)' },
    });

    return routeSpring((style, item) => (
        <animated.div style={style} className="route-container overflow-y-auto">
            <Routes location={item}>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="/image-gen" element={<ImageGen />} />
                <Route
                    path="/standings"
                    element={
                        <PrivateRoute>
                            <LeagueOverview />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/awards"
                    element={
                        <PrivateRoute>
                            <Awards />
                        </PrivateRoute>
                    }
                />
                <Route path="/admin" element={<Admin />} />
            </Routes>
        </animated.div>
    ));
}
