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
            <div className="h-full w-full overflow-hidden flex flex-col">
                <div className="bg-dark-blue flex-0">
                    <div className="text-4xl p-4 flex flex-row">
                        <span className="text-white">Get Scwhifty FF</span>
                    </div>
                    <NavigationBar />
                </div>
                <main className="flex-1 overflow-y-auto overflow-x-hidden relative">
                    <RoutesContainer />
                </main>
            </div>
        </Router>
    );
}

export default App;
