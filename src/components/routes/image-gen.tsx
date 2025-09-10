import React, { useState } from 'react';

export const ImageGen: React.FC = () => {
    const [image, setImage] = useState<string | null>(null);

    const handleGenerateImage = async () => {
        const searchParams = new URLSearchParams({ prompt: 'A corgi fighting a giant robot cat' });
        const response = await fetch(
            `https://localhost:3001/api/generate-image?${searchParams.toString()}`,
            {
                method: 'GET',
            }
        );
        const image = await response.blob();
        const imageUrl = URL.createObjectURL(image);
        setImage(imageUrl);
    };

    return (
        <div className="p-4">
            <button onClick={handleGenerateImage} className="p-4 bg-off-white rounded-full">
                Generate Image
            </button>
            {image && (
                <div className="mt-6 ">
                    <img src={image} alt="Generated Image" />
                </div>
            )}
        </div>
    );
};
