import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Login } from './routes/login';
import { AuthCallback } from './routes/auth-callback';
import { ImageGen } from './routes/image-gen';
import { authService } from '../services/auth-service';
import { Home } from './routes/home';
import { LeagueOverview } from './routes/league-overview';
import { Awards } from './routes/awards/awards';
import { Admin, FigsGossipCornerAdmin } from './routes/admin';

const PrivateRoute: React.FC<{ children: React.ReactNode; redirectFrom: string }> = ({
    children,
    redirectFrom,
}) => {
    return authService.isAuthenticated() ? (
        <>{children}</>
    ) : (
        <Navigate to="/login" state={{ from: redirectFrom }} replace />
    );
};

export function RoutesContainer() {
    const location = useLocation();
    return (
        <Routes location={location}>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/image-gen" element={<ImageGen />} />
            <Route
                path="/standings"
                element={
                    <PrivateRoute redirectFrom={location.pathname}>
                        <LeagueOverview />
                    </PrivateRoute>
                }
            />
            <Route
                path="/awards"
                element={
                    <PrivateRoute redirectFrom={location.pathname}>
                        <Awards />
                    </PrivateRoute>
                }
            />
            <Route path="/admin/awards" element={<Admin />} />
            <Route path="/admin/figs-gossip-corner" element={<FigsGossipCornerAdmin />} />
        </Routes>
    );
}
