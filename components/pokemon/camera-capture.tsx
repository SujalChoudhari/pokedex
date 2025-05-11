"use client"

import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader'; // Your original spinning Loader component
import { supabase } from '@/lib/supabase';
import type { PokemonStats } from '@/lib/types';
import { RotateCcw } from 'lucide-react'; // Icons for buttons
import { ChangeEvent, useCallback, useRef, useState } from 'react';
import { calculateTrainerStats } from '@/lib/stats-calculator';
import Webcam from 'react-webcam';
import { toast } from 'sonner';

interface CameraCaptureProps {
    onCaptureSuccess?: () => void
}

// Simple CSS Pokeball for throwing animation visual
const ThrownPokeball = ({ isShaking }: { isShaking?: boolean }) => (
    <div
        className={`
      w-12 h-12 sm:w-16 sm:h-16 rounded-full border-2 border-black overflow-hidden
      relative transition-all duration-500 ease-out
      ${isShaking ? "animate-pokeball-shake" : ""}
    `}
        style={{
            boxShadow: "inset 0 -2px 0px 1px rgba(0,0,0,0.3)", // Classic inner shadow
        }}
    >
        <div className="absolute top-0 left-0 w-full h-1/2 bg-red-500"></div>
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-white"></div>
        <div className="absolute top-1/2 left-0 w-full h-2 sm:h-2.5 bg-black transform -translate-y-1/2 z-10"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-5 h-5 sm:w-6 sm:h-6 bg-white rounded-full border-2 border-black z-20">
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-gray-200 rounded-full border border-black"></div>
        </div>
    </div>
);


