import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { googleAuthService } from '../../../services/google-auth-service';
import { yahooFantasyService } from '../../../services/yahoo-fantasy-service';
import { API_CONFIG, BASE_URL } from '../../../config';
import { TransformedMatchup } from '../../../../functions/src/server/data-mappers';
import { Button } from '../../shared/buttons';

type MatchupResponse = {
    imageData: string;
    mimeType: string;
} & TransformedMatchup;

interface AwardsFormProps {
    week: number;
    matchups: MatchupResponse[] | undefined;
    selectedMatchupIndex: number;
    onInsightsLoaded: (insights: string) => void;
    onThisYearInsightsLoaded: (insights: string) => void;
}

export const AwardsForm: React.FC<AwardsFormProps> = ({
    week,
    matchups,
    selectedMatchupIndex,
    onInsightsLoaded,
    onThisYearInsightsLoaded,
}) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [blurb, setBlurb] = useState('');
    const [funFacts, setFunFacts] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('');
    const [isUploading, setIsUploading] = useState(false);

    // React Query mutation for creating an award
    const createAwardMutation = useMutation({
        // TODO type the data
        mutationFn: async awardData => {
            return yahooFantasyService.makeRequest(`${API_CONFIG.apiUri}/data/awards`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(awardData),
            });
        },
        onSuccess: () => {
            console.log('Award created successfully!');
        },
        onError: error => {
            console.error('Error creating award:', error);
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!matchups || !matchups[selectedMatchupIndex]) {
            return;
        }

        const selected = matchups[selectedMatchupIndex];

        const awardData = {
            week,
            matchupId: selected.id,
            imageURL: uploadedImageUrl,
            team1: {
                name: selected.team1.name,
                logo: selected.team1.logo,
                points: selected.team1.points,
            },
            team2: {
                name: selected.team2.name,
                logo: selected.team2.logo,
                points: selected.team2.points,
            },
            title,
            description,
            blurb,
            funFacts,
        } as const;

        // @ts-expect-error server typing TBD
        createAwardMutation.mutate(awardData);
    };

    const getMatchupInsights = async () => {
        if (!matchups || !matchups[selectedMatchupIndex]) {
            return;
        }
        const insightData = await yahooFantasyService.makeRequest(
            `${API_CONFIG.apiUri}/admin/insights?matchup=${selectedMatchupIndex + 1}&team1=${matchups?.[selectedMatchupIndex]?.team1?.manager?.id}&team2=${matchups?.[selectedMatchupIndex]?.team2?.manager?.id}`,
            {
                method: 'GET',
            }
        );
        onInsightsLoaded(insightData.insights);
    };

    const getThisYearMatchupInsights = async () => {
        if (!matchups || !matchups[selectedMatchupIndex]) {
            return;
        }
        const insightData = await yahooFantasyService.makeRequest(
            `${API_CONFIG.apiUri}/admin/this-year-insights?week=${week}&team1=${matchups?.[selectedMatchupIndex]?.team1.id}&team2=${matchups?.[selectedMatchupIndex]?.team2.id}`
        );
        onThisYearInsightsLoaded(insightData.insights);
    };

    const getLeagueDebug = async () => {
        const leagueDebugData = await yahooFantasyService.makeRequest(
            `${API_CONFIG.apiUri}/league-debug`,
            {
                method: 'GET',
            }
        );
        console.log(leagueDebugData);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleImageUpload = async () => {
        if (!selectedFile) {
            return;
        }

        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', selectedFile);

            const idToken = await googleAuthService.getIdToken();

            // Note this isn't on the API_URL since it's not behind the regular /api prefix
            const response = await fetch(`${BASE_URL}uploadFile`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${idToken}`,
                },
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            const data = await response.json();
            setUploadedImageUrl(data.publicUrl);
        } catch (error) {
            console.error('Error uploading image:', error);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="bg-slate-800 rounded-lg p-6 mb-4 col-span-3">
            <h2 className="text-gray-300 mb-2 font-bold text-2xl">Awards Creator</h2>
            <div className="p-4 bg-slate-700 rounded mb-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="title" className="block font-medium mb-2">
                            Title
                        </label>
                        <input
                            id="title"
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-600 text-white rounded border border-slate-500 focus:outline-none focus:border-blue-500"
                            placeholder="Enter award title"
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="description" className="block font-medium mb-2">
                            Matchup Blurb
                        </label>
                        <textarea
                            id="description"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-600 text-white rounded border border-slate-500 focus:outline-none focus:border-blue-500 min-h-[100px]"
                            placeholder="Enter award description"
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="blurb" className="block font-medium mb-2">
                            Matchup Blurb (md allowed)
                        </label>
                        <textarea
                            id="blurb"
                            value={blurb}
                            onChange={e => setBlurb(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-600 text-white rounded border border-slate-500 focus:outline-none focus:border-blue-500 min-h-[100px]"
                            placeholder="Enter matchup blurb"
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="funFacts" className="block font-medium mb-2">
                            Fun Facts (md allowed)
                        </label>
                        <textarea
                            id="funFacts"
                            value={funFacts}
                            onChange={e => setFunFacts(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-600 text-white rounded border border-slate-500 focus:outline-none focus:border-blue-500 min-h-[100px]"
                            placeholder="Enter fun facts"
                            required
                        />
                    </div>

                    <label htmlFor="image" className="block font-medium mb-2">
                        Upload Image
                    </label>
                    <div className="flex flex-row gap-2 items-start">
                        <div className="mx-2 flex flex-col justify-center flex-0">
                            <input
                                id="image"
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="w-full px-3 py-2 bg-slate-600 text-white rounded border border-slate-500 focus:outline-none focus:border-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                            />
                            {imagePreview && (
                                <>
                                    <img
                                        src={imagePreview}
                                        alt="Preview"
                                        className="max-w-xs max-h-48 rounded border border-slate-500"
                                    />
                                </>
                            )}
                        </div>

                        <div className="flex flex-col justify-center flex-1">
                            <input
                                id="imageurl"
                                type="text"
                                value={uploadedImageUrl}
                                onChange={e => setUploadedImageUrl(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-600 text-white rounded border border-slate-500 focus:outline-none focus:border-blue-500 mb-2"
                                placeholder="Enter image url"
                                required
                            />

                            <Button
                                type="button"
                                disabled={isUploading || !selectedFile}
                                onClick={handleImageUpload}
                            >
                                {isUploading ? 'Uploading...' : 'Upload Image'}
                            </Button>
                        </div>
                    </div>

                    <div className="flex flex-row gap-2">
                        <Button
                            type="submit"
                            disabled={createAwardMutation.isPending}
                            onClick={handleSubmit}
                        >
                            {createAwardMutation.isPending ? 'Creating...' : 'Create Award'}
                        </Button>
                        <Button type="button" onClick={getMatchupInsights}>
                            Historic Insights
                        </Button>
                        <Button type="button" onClick={getThisYearMatchupInsights}>
                            Current Year Insights
                        </Button>
                        <Button type="button" onClick={getLeagueDebug}>
                            League Debug
                        </Button>
                    </div>
                    {createAwardMutation.isSuccess && (
                        <p className="text-green-400 text-sm">Award created successfully!</p>
                    )}

                    {createAwardMutation.isError && (
                        <p className="text-red-400 text-sm">
                            Error: {createAwardMutation.error?.message}
                        </p>
                    )}
                </form>
            </div>

            <Button
                type="button"
                onClick={async () => {
                    const idToken = await googleAuthService.getIdToken();
                    fetch(
                        `${API_CONFIG.apiUri}/data/awards?week=${week}&matchup=${matchups?.[selectedMatchupIndex]?.id}`,
                        {
                            headers: {
                                Authorization: `Bearer ${idToken}`,
                            },
                        }
                    )
                        .then(response => response.json())
                        .then(data => console.log(data))
                        .catch(error => console.error('Error testing admin endpoint:', error));
                }}
            >
                Get Awards
            </Button>
        </div>
    );
};
