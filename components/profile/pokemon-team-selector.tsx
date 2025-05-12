"use client"

import { PokemonCard } from '@/components/pokemon/pokemon-card'
import { PokemonViewer } from '@/components/pokemon/pokemon-viewer'
import { Loader } from '@/components/ui/loader'
import { supabase } from '@/lib/supabase'
import type { CapturedPokemon, TrainerProfile } from '@/lib/trainer-types'
import { AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Plus, Minus, ArrowUp, ArrowDown, Archive } from 'lucide-react'


interface PokemonTeamSelectorProps {
    profile: TrainerProfile
    onTeamUpdate: (newTeam: string[]) => void
}

export function PokemonTeamSelector({ profile, onTeamUpdate }: PokemonTeamSelectorProps) {
    const [allPokemon, setAllPokemon] = useState<CapturedPokemon[]>([])
    const [teamPokemon, setTeamPokemon] = useState<CapturedPokemon[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedPokemon, setSelectedPokemon] = useState<CapturedPokemon | null>(null)
    const [viewerOpen, setViewerOpen] = useState(false)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (profile) {
            const teamIds = profile.team || []
            const captured = profile.captured_pokemon || []

            // Separate team and non-team Pokemon
            const team = captured.filter(p => teamIds.includes(p.id))
            const nonTeam = captured.filter(p => !teamIds.includes(p.id))

            setTeamPokemon(team)
            setAllPokemon(nonTeam)
            setLoading(false)
        }
    }, [profile])

    const updateTeamInDatabase = async (newTeamIds: string[]) => {
        try {
            setSaving(true)

            // Update local state through callback
            onTeamUpdate(newTeamIds)

            // Update database
            const { error } = await supabase
                .from('trainers')
                .update({ team: newTeamIds })
                .eq('user_id', profile.user_id)

            if (error) throw error
            toast.success('Team updated successfully')
        } catch (error) {
            console.error('Error saving team:', error)
            toast.error('Failed to save team changes')
        } finally {
            setSaving(false)
        }
    }

    const handleAddToTeam = (pokemon: CapturedPokemon) => {
        if (teamPokemon.length >= 6) {
            toast.error('Team can only have 6 Pokemon')
            return
        }

        const newTeam = [...teamPokemon, pokemon]
        const newAll = allPokemon.filter(p => p.id !== pokemon.id)

        setTeamPokemon(newTeam)
        setAllPokemon(newAll)
        updateTeamInDatabase(newTeam.map(p => p.id))
    }

    const handleRemoveFromTeam = (pokemon: CapturedPokemon) => {
        const newTeam = teamPokemon.filter(p => p.id !== pokemon.id)
        const newAll = [...allPokemon, pokemon]

        setTeamPokemon(newTeam)
        setAllPokemon(newAll)
        updateTeamInDatabase(newTeam.map(p => p.id))
    }

    const handleMoveUp = (index: number) => {
        if (index <= 0) return

        const newTeam = [...teamPokemon]
        const temp = newTeam[index]
        newTeam[index] = newTeam[index - 1]
        newTeam[index - 1] = temp

        setTeamPokemon(newTeam)
        updateTeamInDatabase(newTeam.map(p => p.id))
    }

    const handleMoveDown = (index: number) => {
        if (index >= teamPokemon.length - 1) return

        const newTeam = [...teamPokemon]
        const temp = newTeam[index]
        newTeam[index] = newTeam[index + 1]
        newTeam[index + 1] = temp

        setTeamPokemon(newTeam)
        updateTeamInDatabase(newTeam.map(p => p.id))
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader className="w-8 h-8" />
            </div>
        )
    }

    return (
        <div className="w-full space-y-8 bg-lime-100 rounded-lg border-2 border-lime-500 p-4">
            {/* Team Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between border-b-2 border-lime-500 pb-2">
                    <h2 className="text-xl font-bold text-gray-800 uppercase tracking-wide">
                        My Team
                    </h2>
                    {saving && (
                        <div className="flex items-center gap-2 text-gray-600">
                            <Loader className="w-4 h-4" />
                            <span className="text-sm">Saving...</span>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-6 gap-4">
                    <AnimatePresence>
                        {teamPokemon.map((pokemon, index) => (
                            <div
                                key={pokemon.id}
                                className="relative"
                            >
                                <PokemonCard
                                    stats={pokemon.stats}
                                    imagePath={pokemon.imagePath}
                                    onClick={() => {
                                        setSelectedPokemon(pokemon)
                                        setViewerOpen(true)
                                    }}
                                />
                                <div className="absolute top-0 left-0 flex flex-col">
                                    <Button
                                        variant="secondary"
                                        className='m-1 p-0 '
                                        size="icon"
                                        onClick={() => handleMoveUp(index)}
                                        disabled={index === 0}
                                        type="button"
                                    >
                                        <ArrowUp className="h-2 w-2" />
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        className='m-1 p-0 '
                                        size="icon"
                                        onClick={() => handleMoveDown(index)}
                                        disabled={index === teamPokemon.length - 1}
                                        type="button"
                                    >
                                        <ArrowDown className="h-2 w-2" />
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        className='m-1 p-0 '
                                        size="icon"
                                        onClick={() => handleRemoveFromTeam(pokemon)}
                                        type="button"
                                    >
                                        <Archive className="h-2 w-2 text-red-700" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </AnimatePresence>

                    {/* Empty Team Slots */}
                    {Array.from({ length: 6 - teamPokemon.length }).map((_, i) => (
                        <div
                            key={`empty-${i}`}
                            className="h-72 bg-gray-200 rounded-lg border-2 border-gray-300 opacity-50 flex items-center justify-center text-sm text-center"
                        >
                            Empty (add from below)
                        </div>
                    ))}
                </div>
            </div>

            {/* All Pokemon Section */}
            <div className="mt-8 space-y-4">
                <h2 className="text-xl font-bold text-gray-800 uppercase tracking-wide border-b-2 border-lime-500 pb-2">
                    Others
                </h2>

                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
                    <AnimatePresence>
                        {allPokemon.map((pokemon) => (
                            <div
                                key={pokemon.id}
                                className="relative"
                            >
                                <PokemonCard
                                    stats={pokemon.stats}
                                    imagePath={pokemon.imagePath}
                                    onClick={() => {
                                        setSelectedPokemon(pokemon)
                                        setViewerOpen(true)
                                    }}
                                />
                                <Button
                                    variant="secondary"
                                    size="icon"
                                    className="absolute top-0 left-0 m-1"
                                    onClick={() => handleAddToTeam(pokemon)}
                                    disabled={teamPokemon.length >= 6}
                                    type="button"
                                >
                                    <Plus className="h-2 w-2 text-green-900" />
                                </Button>
                            </div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>

            {/* Pokemon Viewer Dialog */}
            {selectedPokemon && (
                <PokemonViewer
                    stats={selectedPokemon.stats}
                    imagePath={selectedPokemon.imagePath}
                    open={viewerOpen}
                    // height={selectedPokemon.}
                    onOpenChange={setViewerOpen}
                    pokemonId={selectedPokemon.id}
                    onPokemonRelease={() => {
                        // Remove from appropriate list
                        if (teamPokemon.find(p => p.id === selectedPokemon.id)) {
                            setTeamPokemon(teamPokemon.filter(p => p.id !== selectedPokemon.id))
                        } else {
                            setAllPokemon(allPokemon.filter(p => p.id !== selectedPokemon.id))
                        }
                        setSelectedPokemon(null)
                    }}
                />
            )}
        </div>
    )
}
