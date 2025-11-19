import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '../../shared/buttons';
import Markdown from 'react-markdown';

type InsightsProps = {
    queryKey: (string | Record<string, string | number>)[];
    title: string;
};

export function Insights(props: InsightsProps) {
    const {
        data: insightsData,
        refetch,
        isLoading,
        error,
    } = useQuery<{ insights: string }>({
        queryKey: props.queryKey,
        enabled: false,
    });

    return (
        <>
            <div className="p-2 sticky left-0 top-0 bg-gray-800 z-10 pb-2">
                <Button type="button" onClick={() => refetch()}>
                    {isLoading ? 'Loading...' : 'Load Insights'}
                </Button>
            </div>
            <h2 className="text-2xl text-center font-bold">{props.title}</h2>
            {insightsData?.insights && (
                <Markdown
                    components={{
                        strong: props => (
                            <strong className="font-bold text-indigo-400" {...props} />
                        ),
                        ul: props => (
                            <ul className="list-disc list-inside text-gray-400 mb-8" {...props} />
                        ),
                        ol: props => <ol className="mt-4" {...props} />,
                        li: props => <li className="mb-1" {...props} />,
                        p: props => <p className="text-lg" {...props} />,
                    }}
                >
                    {insightsData.insights}
                </Markdown>
            )}
            {error && <div className="text-red-500">Error loading insights: {error.message}</div>}
        </>
    );
}
