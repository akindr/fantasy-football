import React from 'react';

export const Button = ({
    children,
    onClick,
    disabled,
    type,
}: {
    children: React.ReactNode;
    onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
    disabled?: boolean;
    type?: 'button' | 'submit' | 'reset';
}) => {
    return (
        <button
            onClick={onClick}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-500 disabled:cursor-not-allowed cursor-pointer"
            disabled={disabled}
            type={type}
        >
            {children}
        </button>
    );
};
