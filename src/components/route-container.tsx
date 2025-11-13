import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Login } from './routes/login';
import { AuthCallback } from './routes/auth-callback';
import { ImageGen } from './routes/image-gen';
import { Home } from './routes/home';
import { LeagueOverview } from './routes/league-overview';
import { Awards } from './routes/awards/awards';
import { Admin, FigsGossipCornerAdmin } from './routes/admin';

export function RoutesContainer() {
    return (
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/image-gen" element={<ImageGen />} />
            <Route path="/standings" element={<LeagueOverview />} />
            <Route path="/awards" element={<Awards />} />
            <Route path="/admin/awards" element={<Admin />} />
            <Route path="/admin/figs-gossip-corner" element={<FigsGossipCornerAdmin />} />
        </Routes>
    );
}
