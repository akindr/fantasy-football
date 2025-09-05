import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { Helmet } from 'react-helmet';

import { NavigationBar } from './components/shared/navigation-bar';
import { RoutesContainer } from './components/route-container';

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
                    <RoutesContainer />
                </main>
            </div>
        </Router>
    );
}

export default App;
