import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { authService } from './services/auth-service';
import { Login } from './components/login';
import { AuthCallback } from './components/auth-callback';
import { LeagueOverview } from './components/league-overview';
import { Helmet } from 'react-helmet';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return authService.isAuthenticated() ? <>{children}</> : <Navigate to="/login" />;
};

function App() {
    return (
        <Router>
            <Helmet>
                <title>Austins Fantasy Football</title>
            </Helmet>
            <div className="App">
                <header className="text-8xl">Fantasy Football Rules</header>
                <main>
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/auth/callback" element={<AuthCallback />} />
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
