"use client"

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader } from '@/components/ui/loader'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import type { PokemonStats } from '@/lib/types'
import { motion, AnimatePresence } from 'framer-motion'
import { DialogTitle } from '@radix-ui/react-dialog'

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
            toast.error('Cannot release: Invalid Pokemon ID')
            return
        }

        if (!confirm(`Are you sure you want to release ${stats.currentForm.name}? This action cannot be undone.`)) {
            return
        }

        setIsReleasing(true)
        try {
            const { error: storageError } = await supabase.storage
                .from('pokemon-images')
                .remove([imagePath])

            if (storageError) throw storageError

            const { error: dbError } = await supabase
                .from('captured_pokemon')
                .delete()
                .match({ id: pokemonId })

            if (dbError) throw dbError

            localStorage.removeItem(`pokemon-image-${imagePath}`)

            toast.success(`${stats.currentForm.name} was released back into the wild!`)
            onOpenChange(false)
            onPokemonRelease?.()

        } catch (error) {
            console.error('Error releasing pokemon:', error)
            toast.error('Failed to release Pokémon')
        } finally {
            setIsReleasing(false)
        }
    }

    const getTypeColor = (type: string) => {
        const colors = {
            fire: 'bg-red-500',
            water: 'bg-blue-500',
            grass: 'bg-green-500',
            electric: 'bg-yellow-400',
            ice: 'bg-cyan-400',
            fighting: 'bg-orange-700',
            poison: 'bg-purple-500',
            ground: 'bg-amber-700',
            flying: 'bg-indigo-400',
            psychic: 'bg-pink-500',
            bug: 'bg-lime-500',
            rock: 'bg-stone-500',
            ghost: 'bg-violet-600',
            dragon: 'bg-violet-500',
            dark: 'bg-gray-950',
            steel: 'bg-slate-400',
            fairy: 'bg-pink-400',
            normal: 'bg-gray-400'
        }
        return colors[type.toLowerCase() as keyof typeof colors] || 'bg-gray-500'
    }

    const renderStatBar = (value: number, color: string = 'bg-blue-500') => {
        const percentage = (value / 255) * 100
        return (
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <motion.div
                    className={`h-full ${color}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                />
            </div>
        )
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-gradient-to-b from-red-600 to-red-700 border-4 border-gray-800 p-0">
                {/* Top Bar with LED Lights */}
                <motion.div
                    className="flex items-center justify-between p-4 border-b-4 border-gray-800"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full bg-blue-400 border-2 border-blue-600 animate-pulse shadow-lg"></div>
                        <div className="flex gap-2">
                            <div className="w-2 h-2 rounded-full bg-red-400 border border-red-600"></div>
                            <div className="w-2 h-2 rounded-full bg-yellow-400 border border-yellow-600"></div>
                            <div className="w-2 h-2 rounded-full bg-green-500 border border-green-700"></div>
                        </div>
                    </div>
                    <DialogTitle className="text-white font-bold tracking-wider uppercase">Pokémon Data</DialogTitle>
                </motion.div>

                <div className="p-4 space-y-4">
                    {/* Pokemon Info Header */}
                    <motion.div
                        className="bg-gray-800 rounded-lg p-4 text-white"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div className="flex justify-between items-start mb-3">
                            <motion.h2
                                className="text-2xl font-bold uppercase"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                            >
                                {stats.currentForm.name}
                            </motion.h2>
                            <motion.p
                                className="text-sm bg-red-500 px-3 py-1 rounded-full"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                            >
                                Lv.{stats.currentForm.level}
                            </motion.p>
                        </div>
                        <motion.div
                            className="flex gap-2"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            {stats.currentForm.types.map((type, index) => (
                                <motion.span
                                    key={type}
                                    className={`px-3 py-1 rounded text-white text-sm font-bold uppercase ${getTypeColor(type)}`}
                                    initial={{ opacity: 0, scale: 0 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.3 + index * 0.1 }}
                                >
                                    {type}
                                </motion.span>
                            ))}

                        </motion.div>
                        {stats.height && stats.weight && (
                            <motion.div
                                className="flex justify-between mt-4 gap-4 text-sm"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                <div>
                                    <span className="font-bold">Height:</span> {stats.height}
                                </div>
                                <div>
                                    <span className="font-bold">Weight:</span> {stats.weight}
                                </div>
                            </motion.div>
                        )}
                    </motion.div>

                    {/* Main Content Grid */}
                    <div className="grid md:grid-cols-2 gap-4">
                        {/* Left Column - Image and Description */}
                        <motion.div
                            className="bg-gray-800 rounded-lg overflow-hidden"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 }}
                        >
                            <div className="aspect-square relative bg-gray-900">
                                {isLoading ? (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Loader className="text-white" />
                                    </div>
                                ) : imageUrl ? (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ duration: 0.5 }}
                                        className="w-full h-full"
                                    >
                                        <Image
                                            src={imageUrl}
                                            alt={stats.currentForm.name}
                                            fill
                                            className="object-contain p-4"
                                        />
                                    </motion.div>
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <p className="text-gray-400">Failed to load image</p>
                                    </div>
                                )}
                            </div>
                            <motion.div
                                className="p-4 text-white"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                            >
                                <p className="text-sm leading-relaxed">{stats.currentForm.description}</p>
                            </motion.div>
                        </motion.div>

                        {/* Right Column - Tabs */}
                        <motion.div
                            className="bg-gray-800 rounded-lg overflow-hidden"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 }}
                        >
                            {/* Tab Buttons */}
                            <div className="flex border-b border-gray-700">
                                {['stats', 'moves', 'evolution'].map((tab) => (
                                    <motion.button
                                        key={tab}
                                        onClick={() => setActiveTab(tab as typeof activeTab)}
                                        className={`
                                            flex-1 px-4 py-3 text-sm font-medium uppercase tracking-wider
                                            ${activeTab === tab
                                                ? 'bg-red-600 text-white'
                                                : 'text-gray-400 hover:text-white hover:bg-gray-700'
                                            }
                                        `}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        {tab}
                                    </motion.button>
                                ))}
                            </div>

                            {/* Tab Content */}
                            <div className="p-4">
                                <AnimatePresence mode="wait">
                                    {activeTab === 'stats' && (
                                        <motion.div
                                            key="stats"
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -20 }}
                                            className="space-y-4 text-white"
                                        >
                                            {Object.entries(stats.currentForm.baseStats).map(([stat, value], index) => (
                                                <motion.div
                                                    key={stat}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: index * 0.1 }}
                                                >
                                                    <div className="flex justify-between mb-1">
                                                        <span className="text-sm capitalize">{stat.replace(/([A-Z])/g, ' $1').trim()}</span>
                                                        <span className="text-sm font-bold">{value}</span>
                                                    </div>
                                                    {renderStatBar(value, `bg-${['red', 'orange', 'yellow', 'green', 'blue', 'purple'][index]}-500`)}
                                                </motion.div>
                                            ))}

                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: 0.6 }}
                                                className="pt-4 mt-4 border-t border-gray-700"
                                            >
                                                <Button
                                                    onClick={handleReleasePokemon}
                                                    disabled={isReleasing}
                                                    className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2 rounded-lg border-2 border-red-700"
                                                >
                                                    {isReleasing ? (
                                                        <div className="flex items-center gap-2">
                                                            <Loader className="w-4 h-4" />
                                                            <span>Releasing...</span>
                                                        </div>
                                                    ) : (
                                                        'Release Pokémon'
                                                    )}
                                                </Button>
                                            </motion.div>
                                        </motion.div>
                                    )}

                                    {activeTab === 'moves' && (
                                        <motion.div
                                            key="moves"
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -20 }}
                                            className="grid grid-cols-2 gap-2"
                                        >
                                            {stats.currentForm.moves.map((move, index) => (
                                                <motion.div
                                                    key={move}
                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    transition={{ delay: index * 0.1 }}
                                                    className="bg-gray-700 rounded-lg p-3 text-white text-sm hover:bg-gray-600 transition-colors"
                                                >
                                                    {move}
                                                </motion.div>
                                            ))}
                                        </motion.div>
                                    )}

                                    {activeTab === 'evolution' && (
                                        <motion.div
                                            key="evolution"
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -20 }}
                                            className="text-white"
                                        >
                                            <div className="flex flex-col items-center gap-4">
                                                {/* Evolution Chain */}
                                                <motion.div
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="bg-gray-700 rounded-lg p-3 w-full text-center"
                                                >
                                                    <p className="font-bold">{stats.evolutionChain.current.name}</p>
                                                    <p className="text-sm text-gray-400">Current Form</p>
                                                </motion.div>

                                                {stats.evolutionChain.nextEvolution && (
                                                    <>
                                                        <motion.div
                                                            initial={{ scale: 0 }}
                                                            animate={{ scale: 1 }}
                                                            className="w-0.5 h-8 bg-red-500"
                                                        />
                                                        <motion.div
                                                            initial={{ opacity: 0, y: 20 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            transition={{ delay: 0.2 }}
                                                            className="bg-gray-700 rounded-lg p-3 w-full text-center"
                                                        >
                                                            <p className="font-bold">{stats.evolutionChain.nextEvolution.name}</p>
                                                            <p className="text-sm text-gray-400">
                                                                Evolves at Lv. {stats.evolutionChain.nextEvolution.evolutionLevel}
                                                            </p>
                                                        </motion.div>
                                                    </>
                                                )}

                                                {stats.evolutionChain.finalEvolution && (
                                                    <>
                                                        <motion.div
                                                            initial={{ scale: 0 }}
                                                            animate={{ scale: 1 }}
                                                            transition={{ delay: 0.3 }}
                                                            className="w-0.5 h-8 bg-red-500"
                                                        />
                                                        <motion.div
                                                            initial={{ opacity: 0, y: 20 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            transition={{ delay: 0.4 }}
                                                            className="bg-gray-700 rounded-lg p-3 w-full text-center"
                                                        >
                                                            <p className="font-bold">{stats.evolutionChain.finalEvolution.name}</p>
                                                            <p className="text-sm text-gray-400">
                                                                Evolves at Lv. {stats.evolutionChain.finalEvolution.evolutionLevel}
                                                            </p>
                                                        </motion.div>
                                                    </>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
