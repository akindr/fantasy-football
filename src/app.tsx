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
            <div className="h-full w-full overflow-hidden flex flex-col text-xl dark">
                <div className="bg-slate-900 flex-0">
                    <div className="px-4 pb-4 mt-4 flex flex-row text-white font-think-loved items-center">
                        <div
                            className="mr-2 w-10 h-10 md:w-20 md:h-20 rounded-full inline-block bg-cover bg-center"
                            style={{ backgroundImage: `url('/sumologo.png')` }}
                        />
                        <span className="text-2xl md:text-4xl lg:text-6xl bg-linear-to-r from-cyan-400 to-indigo-500 bg-clip-text text-transparent">
                            Get Scwhifty
                        </span>
                        <span className="block md:hidden text-2xl">&nbsp;FF</span>
                        <span className="hidden md:block md:text-4xl lg:text-6xl">
                            &nbsp;Football
                        </span>
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
