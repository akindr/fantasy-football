import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';

import { authService } from './services/auth-service';
import { Login } from './components/routes/login';
import { AuthCallback } from './components/routes/auth-callback';
import { LeagueOverview } from './components/routes/league-overview';
import { Matchups } from './components/routes/matchups';
import { Home } from './components/routes/home';
import { NavigationBar } from './components/shared/navigation-bar';
import { ImageGen } from './components/routes/image-gen';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return authService.isAuthenticated() ? <>{children}</> : <Navigate to="/login" />;
};

function App() {
    return (
        <Router>
            <Helmet>
                <title>Get Schwifty Fantasy Football</title>
            </Helmet>
            <div>
                <div className="bg-dark-blue">
                    <div className="text-4xl p-4 flex flex-row">
                        <span className="text-white">Get Scwhifty FF</span>
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
                        <Route
                            path="/matchups"
                            element={
                                <PrivateRoute>
                                    <Matchups />
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
