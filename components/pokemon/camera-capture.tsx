"use client"

import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';
import { calculateTrainerStats } from '@/lib/stats-calculator';
import { supabase } from '@/lib/supabase';
import type { PokemonStats } from '@/lib/types';
import { CameraIcon, XIcon, RotateCcw } from 'lucide-react';
import { ChangeEvent, useCallback, useRef, useState } from 'react';
import Webcam from 'react-webcam';
import { toast } from 'sonner';
import { BattleArena } from './battle-arena';
import Link from 'next/link';

interface CameraCaptureProps {
    onCaptureSuccess?: () => void;
    playerTeam?: PokemonStats[]; // Add player's team prop
}

// Enhanced CSS Pokeball for throwing animation visual
const ThrownPokeball = ({ isShaking, isOpening }: { isShaking?: boolean; isOpening?: boolean }) => (
    <div
        className={`
            w-12 h-12 sm:w-16 sm:h-16 rounded-full border-2 border-black overflow-hidden
            relative transition-all duration-500
            ${isShaking ? "animate-pokeball-shake" : ""}
            ${isOpening ? "animate-pokeball-flash" : ""}
        `}
        style={{
            boxShadow: "inset 0 -2px 0px 1px rgba(0,0,0,0.3)",
            transform: isShaking ? "rotate(0deg)" : "rotate(0deg)",
            animation: isShaking 
                ? "shake 0.5s infinite" 
                : isOpening 
                ? "flash 0.3s ease-out"
                : "none"
        }}
    >
        <div className={`absolute top-0 left-0 w-full h-1/2 bg-red-500 transition-transform duration-300 ${isOpening ? "translate-y-[-100%]" : ""}`}></div>
        <div className={`absolute bottom-0 left-0 w-full h-1/2 bg-white transition-transform duration-300 ${isOpening ? "translate-y-[100%]" : ""}`}></div>
        <div className="absolute top-1/2 left-0 w-full h-2 sm:h-2.5 bg-black transform -translate-y-1/2 z-10"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-5 h-5 sm:w-6 sm:h-6 bg-white rounded-full border-2 border-black z-20">
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-gray-200 rounded-full border border-black"></div>
        </div>
        {isOpening && (
            <div className="absolute inset-0 bg-white animate-flash-fade"></div>
        )}
    </div>
);

