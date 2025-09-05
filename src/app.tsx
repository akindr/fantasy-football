import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';

import { authService } from './services/auth-service';
import { Login } from './components/login';
import { AuthCallback } from './components/auth-callback';
import { LeagueOverview } from './components/league-overview';
import { Home } from './components/home';
import { NavigationBar } from './components/navigation-bar';
import { ImageGen } from './components/image-gen';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return authService.isAuthenticated() ? <>{children}</> : <Navigate to="/login" />;
};

function App() {
    return (
        <Router>
            <Helmet>
                <title>Austins Fantasy Football</title>
            </Helmet>
            <div>
                <div className="bg-dark-blue p-4">
                    <div className="text-6xl mb-2">
                        <span className="font-strike-extrude italic text-soft-white">
                            Get Scwhifty&nbsp;
                        </span>
                        <span className="font-strike-extrude italic text-turq">
                            Fantasy Football
                        </span>
                    </div>
                    <NavigationBar />
                </div>
                <main>
                    <Routes>
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
                    </Routes>
                </main>
            </div>
        </Router>
    );
}

export default App;
