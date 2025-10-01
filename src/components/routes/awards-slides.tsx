import React from 'react';

function AwardsSlides() {
    return (
        <div className="p-4 text-4xl font-strike h-full w-full bg-black">
            <iframe
                src="https://docs.google.com/presentation/d/e/2PACX-1vQbjthlV0McWk7jBhjKZyhZWJsmG2xKO8No-TRqGD9FsCywRymiXQf8ok20_ADribtYPg-Kh1FaqZY9/pubembed?start=false&loop=false&delayms=60000"
                width="100%"
                height="100%"
                allowFullScreen={true}
            ></iframe>
        </div>
    );
}

export { AwardsSlides };