export function CameraCapture({ onCaptureSuccess }: CameraCaptureProps) {
    const webcamRef = useRef<Webcam>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [capturing, setCapturing] = useState(false)
    const [pokemonData, setPokemonData] = useState<PokemonStats | null>(null)
    const [selectedImage, setSelectedImage] = useState<string | null>(null)

    // State for throwing animation visual
    const [pokeballAnimating, setPokeballAnimating] = useState(false);
    const [isShaking, setIsShaking] = useState(false);
    const [pokeballPosition, setPokeballPosition] = useState({
        top: "110%",
        left: "50%",
        scale: 0.3,
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


    // Separate function for the actual core analysis and save logic
    const performActualAnalysisAndSave = useCallback(async () => {
        try {
            let imageSrc: string | null = null;

            if (selectedImage) {
                imageSrc = selectedImage;
            } else if (webcamRef.current) {
                imageSrc = webcamRef.current.getScreenshot();
                if (!imageSrc && selectedImage) {
                    imageSrc = selectedImage;
                } else if (!imageSrc) {
                    toast.error('No image source available for capture.');
                    setCapturing(false); // Stop loading state
                    return;
                }
            } else {
                toast.error('No image source available for capture.');
                setCapturing(false); // Stop loading state
                return;
            }

            const { data: sessionData } = await supabase.auth.getSession()
            const userId = sessionData.session?.user.id
            if (!userId) throw new Error('User not authenticated')

            const timestamp = new Date().getTime()
            const filePath = `${userId}/${timestamp}.jpg`

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('pokemon-images')
                .upload(filePath, base64ToBlob(imageSrc), {
                    contentType: 'image/jpeg',
                    cacheControl: '3600'
                })

            if (uploadError) throw uploadError

            const response = await fetch('/api/pokemon', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: imageSrc })
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Failed to analyze image (status ${response.status})`);
            }

            const data = await response.json();
            setPokemonData(data);

            const { error: dbError } = await supabase
                .from('captured_pokemon')
                .insert([
                    {
                        user_id: userId,
                        image_path: filePath,
                        stats: data,
                        captured_at: new Date().toISOString()
                    }
                ]);

            if (dbError) throw dbError;

            // Get all caught pokemon to calculate new stats
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

            // Calculate and update stats
            const newStats = calculateTrainerStats(captured);
            const { error: statsError } = await supabase
                .from('trainers')
                .update({ stats: newStats })
                .eq('user_id', userId);

            if (statsError) {
                console.error('Error updating stats:', statsError);
            }

            setSelectedImage(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }

            onCaptureSuccess?.();
            toast.success('Pokemon captured successfully!');

        } catch (error) {
            console.error('Error capturing Pokemon:', error);
            toast.error('Failed to capture Pokemon', {
                description: error instanceof Error ? error.message : 'Unknown error occurred'
            });
            setPokemonData(null);
        } finally {
            setCapturing(false); // Ensure capturing state is reset
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedImage, onCaptureSuccess, webcamRef, fileInputRef]);


    // Function to trigger the animation sequence before calling analysis
    const triggerCaptureFlow = useCallback(() => {
        // Check if a source is available before starting animation
        if (!selectedImage && !webcamRef.current) {
            toast.info('Aim with the webcam or select an image first!');
            return;
        }

        // Prevent triggering if already in capture process
        if (capturing || pokeballAnimating || isShaking) {
            return;
        }

        setPokeballAnimating(true);
        setIsShaking(false);
        setPokeballPosition({ top: "110%", left: "50%", scale: 0.3 }); // Start pos

        // Throw animation
        setTimeout(() => {
            setPokeballPosition({ top: "50%", left: "50%", scale: 1 }); // End pos
        }, 50);

        // After throw
        setTimeout(() => {
            setIsShaking(true); // Start shaking
            // After shake
            setTimeout(() => {
                setIsShaking(false); // Stop shaking
                setPokeballAnimating(false); // Hide thrown pokeball
                setCapturing(true); // Start original capturing state
                performActualAnalysisAndSave(); // Proceed with analysis and save
            }, 1800); // Shake duration (adjust if CSS changes)
        }, 550); // Throw duration + buffer (adjust if CSS changes)

    }, [selectedImage, webcamRef, capturing, pokeballAnimating, isShaking, performActualAnalysisAndSave]); // Include states and core logic function as deps


    const resetState = () => {
        setSelectedImage(null);
        setPokemonData(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        // Reset animation states
        setPokeballAnimating(false);
        setIsShaking(false);
        setPokeballPosition({ top: "110%", left: "50%", scale: 0.3 });
        setCapturing(false); // Ensure capturing is off
    };


    return (
        // Pokédex Body Wrapper - takes full width up to lg, centered, basic padding
        <div className="w-screen h-full mx-auto font-mono">
            {/* Kanto Pokedex Outer Frame (Dark Red) */}
            <div className="w-full h-[97vh] bg-red-700 shadow-lg border-red-900">
                {/* Top Decorative Lights */}
                <div className="flex items-center mb-1.5 sm:mb-2 px-1">
                    <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 bg-sky-400 rounded-full border-2 border-sky-600 shadow-sm"></div>
                    <div className="ml-1.5 flex gap-1 sm:gap-1.5">
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-red-400 rounded-full border border-red-600"></div>
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-yellow-400 rounded-full border border-yellow-600"></div>
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full border border-green-700"></div>
                    </div>
                </div>

                {/* Main Content Area (Screen + Controls) - uses flex for side-by-side on md+ */}
                <div className="flex w-full h-full flex-col md:flex-row justify-around">
                    {/* Left Panel: Screen Area (Gray Bezel) */}
                    <div className="flex-grow w-full h-full md:w-3/5 bg-gray-700rounded border-2 border-gray-800 shadow-inner">
                        {/* Classic Green LCD Screen */}
                        <div className="bg-gray-950 w-full h-full rounded-sm overflow-hidden border-2 border-lime-500 relative flex items-center justify-center">

                            {/* Webcam Feed or Selected Image */}
                            {!pokemonData && ( // Only show feed/image if no pokemon data is displayed
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
                                            // aspectRatio: 9 / 16, // 4:3 for desktops, 16:9 for mobile
                                        }}
                                        className=" object-contain"
                                        mirrored={false}
                                        audio={false}
                                        onUserMediaError={(e) => console.error("Webcam Error:", e)} // Log errors
                                    />
                                )
                            )}


                            {/* Thrown Pokeball Animation Overlay */}
                            {pokeballAnimating && (
                                <div
                                    style={{
                                        position: "absolute",
                                        top: pokeballPosition.top,
                                        left: pokeballPosition.left,
                                        transform: `translate(-50%, -50%) scale(${pokeballPosition.scale})`,
                                        transition:
                                            "top 0.5s ease-out, left 0.5s ease-out, transform 0.5s ease-out",
                                    }}
                                    className="z-20" // Ensure Pokeball is above feed
                                >
                                    <ThrownPokeball isShaking={isShaking} />
                                </div>
                            )}

                            {/* Capturing/Analyzing Overlay (Original Loader) */}
                            {capturing && ( // Uses your original capturing state
                                // Dark overlay with your Loader
                                <div className="absolute inset-0 bg-black/70 backdrop-blur-xs flex flex-col items-center justify-center z-30">
                                    <Loader /> {/* Your spinning Loader */}
                                    <p className="text-white mt-3 text-center text-xs sm:text-sm font-mono uppercase tracking-wider">
                                        Analyzing...
                                    </p>
                                </div>
                            )}


                            {/* Pokemon Data Display (when captured) */}
                            {pokemonData && (
                                <div className="p-2 sm:p-3 space-y-2 text-xs h-full overflow-y-auto bg-lime-200 text-black font-mono absolute inset-0"> {/* Position absolutely over the screen */}
                                    <h3 className="text-base sm:text-lg font-bold text-center uppercase tracking-wider">
                                        {pokemonData.currentForm.name} (Lv.{" "}
                                        {pokemonData.currentForm.level})
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

                    {/* Right Panel: Controls (Slightly Lighter Red) */}
                    <div className="md:w-2/5 flex flex-col justify- items-center space-y-2 p-1.5 sm:p-2 bg-red-600 rounded border-2 border-red-800">

                        <div className="flex items-center gap-2 w-full"> {/* New flex container */}
                            {pokemonData === null ? (
                                // Throw Pokeball Button - wrapped in a div for flex control
                                <div className="flex-grow flex justify-center"> {/* Center the pokeball */}
                                    <button
                                        onClick={triggerCaptureFlow}
                                        // Uses YOUR original disabled logic
                                        disabled={capturing}
                                        className="
                                            relative
                                            h-16 w-16 sm:h-20 sm:w-20 {/* Ensure equal height and width */}
                                            rounded-full border-4 border-black overflow-hidden
                                            bg-white flex items-center justify-center
                                            transform transition-transform duration-100 active:scale-95
                                            disabled:opacity-60 disabled:pointer-events-none
                                            shadow-md
                                        "
                                    >
                                        {/* Top Red Half */}
                                        <div className="absolute top-0 left-0 w-full h-1/2 bg-red-500"></div>
                                        {/* Bottom White Half */}
                                        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-white"></div>
                                        {/* Central Black Band */}
                                        <div className="absolute top-1/2 left-0 w-full h-3 sm:h-4 bg-black transform -translate-y-1/2 z-10"></div>
                                        {/* Central Button */}
                                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-full border-4 border-black z-20 flex items-center justify-center">
                                            {/* Inner gray button */}
                                            <div className="w-4 h-4 sm:w-5 sm:h-5 bg-gray-300 rounded-full border-2 border-black"></div>
                                        </div>
                                        {/* Text label (optional, position carefully or remove) */}
                                        {/* <span className="absolute bottom-2 text-[10px] sm:text-xs font-bold text-black z-30 uppercase">THROW</span> */}
                                    </button>
                                </div>
                            ) : (
                                // Reset button shown after capture or failure (no change)
                                // This will still take w-full within the flex container
                                <Button
                                    onClick={resetState}
                                    className="flex-grow bg-blue-500 hover:bg-blue-600 text-white font-bold py-1.5 sm:py-2 px-3 sm:px-4 rounded-md border-b-4 border-blue-700 hover:border-blue-600 active:border-b-0 active:mt-0.5 text-xs sm:text-sm uppercase tracking-wider"
                                >
                                    <RotateCcw className="mr-1.5 h-4 w-4 sm:h-5 sm:w-5" />
                                    Next Target
                                </Button>
                            )}

                            {/* File input button beside the Pokeball */}
                            {/* Original disabled logic retained */}
                            {pokemonData === null && ( // Only show file select button when not showing captured data
                                <Button
                                    variant="outline"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={capturing || pokeballAnimating || isShaking}
                                    className="
                                         bg-yellow-400 hover:bg-yellow-500 text-black font-semibold
                                         rounded-md border-b-4 border-yellow-600 hover:border-yellow-500 active:border-b-0 active:mt-0.5
                                         disabled:opacity-60 disabled:pointer-events-none
                                         text-xs sm:text-sm uppercase tracking-wider
                                         w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center {/* Make it a small square */}
                                         p-0 {/* Remove padding */}
                                     "
                                >
                                    {/* <Upload className="h-4 w-4" /> Remove icon */}
                                    + {/* Use plus sign as text */}
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
    )
}
