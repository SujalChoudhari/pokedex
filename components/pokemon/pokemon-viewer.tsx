"use client"

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader } from '@/components/ui/loader'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import type { PokemonStats } from '@/lib/types'

interface PokemonViewerProps {
    stats: PokemonStats
    imagePath: string
    open: boolean
    onOpenChange: (open: boolean) => void
    pokemonId: string
    onPokemonRelease?: () => void
}

export function PokemonViewer({
    imagePath,
    stats,
    open,
    onOpenChange,
    pokemonId,
    onPokemonRelease,
}: PokemonViewerProps) {
    const [imageUrl, setImageUrl] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isReleasing, setIsReleasing] = useState(false)
    const [activeTab, setActiveTab] = useState<'stats' | 'moves' | 'evolution'>('stats')

    useEffect(() => {
        const fetchImageUrl = async () => {
            if (!open) return

            try {
                const cachedUrl = localStorage.getItem(`pokemon-image-${imagePath}`)
                if (cachedUrl) {
                    setImageUrl(cachedUrl)
                    setIsLoading(false)
                    return
                }

                const { data } = await supabase.storage
                    .from('pokemon-images')
                    .createSignedUrl(imagePath, 3600)

                if (data?.signedUrl) {
                    localStorage.setItem(`pokemon-image-${imagePath}`, data.signedUrl)
                    setImageUrl(data.signedUrl)
                }
            } catch (error) {
                console.error('Error fetching image:', error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchImageUrl()
    }, [imagePath, open])

    const handleReleasePokemon = async () => {
        if (!pokemonId) {
            toast.error('Cannot release: Invalid Pokemon ID');
            return;
        }

        if (!confirm(`Are you sure you want to release ${stats.currentForm.name}? This action cannot be undone.`)) {
            return;
        }

        setIsReleasing(true);
        try {
            // First, delete the image from storage to maintain referential integrity
            const { error: storageError } = await supabase.storage
                .from('pokemon-images')
                .remove([imagePath]);

            if (storageError) {
                console.error('Storage error:', storageError);
                throw new Error('Failed to delete Pokemon image');
            }

            // Then delete the database entry
            const { error: dbError } = await supabase
                .from('captured_pokemon')
                .delete()
                .match({ id: pokemonId });

            if (dbError) {
                console.error('Database error:', dbError);
                throw new Error('Failed to delete Pokemon data');
            }

            // Clean up local storage
            localStorage.removeItem(`pokemon-image-${imagePath}`);

            toast.success(`${stats.currentForm.name} was released back into the wild!`);
            onOpenChange(false);
            onPokemonRelease?.();

        } catch (error) {
            console.error('Error releasing pokemon:', error);
            toast.error('Failed to release Pokémon');
        } finally {
            setIsReleasing(false);
        }
    };

    const renderStatBar = (value: number) => {
        const percentage = (value / 255) * 100;
        return (
            <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                />
            </div>
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-red-600 border-4 border-gray-800 p-0">
                {/* Top Bar with LED Lights and Release Button */}
                <div className="flex items-center justify-between p-3 border-b-4 border-gray-800">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-blue-400 border-2 border-white animate-pulse shadow-lg"></div>
                        <div className="flex gap-1">
                            <div className="w-2 h-2 rounded-full bg-red-400 border border-red-600"></div>
                            <div className="w-2 h-2 rounded-full bg-yellow-400 border border-yellow-600"></div>
                            <div className="w-2 h-2 rounded-full bg-green-500 border border-green-700"></div>
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-red-500">
                    {/* Pokemon Name and Basic Info */}
                    <div className="bg-gray-800 rounded-lg p-3 mb-4 text-white">
                        <div className="flex justify-between items-start mb-2">
                            <h2 className="text-2xl font-bold uppercase">{stats.currentForm.name}</h2>
                            <p className="text-sm bg-red-500 px-2 py-1 rounded">Lv.{stats.currentForm.level}</p>
                        </div>
                        <div className="flex gap-2">
                            {stats.currentForm.types.map((type) => (
                                <span
                                    key={type}
                                    className={`px-2 py-1 rounded text-xs font-bold uppercase ${{
                                        Grass: 'bg-green-500',
                                        Fire: 'bg-red-500',
                                        Water: 'bg-blue-500',
                                        Electric: 'bg-yellow-500',
                                        Ice: 'bg-cyan-400',
                                        Fighting: 'bg-orange-600',
                                        Poison: 'bg-purple-500',
                                        Ground: 'bg-yellow-700',
                                        Flying: 'bg-indigo-400',
                                        Psychic: 'bg-pink-500',
                                        Bug: 'bg-green-600',
                                        Rock: 'bg-gray-600',
                                        Ghost: 'bg-indigo-700',
                                        Dragon: 'bg-purple-700',
                                        Dark: 'bg-gray-950',
                                        Steel: 'bg-gray-400',
                                        Fairy: 'bg-pink-300',
                                        Normal: 'bg-gray-300',
                                    }[type] || 'bg-gray-500'
                                        }`}
                                >
                                    {type}
                                </span>
                            ))}
                        </div>
                        <div className='mt-4'>
                            <h3 className="text-sm font-bold mb-2 text-gray-400 uppercase">Abilities</h3>
                            <div className="grid grid-cols-2 gap-2">
                                {stats.currentForm.abilities.map((ability) => (
                                    <div key={ability} className="bg-gray-700 rounded p-2 text-sm">
                                        {ability}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="flex justify-between mt-2 text-sm">
                            <div>Height: {stats.height ? stats.height : "0 in" }</div>
                            <div>Weight: {stats.weight ? stats.weight : "0 lbs" }</div>
                        </div>
                    </div>

                    <div className="grid md:grid-rows-2 gap-4">
                        {/* Left Column - Image */}
                        <div className="bg-gray-800 rounded-lg p-3">
                            <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-900">
                                {isLoading ? (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Loader className="text-white" />
                                    </div>
                                ) : imageUrl ? (
                                    <Image
                                        src={imageUrl}
                                        alt={stats.currentForm.name}
                                        fill
                                        className="object-contain p-2"
                                    />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <p className="text-sm text-gray-400">Failed to load image</p>
                                    </div>
                                )}
                            </div>
                            <p className="mt-3 text-sm text-gray-300 leading-relaxed">
                                {stats.currentForm.description}
                            </p>
                        </div>

                        {/* Right Column - Tabs Content */}
                        <div className="bg-gray-800 rounded-lg overflow-hidden">
                            {/* Tab Buttons */}
                            <div className="flex border-b border-gray-700">
                                <button
                                    onClick={() => setActiveTab('stats')}
                                    className={`flex-1 px-4 py-2 text-sm font-medium ${activeTab === 'stats'
                                        ? 'bg-red-600 text-white'
                                        : 'text-gray-400 hover:text-white hover:bg-gray-700'
                                        }`}
                                >
                                    Stats
                                </button>
                                <button
                                    onClick={() => setActiveTab('moves')}
                                    className={`flex-1 px-4 py-2 text-sm font-medium ${activeTab === 'moves'
                                        ? 'bg-red-600 text-white'
                                        : 'text-gray-400 hover:text-white hover:bg-gray-700'
                                        }`}
                                >
                                    Moves
                                </button>
                                <button
                                    onClick={() => setActiveTab('evolution')}
                                    className={`flex-1 px-4 py-2 text-sm font-medium ${activeTab === 'evolution'
                                        ? 'bg-red-600 text-white'
                                        : 'text-gray-400 hover:text-white hover:bg-gray-700'
                                        }`}
                                >
                                    Evolution
                                </button>
                            </div>

                            {/* Tab Content */}
                            <div className="p-4 text-white">


                                {activeTab === 'stats' && (
                                    <div className="space-y-3">
                                        <div>
                                            <div className="flex justify-between mb-1">
                                                <span className="text-sm">HP</span>
                                                <span className="text-sm">{stats.currentForm.baseStats.hp}</span>
                                            </div>
                                            {renderStatBar(stats.currentForm.baseStats.hp)}
                                        </div>
                                        <div>
                                            <div className="flex justify-between mb-1">
                                                <span className="text-sm">Attack</span>
                                                <span className="text-sm">{stats.currentForm.baseStats.attack}</span>
                                            </div>
                                            {renderStatBar(stats.currentForm.baseStats.attack)}
                                        </div>
                                        <div>
                                            <div className="flex justify-between mb-1">
                                                <span className="text-sm">Defense</span>
                                                <span className="text-sm">{stats.currentForm.baseStats.defense}</span>
                                            </div>
                                            {renderStatBar(stats.currentForm.baseStats.defense)}
                                        </div>
                                        <div>
                                            <div className="flex justify-between mb-1">
                                                <span className="text-sm">Sp. Attack</span>
                                                <span className="text-sm">{stats.currentForm.baseStats.specialAttack}</span>
                                            </div>
                                            {renderStatBar(stats.currentForm.baseStats.specialAttack)}
                                        </div>
                                        <div>
                                            <div className="flex justify-between mb-1">
                                                <span className="text-sm">Sp. Defense</span>
                                                <span className="text-sm">{stats.currentForm.baseStats.specialDefense}</span>
                                            </div>
                                            {renderStatBar(stats.currentForm.baseStats.specialDefense)}
                                        </div>
                                        <div>
                                            <div className="flex justify-between mb-1">
                                                <span className="text-sm">Speed</span>
                                                <span className="text-sm">{stats.currentForm.baseStats.speed}</span>
                                            </div>
                                            {renderStatBar(stats.currentForm.baseStats.speed)}
                                        </div>

                                        <div className="flex justify-between mt-8">
                                            <span className="text-sm font-bold">Danger Zone</span>
                                        </div>
                                        <Button
                                            onClick={handleReleasePokemon}
                                            disabled={isReleasing}
                                            variant="outline"
                                            className="bg-red-700 hover:bg-red-800 text-white text-xs border-2 border-gray-800 min-w-[120px]"
                                        >
                                            {isReleasing ? (
                                                <div className="flex items-center gap-2">
                                                    <Loader className="w-3 h-3" />
                                                    <span>Releasing...</span>
                                                </div>
                                            ) : (
                                                'Release Pokémon'
                                            )}
                                        </Button>
                                    </div>
                                )}

                                {activeTab === 'moves' && (
                                    <div className="grid grid-cols-2 gap-2">
                                        {stats.currentForm.moves.map((move) => (
                                            <div
                                                key={move}
                                                className="bg-gray-700 rounded p-2 text-sm hover:bg-gray-600 transition-colors"
                                            >
                                                {move}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {activeTab === 'evolution' && (
                                    <div className="space-y-4">
                                        <div className="relative">
                                            {/* Evolution Chain Visualization */}
                                            <div className="flex flex-col items-center gap-6">
                                                {/* Current Form */}
                                                <div className="text-center">
                                                    <div className="bg-gray-700 rounded-lg p-2 mb-2">
                                                        <p className="font-bold">{stats.evolutionChain.current.name}</p>
                                                        <p className="text-xs text-gray-400">Current Form</p>
                                                    </div>
                                                </div>

                                                {/* Arrow */}
                                                <div className="relative">
                                                    <div className="w-0.5 h-12 bg-red-500 mx-auto"></div>
                                                    <div className="absolute -right-6 top-1/2 transform -translate-y-1/2 text-xs">
                                                        Lv.{stats.evolutionChain.nextEvolution.evolutionLevel}
                                                    </div>
                                                </div>

                                                {/* Next Evolution */}
                                                <div className="text-center">
                                                    <div className="bg-gray-700 rounded-lg p-2 mb-2">
                                                        <p className="font-bold">{stats.evolutionChain.nextEvolution.name}</p>
                                                        <p className="text-xs text-gray-400">Next Form</p>
                                                    </div>
                                                </div>

                                                {/* Arrow */}
                                                <div className="relative">
                                                    <div className="w-0.5 h-12 bg-red-500 mx-auto"></div>
                                                    <div className="absolute -right-6 top-1/2 transform -translate-y-1/2 text-xs">
                                                        Lv.{stats.evolutionChain.finalEvolution!.evolutionLevel}
                                                    </div>
                                                </div>

                                                {/* Final Evolution */}
                                                <div className="text-center">
                                                    <div className="bg-gray-700 rounded-lg p-2">
                                                        <p className="font-bold">{stats.evolutionChain.finalEvolution!.name}</p>
                                                        <p className="text-xs text-gray-400">Final Form</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Evolution Details */}
                                            <div className="mt-4 space-y-3">
                                                <div className="bg-gray-700 rounded-lg p-3">
                                                    <h4 className="font-bold mb-1 text-sm">Next Evolution Details</h4>
                                                    <p className="text-sm text-gray-300">{stats.evolutionChain.nextEvolution!.description}</p>
                                                    <div className="mt-2">
                                                        <h5 className="text-xs font-bold text-gray-400 mb-1">Learns:</h5>
                                                        <div className="flex flex-wrap gap-1">
                                                            {stats.evolutionChain.nextEvolution.moves.map((move) => (
                                                                <span key={move} className="text-xs bg-gray-600 rounded px-2 py-1">
                                                                    {move}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="bg-gray-700 rounded-lg p-3">
                                                    <h4 className="font-bold mb-1 text-sm">Final Evolution Details</h4>
                                                    <p className="text-sm text-gray-300">{stats.evolutionChain.finalEvolution.description}</p>
                                                    <div className="mt-2">
                                                        <h5 className="text-xs font-bold text-gray-400 mb-1">Learns:</h5>
                                                        <div className="flex flex-wrap gap-1">
                                                            {stats.evolutionChain.finalEvolution.moves.map((move) => (
                                                                <span key={move} className="text-xs bg-gray-600 rounded px-2 py-1">
                                                                    {move}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