export function CameraCapture({ onCaptureSuccess }: CameraCaptureProps) {
    const webcamRef = useRef<Webcam>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [capturing, setCapturing] = useState(false)
    const [pokemonData, setPokemonData] = useState<PokemonStats | null>(null)
    const [selectedImage, setSelectedImage] = useState<string | null>(null)
    const [inBattle, setInBattle] = useState(false);
    const [playerPokemon, setPlayerPokemon] = useState<PokemonStats | null>(null);
    const [tempImageSrc, setTempImageSrc] = useState<string | null>(null);

    const [playerTeam, setPlayerTeam] = useState<PokemonStats[] | null>(null);

    // Enhanced animation states
    const [pokeballAnimating, setPokeballAnimating] = useState(false);
    const [isShaking, setIsShaking] = useState(false);
    const [isOpening, setIsOpening] = useState(false);
    const [pokeballPosition, setPokeballPosition] = useState({
        top: "110%",
        left: "50%",
        scale: 0.3,
        rotate: 0,
    });

    const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) {
            setSelectedImage(null);
            return
        }

        if (!file.type.startsWith('image/')) {
            toast.error('Please select an image file')
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            return
        }

        const reader = new FileReader()
        reader.onload = (e) => {
            const result = e.target?.result as string
            setSelectedImage(result)
            setPokemonData(null);
        }
        reader.readAsDataURL(file)
    }

    const base64ToBlob = (base64: string) => {
        const parts = base64.split(",");
        if (parts.length !== 2) throw new Error("Invalid base64 string");
        const byteString = atob(parts[1]);
        const mimeString = parts[0].split(":")[1].split(";")[0];
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);

        for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }

        return new Blob([ab], { type: mimeString });
    }

    const handleCapture = async (imageSrc: string, pokemonData: PokemonStats, userId: string) => {
        try {
            const timestamp = new Date().getTime();
            const filePath = `${userId}/${timestamp}.jpg`;

            // Upload image
            const { error: uploadError } = await supabase.storage
                .from('pokemon-images')
                .upload(filePath, base64ToBlob(imageSrc), {
                    contentType: 'image/jpeg',
                    cacheControl: '3600'
                });

            if (uploadError) throw uploadError;

            // Save Pokemon data
            const { error: dbError } = await supabase
                .from('captured_pokemon')
                .insert([{
                    user_id: userId,
                    image_path: filePath,
                    stats: pokemonData,
                    captured_at: new Date().toISOString()
                }]);

            if (dbError) throw dbError;

            // Update trainer stats
            const { data: allPokemon, error: pokemonError } = await supabase
                .from('captured_pokemon')
                .select('id, stats, image_path, captured_at')
                .eq('user_id', userId);

            if (pokemonError) throw pokemonError;

            const captured = allPokemon.map(p => ({
                id: p.id,
                stats: p.stats,
                imagePath: p.image_path,
                captured_at: p.captured_at
            }));

            const newStats = calculateTrainerStats(captured);
            await supabase
                .from('trainers')
                .update({ stats: newStats })
                .eq('user_id', userId);

            // Reset states and notify success
            setSelectedImage(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }

            toast.success('Pokemon captured successfully!');
            onCaptureSuccess?.();

        } catch (error) {
            console.error('Error in capture process:', error);
            throw error; // Re-throw to be handled by the caller
        }
    };

    const performActualAnalysisAndSave = useCallback(async () => {
        try {
            let imageSrc: string | null = null;

            if (selectedImage) {
                imageSrc = selectedImage;
            } else if (webcamRef.current) {
                imageSrc = webcamRef.current.getScreenshot();
            }

            if (!imageSrc) {
                toast.error('No image source available for capture.');
                setCapturing(false);
                setPokeballAnimating(false);
                return;
            }

            setTempImageSrc(imageSrc); // Store image temporarily

            const { data: sessionData } = await supabase.auth.getSession()
            const userId = sessionData.session?.user.id
            if (!userId) throw new Error('User not authenticated')

            // First analyze the image to get Pokemon data
            const response = await fetch('/api/pokemon', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: imageSrc })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Failed to analyze image (status ${response.status})`);
            }

            const wildPokemonData = await response.json();
            setPokemonData(wildPokemonData);

            const { data: playerTeamIdList } = await supabase
                .from('trainers')
                .select('team')
                .eq("user_id", userId)
                .limit(1)
                .single();

            if (playerTeamIdList) {
                const teamList: string[] = playerTeamIdList.team;

                // Check if player has existing Pokemon
                const { data: existingPokemon } = await supabase
                    .from('captured_pokemon')
                    .select('stats, image_path, id')
                    .in('id', teamList);

                if (existingPokemon && existingPokemon.length > 0) {
                    // Convert to PokemonStats array
                    const pokemonTeam = existingPokemon.map(pokemon => ({
                        ...pokemon.stats,
                        id: pokemon.id,
                        image_path: pokemon.image_path
                    })) as PokemonStats[];

                    setPlayerTeam(pokemonTeam);

                    // Set first Pokemon as player's active Pokemon
                    setPlayerPokemon(pokemonTeam[0]);
                    setInBattle(true);
                } else {
                    // First Pokemon - direct capture
                    await handleCapture(imageSrc, wildPokemonData, userId);
                }
            }

        } catch (error) {
            console.error('Error in Pokemon analysis/capture:', error);
            toast.error('Failed to analyze/capture Pokemon', {
                description: error instanceof Error ? error.message : 'Unknown error occurred'
            });
            setPokemonData(null);
            setTempImageSrc(null);
        } finally {
            setCapturing(false);
            setPokeballAnimating(false);
        }
    }, [selectedImage, webcamRef]);

    // Animation timeline function
    const animatePokeball = useCallback(() => {
        if (capturing || pokeballAnimating || isShaking) {
            return;
        }

        setPokeballAnimating(true);
        
        // Initial position
        setPokeballPosition({
            top: "90%",
            left: "50%",
            scale: 0.8,
            rotate: 0
        });

        // Throw animation with curve
        setTimeout(() => {
            setPokeballPosition({
                top: "40%",
                left: "55%",
                scale: 1,
                rotate: 720
            });
        }, 100);

        setTimeout(() => {
            setPokeballPosition({
                top: "50%",
                left: "50%",
                scale: 1,
                rotate: 1080
            });
        }, 500);

        // Landing bounce
        setTimeout(() => {
            setPokeballPosition({
                top: "55%",
                left: "50%",
                scale: 0.9,
                rotate: 1080
            });
        }, 600);

        setTimeout(() => {
            setPokeballPosition({
                top: "50%",
                left: "50%",
                scale: 1,
                rotate: 1080
            });
        }, 700);

        // Open animation
        setTimeout(() => {
            setIsOpening(true);
        }, 1000);

        // Start shaking
        setTimeout(() => {
            setIsOpening(false);
            setIsShaking(true);
        }, 1500);

        // Stop shaking and proceed with capture
        setTimeout(() => {
            setIsShaking(false);
            setCapturing(true);
            performActualAnalysisAndSave();
        }, 3000);
    }, [capturing, pokeballAnimating, isShaking, performActualAnalysisAndSave]);

    const triggerCaptureFlow = useCallback(() => {
        if (!selectedImage && !webcamRef.current) {
            toast.error('No image source available');
            return;
        }

        animatePokeball();
    }, [selectedImage, webcamRef, animatePokeball]);

    const resetState = () => {
        setSelectedImage(null);
        setPokemonData(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        setPokeballAnimating(false);
        setIsShaking(false);
        setIsOpening(false);
        setPokeballPosition({ top: "110%", left: "50%", scale: 0.3, rotate: 0 });
        setCapturing(false);
    };

    const handleBattleEnd = async (result: 'won' | 'lost' | 'fled') => {
        try {
            if (result === 'won' && pokemonData && tempImageSrc) {
                const { data: sessionData } = await supabase.auth.getSession();
                const userId = sessionData.session?.user.id;
                if (!userId) throw new Error('User not authenticated');

                await handleCapture(tempImageSrc, pokemonData, userId);
                toast.success('Victory! Pokemon captured successfully!');
            } else if (result === 'lost') {
                toast.error('Your Pokemon fainted! The wild Pokemon got away...');
            } else {
                toast.info('Got away safely!');
            }
        } catch (error) {
            console.error('Error in battle end handling:', error);
            toast.error('Failed to complete battle action');
        } finally {
            setInBattle(false);
            setPokemonData(null);
            setPlayerPokemon(null);
            setSelectedImage(null);
            setTempImageSrc(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handlePokemonSwap = (newPokemon: PokemonStats) => {
        setPlayerPokemon(newPokemon);
    };

    return (
        <div className="w-screen h-full mx-auto font-mono">
            {inBattle && pokemonData && playerPokemon ? (
                <BattleArena
                    playerPokemon={playerPokemon}
                    wildPokemon={pokemonData}
                    wildPokemonImage={tempImageSrc || ''}
                    onBattleEnd={handleBattleEnd}
                    playerTeam={playerTeam as PokemonStats[]}
                    onPokemonSwap={handlePokemonSwap}
                />
            ) : (
                <div className="w-screen h-full mx-auto font-mono">
                    <div className="w-full h-[97vh] bg-red-700 shadow-lg border-red-900">
                        <div className="flex items-center mb-1.5 sm:mb-2 px-1">
                            <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 bg-sky-400 rounded-full border-2 border-sky-600 shadow-sm"></div>
                            <div className="ml-1.5 flex gap-1 sm:gap-1.5">
                                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-red-400 rounded-full border border-red-600"></div>
                                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-yellow-400 rounded-full border border-yellow-600"></div>
                                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full border border-green-700"></div>
                            </div>
                        </div>

                        <div className="flex w-full h-full flex-col md:flex-row justify-around">
                            <div className="flex-grow w-full h-full md:w-3/5 bg-gray-700 rounded border-2 border-gray-800 shadow-inner">
                                <div className="bg-gray-950 w-full h-full rounded-sm overflow-hidden border-2 border-lime-500 relative flex items-center justify-center">
                                    {!pokemonData && (
                                        selectedImage ? (
                                            <img
                                                src={selectedImage}
                                                alt="Selected Preview"
                                                className="w-full h-full object-contain"
                                            />
                                        ) : (
                                            <Webcam
                                                ref={webcamRef}
                                                screenshotFormat="image/jpeg"
                                                videoConstraints={{
                                                    facingMode: "environment",
                                                }}
                                                className="object-contain"
                                                mirrored={false}
                                                audio={false}
                                                onUserMediaError={(e) => console.error("Webcam Error:", e)}
                                            />
                                        )
                                    )}

                                    {pokeballAnimating && (
                                        <div
                                            style={{
                                                position: "absolute",
                                                top: pokeballPosition.top,
                                                left: pokeballPosition.left,
                                                transform: `translate(-50%, -50%) scale(${pokeballPosition.scale}) rotate(${pokeballPosition.rotate}deg)`,
                                                transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                                            }}
                                            className="z-20"
                                        >
                                            <ThrownPokeball isShaking={isShaking} isOpening={isOpening} />
                                        </div>
                                    )}

                                    {capturing && (
                                        <div className="absolute inset-0 bg-black/70 backdrop-blur-xs flex flex-col items-center justify-center z-30">
                                            <Loader />
                                            <p className="text-white mt-3 text-center text-xs sm:text-sm font-mono uppercase tracking-wider">
                                                Analyzing...
                                            </p>
                                        </div>
                                    )}

                                    {pokemonData && (
                                        <div className="p-2 sm:p-3 space-y-2 text-xs h-full overflow-y-auto bg-lime-200 text-black font-mono absolute inset-0">
                                            <h3 className="text-base sm:text-lg font-bold text-center uppercase tracking-wider">
                                                {pokemonData.currentForm.name} (Lv. {pokemonData.currentForm.level})
                                            </h3>
                                            <p className="italic text-gray-700 text-[11px] sm:text-xs leading-tight px-1">
                                                {pokemonData.currentForm.description}
                                            </p>
                                            <div className="flex flex-wrap gap-1 justify-center my-1">
                                                {pokemonData.currentForm.types.map((type) => (
                                                    <span
                                                        key={type}
                                                        className="px-1.5 py-0.5 rounded-sm bg-gray-600 text-white text-[10px] sm:text-xs uppercase"
                                                    >
                                                        {type}
                                                    </span>
                                                ))}
                                            </div>
                                            <div className="grid grid-cols-1 gap-1.5 text-[11px] sm:text-xs">
                                                <div>
                                                    <h4 className="font-semibold uppercase">Base Stats:</h4>
                                                    <ul className="space-y-0.5">
                                                        {[
                                                            "hp",
                                                            "attack",
                                                            "defense",
                                                            "specialAttack",
                                                            "specialDefense",
                                                            "speed",
                                                        ].map((statKey) => (
                                                            <li key={statKey} className="flex justify-between">
                                                                <span className="capitalize">
                                                                    {statKey.replace("special", "Sp. ")}:
                                                                </span>
                                                                <span>
                                                                    {
                                                                        (pokemonData.currentForm.baseStats as any)[
                                                                        statKey.replace("special", "special")
                                                                        ]
                                                                    }
                                                                </span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                                <div className="mt-1">
                                                    <h4 className="font-semibold uppercase">Abilities:</h4>
                                                    <p className="capitalize">
                                                        {pokemonData.currentForm.abilities.join(", ")}
                                                    </p>
                                                </div>
                                                <div className="mt-1">
                                                    <h4 className="font-semibold uppercase">Moves:</h4>
                                                    <ul className="list-disc list-inside pl-1">
                                                        {pokemonData.currentForm.moves.slice(0, 4).map((move) => (
                                                            <li key={move} className="capitalize">
                                                                {move}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>
                                            <div className="mt-2 pt-1.5 border-t border-gray-500">
                                                <h4 className="font-semibold text-center uppercase text-xs sm:text-sm">
                                                    Evolution
                                                </h4>
                                                <p className="text-center text-[10px] sm:text-xs capitalize">
                                                    Current: {pokemonData.evolutionChain.current.name} (Lv.{" "}
                                                    {pokemonData.evolutionChain.current.level})
                                                </p>
                                                {pokemonData.evolutionChain.nextEvolution && (
                                                    <p className="text-center text-[10px] sm:text-xs capitalize">
                                                        Next: {pokemonData.evolutionChain.nextEvolution.name} (Lv.{" "}
                                                        {pokemonData.evolutionChain.nextEvolution.evolutionLevel})
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="md:w-2/5 flex flex-col justify-center items-center space-y-2 p-1.5 sm:p-2 bg-red-600 rounded border-2 border-red-800">
                                <div className="flex items-center gap-2 w-full">
                                <Link href="/dashboard">
                                <Button
                                            variant="outline"
                                            
                                            
                                            className="
                                                bg-blue-400 hover:bg-blue-500 text-black font-semibold
                                                rounded-md border-b-4 border-blue-600 hover:border-blue-500 active:border-b-0 active:mt-0.5
                                                disabled:opacity-60 disabled:pointer-events-none
                                                text-xs sm:text-sm uppercase tracking-wider
                                                w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center
                                                p-0
                                            "
                                        >
                                            {"<"}
                                        </Button></Link>

                                    {pokemonData === null ? (
                                        <div className="flex-grow flex justify-center">
                                            <button
                                                onClick={triggerCaptureFlow}
                                                disabled={capturing}
                                                className="
                                                    relative
                                                    h-16 w-16 sm:h-20 sm:w-20
                                                    rounded-full border-4 border-black overflow-hidden
                                                    bg-white flex items-center justify-center
                                                    transform transition-transform duration-100 active:scale-95
                                                    disabled:opacity-60 disabled:pointer-events-none
                                                    shadow-md
                                                "
                                            >
                                                <div className="absolute top-0 left-0 w-full h-1/2 bg-red-500"></div>
                                                <div className="absolute bottom-0 left-0 w-full h-1/2 bg-white"></div>
                                                <div className="absolute top-1/2 left-0 w-full h-3 sm:h-4 bg-black transform -translate-y-1/2 z-10"></div>
                                                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-full border-4 border-black z-20 flex items-center justify-center">
                                                    <div className="w-4 h-4 sm:w-5 sm:h-5 bg-gray-300 rounded-full border-2 border-black"></div>
                                                </div>
                                            </button>
                                        </div>
                                    ) : (
                                        <Button
                                            onClick={resetState}
                                            className="flex-grow bg-blue-500 hover:bg-blue-600 text-white font-bold py-1.5 sm:py-2 px-3 sm:px-4 rounded-md border-b-4 border-blue-700 hover:border-blue-600 active:border-b-0 active:mt-0.5 text-xs sm:text-sm uppercase tracking-wider"
                                        >
                                            <RotateCcw className="mr-1.5 h-4 w-4 sm:h-5 sm:w-5" />
                                            Next Target
                                        </Button>
                                    )}

                                    {pokemonData === null && (
                                        <Button
                                            variant="outline"
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={capturing || pokeballAnimating || isShaking}
                                            className="
                                                bg-yellow-400 hover:bg-yellow-500 text-black font-semibold
                                                rounded-md border-b-4 border-yellow-600 hover:border-yellow-500 active:border-b-0 active:mt-0.5
                                                disabled:opacity-60 disabled:pointer-events-none
                                                text-xs sm:text-sm uppercase tracking-wider
                                                w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center
                                                p-0
                                            "
                                        >
                                            +
                                        </Button>
                                    )}

                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileSelect}
                                        className="hidden"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
