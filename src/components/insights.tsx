import React from 'react';
import Markdown from 'react-markdown';

export function Insights({ insights }: { insights: string }) {
    return (
        <div className="p-4 font-helvetica text-base">
            <Markdown
                components={{
                    strong: props => <strong className="font-bold text-indigo-400" {...props} />,
                    ul: props => (
                        <ul className="list-disc list-inside text-gray-400 mb-8" {...props} />
                    ),
                    ol: props => <ol className="mt-4" {...props} />,
                    li: props => <li className="mb-1" {...props} />,
                    p: props => <p className="text-lg" {...props} />,
                }}
            >
                {insights}
            </Markdown>
        </div>
    );
}
