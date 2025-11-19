import React from 'react';
import { QueryClient, QueryClientProvider, QueryFunction } from '@tanstack/react-query';
import { yahooFantasyService } from '../../services/yahoo-fantasy-service';

const makeRequest: QueryFunction = async ({ queryKey }) => {
    // todo - this is just a generic api not yahoo
    return yahooFantasyService.query(queryKey as (string | Record<string, string | number>)[]);
};

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 1,
            refetchOnWindowFocus: false,
            queryFn: makeRequest,
        },
    },
});

export const QueryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};
