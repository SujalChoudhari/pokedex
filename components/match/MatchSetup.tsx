"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { PokemonStats } from '@/lib/types';
import { ChevronLeft, MoveLeft } from 'lucide-react';
import Link from 'next/link';

interface MatchSetupProps {
    player1Team: PokemonStats[] | null;
    onMatchStart: (player2Name: string) => void;
}

export function MatchSetup({ player1Team, onMatchStart }: MatchSetupProps) {
    const [player2Name, setPlayer2Name] = useState('');

    const handleStartMatch = () => {
        if (player2Name) {
            onMatchStart(player2Name);
        } else {
            alert('Please enter Player 2\'s name.');
        }
    };

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-red-600 text-white p-4 rounded-lg shadow-lg border-4 border-gray-800">
            {/* Decorative Circles for Pokedex Background */}
            <Link href="/dashboard" className='absolute top-4 left-4 w-8 h-8'>
                <div className=" bg-sky-400 rounded-full border-4 border-sky-600 shadow-lg"><ChevronLeft /> </div>
            </Link>
            <div className="absolute top-6 left-16 flex gap-2">
                <div className="w-4 h-4 bg-red-400 rounded-full border-2 border-red-600"></div>
                <div className="w-4 h-4 bg-yellow-400 rounded-full border-2 border-yellow-600"></div>
                <div className="w-4 h-4 bg-green-500 rounded-full border-2 border-green-700"></div>
            </div>
            <h1 className="text-4xl font-bold mb-6 text-white-300">Find Matches</h1>

            {player1Team && player1Team.length > 0 ? (
                <div className="mb-6 w-full max-w-md bg-gray-800 p-4 rounded-lg shadow-inner">
                    <h2 className="text-2xl font-semibold mb-4 text-yellow-200">Your Team:</h2>
                    <div className="grid grid-cols-3 gap-4">
                        {player1Team.map((pokemon, index) => (
                            <div key={index} className="flex flex-col items-center bg-gray-700 p-2 rounded-lg">
                                <img
                                    src={`https://ukmcvfbydqejwaqkdjlj.supabase.co/storage/v1/object/public/pokemon-images/${pokemon.image_path}`}
                                    alt={pokemon.currentForm.name}
                                    className="w-20 h-20 object-contain border-2 border-yellow-300 rounded"
                                />
                                <p className="mt-2 text-yellow-100">{pokemon.currentForm.name}</p>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <p className="text-yellow-100">Loading your team...</p>
            )}

            <div className="space-y-4 w-full max-w-md">
                <div>
                    <label className="block text-sm font-medium text-yellow-200">Player 2 Name:</label>
                    <Input
                        type="text"
                        value={player2Name}
                        onChange={(e) => setPlayer2Name(e.target.value)}
                        className="mt-1 p-2 w-full bg-gray-700 border border-yellow-300 rounded-md text-white"
                    />
                </div>
            </div>
            <Button
                onClick={handleStartMatch}
                className="mt-6 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-2 px-4 rounded-lg shadow-md"
            >
                Start Match
            </Button>
        </div>
    );
}
