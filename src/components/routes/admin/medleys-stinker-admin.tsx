import React, { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

import { googleAuthService } from '../../../services/google-auth-service';
import { yahooFantasyService } from '../../../services/yahoo-fantasy-service';
import { API_CONFIG, BASE_URL } from '../../../config';
import type { MedleysStinkerData } from '../../../../functions/src/server/types';
import { Button } from '../../shared/buttons';

const WEEK_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17];

export const MedleysStinkerAdmin: React.FC = () => {
    const navigate = useNavigate();
    const [isVerifying, setIsVerifying] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [week, setWeek] = useState<number>(1);
    const [playerName, setPlayerName] = useState('');
    const [description, setDescription] = useState('');
    const [imageURL, setImageURL] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const queryClient = useQueryClient();

    const {
        data: stinkerData,
        isFetching,
        isError,
        error,
    } = useQuery<{
        stinker: MedleysStinkerData | null;
    }>({
        queryKey: ['medleys-stinker', { week }],
        refetchOnWindowFocus: false,
        enabled: () => week !== undefined,
    });

    const saveStinkerMutation = useMutation({
        mutationFn: async (payload: MedleysStinkerData) => {
            return yahooFantasyService.makeRequest(`${API_CONFIG.apiUri}/data/medleys-stinker`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['medleys-stinker', { week }],
            });
            setStatusMessage("Medley's stinker saved successfully!");
        },
        onError: mutationError => {
            const message =
                mutationError instanceof Error ? mutationError.message : 'Unknown error';
            setStatusMessage(`Error saving stinker: ${message}`);
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

    const resetImageInput = () => {
        setSelectedFile(null);
        setImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Populate the form from the saved doc for the selected week (or clear it)
    useEffect(() => {
        if (stinkerData?.stinker) {
            setPlayerName(stinkerData.stinker.playerName);
            setDescription(stinkerData.stinker.description);
            setImageURL(stinkerData.stinker.imageURL);
        } else {
            setPlayerName('');
            setDescription('');
            setImageURL('');
        }
        resetImageInput();
    }, [stinkerData]);

    const handleWeekChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setWeek(Number(event.target.value));
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0] ?? null;
        if (!file) {
            return;
        }

        setSelectedFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
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
            setImageURL(data.publicUrl);
        } catch (uploadError) {
            console.error('Error uploading image:', uploadError);
            setStatusMessage('Error uploading image. Please try again.');
        } finally {
            setIsUploading(false);
        }
    };

    const handleClear = () => {
        setPlayerName('');
        setDescription('');
        setImageURL('');
        resetImageInput();
        setStatusMessage(null);
    };

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const payload: MedleysStinkerData = {
            week,
            playerName: playerName.trim(),
            description: description.trim(),
            imageURL: imageURL.trim(),
        };

        saveStinkerMutation.mutate(payload);
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
                    <h2 className="text-gray-300 font-bold text-2xl">
                        Medley&apos;s Weekly Landmine
                    </h2>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="flex flex-col gap-2">
                        <label className="block font-medium mb-2" htmlFor="player-name">
                            Player Name
                        </label>
                        <input
                            type="text"
                            id="player-name"
                            value={playerName}
                            onChange={event => setPlayerName(event.target.value)}
                            className="w-full px-3 py-2 bg-slate-600 text-white rounded border border-slate-500 focus:outline-none focus:border-blue-500"
                            placeholder="Enter the player name"
                            required
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="block font-medium mb-2" htmlFor="description">
                            Description
                        </label>
                        <textarea
                            id="description"
                            value={description}
                            onChange={event => setDescription(event.target.value)}
                            className="w-full px-3 py-2 bg-slate-600 text-white rounded border border-slate-500 focus:outline-none focus:border-blue-500 min-h-[160px]"
                            placeholder="Enter the description (markdown supported)"
                            required
                        />
                    </div>

                    <div>
                        <label className="block font-medium mb-2" htmlFor="file">
                            Upload Image
                        </label>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="flex flex-col gap-2">
                                <input
                                    id="file"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    ref={fileInputRef}
                                    className="w-full px-3 py-2 bg-slate-600 text-white rounded border border-slate-500 focus:outline-none focus:border-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                                />
                                {(imagePreview || imageURL) && (
                                    <img
                                        src={imagePreview || imageURL}
                                        alt="Stinker preview"
                                        className="max-w-xs max-h-48 rounded border border-slate-500"
                                    />
                                )}
                            </div>

                            <div className="flex flex-col gap-2">
                                <input
                                    id="image-url"
                                    type="text"
                                    value={imageURL}
                                    onChange={event => setImageURL(event.target.value)}
                                    className="w-full px-3 py-2 bg-slate-600 text-white rounded border border-slate-500 focus:outline-none focus:border-blue-500"
                                    placeholder="Image URL or upload above"
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
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <Button type="submit" disabled={saveStinkerMutation.isPending}>
                            {saveStinkerMutation.isPending ? 'Saving...' : 'Save Stinker'}
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
                {isFetching && <div className="text-sm text-gray-400">Loading stinker...</div>}
                {isError && (
                    <div className="text-sm text-red-400">
                        {error instanceof Error ? error.message : 'Error loading existing stinker'}
                    </div>
                )}
                {stinkerData?.stinker && (
                    <div className="text-sm text-gray-300">
                        <p>Last updated: {stinkerData.stinker.updatedAt ?? 'Unknown'}</p>
                    </div>
                )}
            </div>
        </div>
    );
};
