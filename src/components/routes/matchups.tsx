import React from 'react';
import { useQuery } from '@tanstack/react-query';

export const Matchups: React.FC = () => {
    const {
        data: matchups,
        isLoading,
        error,
    } = useQuery({
        queryKey: ['matchups'],
    });

    if (isLoading) {
        return <div>Loading matchups...</div>;
    }

    if (error) {
        return <div>Error loading matchups: {error.message}</div>;
    }

    return (
        <div className="matchups">
            <h2>League Matchups</h2>
            <pre>{JSON.stringify(matchups, null, 2)}</pre>
        </div>
    );
};
