import React, { useEffect, useState, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

import { googleAuthService } from '../../../services/google-auth-service';
import { yahooFantasyService } from '../../../services/yahoo-fantasy-service';
import { API_CONFIG, BASE_URL } from '../../../config';
import type { GossipCornerData } from '../../../../functions/src/server/types';
import { Button } from '../../shared/buttons';

const WEEK_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17];

type PredictionState = {
    text: string;
    imageURL: string;
    selectedFile: File | null;
    imagePreview: string | null;
    isUploading: boolean;
};

const createPredictionState = (): PredictionState => ({
    text: '',
    imageURL: '',
    selectedFile: null,
    imagePreview: null,
    isUploading: false,
});

export const FigsGossipCornerAdmin: React.FC = () => {
    const navigate = useNavigate();
    const [isVerifying, setIsVerifying] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [week, setWeek] = useState<number>(1);
    const [predictions, setPredictions] = useState<PredictionState[]>([
        createPredictionState(),
        createPredictionState(),
    ]);
    const [subtitle, setSubtitle] = useState<string>('');
    const [statusMessage, setStatusMessage] = useState<string | null>(null);

    const fileInputRefs = [
        useRef<HTMLInputElement | null>(null),
        useRef<HTMLInputElement | null>(null),
    ];

    const queryClient = useQueryClient();

    const {
        data: gossipData,
        isFetching,
        isError,
        error,
    } = useQuery<{
        gossip: GossipCornerData | null;
    }>({
        queryKey: ['figs-gossip-corner', week],
        refetchOnWindowFocus: false,
        enabled: () => week !== undefined,
    });

    const saveGossipMutation = useMutation({
        mutationFn: async (payload: GossipCornerData) => {
            return yahooFantasyService.makeRequest(`${API_CONFIG.apiUri}/data/figs-gossip-corner`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['figs-gossip-corner', week],
            });
            setStatusMessage('Predictions saved successfully!');
        },
        onError: mutationError => {
            const message =
                mutationError instanceof Error ? mutationError.message : 'Unknown error';
            setStatusMessage(`Error saving predictions: ${message}`);
        },
    });

    useEffect(() => {
        setStatusMessage(null);
    }, [week]);

    useEffect(() => {
        const verifyAdminAccess = async () => {
            try {
                await googleAuthService.waitForAuth();
                const isAuthenticated = await googleAuthService.isAuthenticated();
                if (!isAuthenticated) {
                    navigate('/');
                    return;
                }
                const isAdmin = await googleAuthService.isAdmin();
                if (!isAdmin) {
                    navigate('/');
                    return;
                }
                setIsAuthorized(true);
            } catch (verificationError) {
                console.error('Error verifying admin access:', verificationError);
                navigate('/');
            } finally {
                setIsVerifying(false);
            }
        };

        verifyAdminAccess();
    }, [navigate]);

    useEffect(() => {
        if (gossipData?.gossip) {
            setPredictions([
                {
                    ...createPredictionState(),
                    text: gossipData.gossip.predictions[0].text,
                    imageURL: gossipData.gossip.predictions[0].imageURL,
                },
                {
                    ...createPredictionState(),
                    text: gossipData.gossip.predictions[1].text,
                    imageURL: gossipData.gossip.predictions[1].imageURL,
                },
            ]);
        } else {
            setPredictions([createPredictionState(), createPredictionState()]);
        }

        for (const ref of fileInputRefs) {
            if (ref.current) {
                ref.current.value = '';
            }
        }
    }, [gossipData]);

    const handleWeekChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setWeek(Number(event.target.value));
    };

    const handleTextChange = (index: number, value: string) => {
        setPredictions(prev =>
            prev.map((prediction, idx) =>
                idx === index
                    ? {
                          ...prediction,
                          text: value,
                      }
                    : prediction
            )
        );
    };

    const handleImageUrlChange = (index: number, value: string) => {
        setPredictions(prev =>
            prev.map((prediction, idx) =>
                idx === index
                    ? {
                          ...prediction,
                          imageURL: value,
                      }
                    : prediction
            )
        );
    };

    const handleFileChange = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0] ?? null;
        if (!file) {
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setPredictions(prev =>
                prev.map((prediction, idx) =>
                    idx === index
                        ? {
                              ...prediction,
                              selectedFile: file,
                              imagePreview: reader.result as string,
                          }
                        : prediction
                )
            );
        };
        reader.readAsDataURL(file);
    };

    const handleImageUpload = async (index: number) => {
        const prediction = predictions[index];
        if (!prediction.selectedFile) {
            return;
        }

        setPredictions(prev =>
            prev.map((item, idx) =>
                idx === index
                    ? {
                          ...item,
                          isUploading: true,
                      }
                    : item
            )
        );

        try {
            const formData = new FormData();
            formData.append('file', prediction.selectedFile);

            const idToken = await googleAuthService.getIdToken();

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

            setPredictions(prev =>
                prev.map((item, idx) =>
                    idx === index
                        ? {
                              ...item,
                              imageURL: data.publicUrl,
                              isUploading: false,
                          }
                        : item
                )
            );
        } catch (uploadError) {
            console.error('Error uploading image:', uploadError);
            setPredictions(prev =>
                prev.map((item, idx) =>
                    idx === index
                        ? {
                              ...item,
                              isUploading: false,
                          }
                        : item
                )
            );
            setStatusMessage('Error uploading image. Please try again.');
        }
    };

    const handleClear = () => {
        setPredictions([createPredictionState(), createPredictionState()]);
        for (const ref of fileInputRefs) {
            if (ref.current) {
                ref.current.value = '';
            }
        }
        setStatusMessage(null);
    };

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const payload: GossipCornerData = {
            subtitle,
            week,
            predictions: predictions.map(p => ({
                text: p.text.trim(),
                imageURL: p.imageURL.trim(),
            })),
        };

        saveGossipMutation.mutate(payload);
    };

    if (isVerifying) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-white text-2xl">Verifying admin access...</div>
            </div>
        );
    }

    if (!isAuthorized) {
        return null;
    }

    return (
        <div className="p-4 text-white grid grid-cols-1 lg:grid-cols-3 gap-4 h-full overflow-y-auto text-base font-helvetica">
            <div className="bg-slate-800 rounded-lg p-6 flex flex-col gap-6 lg:col-span-2">
                <div className="flex items-center justify-between">
                    <h2 className="text-gray-300 font-bold text-2xl">Fig&apos;s Gossip Corner</h2>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="flex flex-col gap-2">
                        <label className="block font-medium mb-2" htmlFor="subtitle">
                            Subtitle
                        </label>
                        <input
                            type="text"
                            id="subtitle"
                            value={subtitle}
                            onChange={event => setSubtitle(event.target.value)}
                            className="w-full px-3 py-2 bg-slate-600 text-white rounded border border-slate-500 focus:outline-none focus:border-blue-500"
                            placeholder="Enter the subtitle"
                            required
                        />
                    </div>
                    {predictions.map((prediction, index) => (
                        <div
                            key={index}
                            className="bg-slate-700/60 border border-slate-600 rounded-lg p-4 space-y-4"
                        >
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-semibold text-gray-200">
                                    Prediction {index + 1}
                                </h3>
                            </div>

                            <div>
                                <textarea
                                    id={`text-${index}`}
                                    value={prediction.text}
                                    onChange={event => handleTextChange(index, event.target.value)}
                                    className="w-full px-3 py-2 bg-slate-600 text-white rounded border border-slate-500 focus:outline-none focus:border-blue-500 min-h-[120px]"
                                    placeholder="Enter the gossip prediction (markdown supported)"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block font-medium mb-2" htmlFor={`file-${index}`}>
                                    Upload Image
                                </label>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="flex flex-col gap-2">
                                        <input
                                            id={`file-${index}`}
                                            type="file"
                                            accept="image/*"
                                            onChange={event => handleFileChange(index, event)}
                                            ref={fileInputRefs[index]}
                                            className="w-full px-3 py-2 bg-slate-600 text-white rounded border border-slate-500 focus:outline-none focus:border-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                                        />
                                        {(prediction.imagePreview || prediction.imageURL) && (
                                            <img
                                                src={prediction.imagePreview || prediction.imageURL}
                                                alt={`Prediction ${index + 1} preview`}
                                                className="max-w-xs max-h-48 rounded border border-slate-500"
                                            />
                                        )}
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <input
                                            id={`image-url-${index}`}
                                            type="text"
                                            value={prediction.imageURL}
                                            onChange={event =>
                                                handleImageUrlChange(index, event.target.value)
                                            }
                                            className="w-full px-3 py-2 bg-slate-600 text-white rounded border border-slate-500 focus:outline-none focus:border-blue-500"
                                            placeholder="Image URL or upload above"
                                            required
                                        />

                                        <Button
                                            type="button"
                                            disabled={
                                                prediction.isUploading || !prediction.selectedFile
                                            }
                                            onClick={() => handleImageUpload(index)}
                                        >
                                            {prediction.isUploading
                                                ? 'Uploading...'
                                                : 'Upload Image'}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    <div className="flex flex-wrap gap-3">
                        <Button type="submit" disabled={saveGossipMutation.isPending}>
                            {saveGossipMutation.isPending ? 'Saving...' : 'Save Gossip'}
                        </Button>
                        <Button type="button" onClick={handleClear}>
                            Clear Form
                        </Button>
                    </div>
                    {statusMessage && (
                        <p
                            className={`text-sm ${
                                statusMessage.startsWith('Error')
                                    ? 'text-red-400'
                                    : 'text-green-400'
                            }`}
                        >
                            {statusMessage}
                        </p>
                    )}
                </form>
            </div>

            <div className="bg-slate-800 rounded-lg p-6 flex flex-col gap-4">
                <div className="flex items-center gap-3">
                    <label htmlFor="week" className="text-lg font-medium text-gray-300">
                        Week
                    </label>
                    <select
                        id="week"
                        value={week}
                        onChange={handleWeekChange}
                        className="bg-slate-700 text-white rounded px-3 py-2"
                    >
                        {WEEK_OPTIONS.map(weekOption => (
                            <option key={weekOption} value={weekOption}>
                                Week {weekOption}
                            </option>
                        ))}
                    </select>
                </div>
                {isFetching && <div className="text-sm text-gray-400">Loading predictions...</div>}
                {isError && (
                    <div className="text-sm text-red-400">
                        {error instanceof Error
                            ? error.message
                            : 'Error loading existing predictions'}
                    </div>
                )}
                {gossipData?.gossip && (
                    <div className="text-sm text-gray-300">
                        <p>Last updated: {gossipData.gossip.updatedAt ?? 'Unknown'}</p>
                    </div>
                )}
            </div>
        </div>
    );
};
