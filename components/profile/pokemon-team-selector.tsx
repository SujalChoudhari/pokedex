"use client"

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { calculateTrainerStats } from '@/lib/stats-calculator'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { supabase } from '@/lib/supabase'
import type { CapturedPokemon, TrainerProfile } from '@/lib/trainer-types'
import Image from 'next/image'
import { useState } from 'react'
import { toast } from 'sonner'

interface PokemonTeamSelectorProps {
    profile: TrainerProfile;
    onTeamUpdate: (newTeam: string[]) => void;
}

export function PokemonTeamSelector({ profile, onTeamUpdate }: PokemonTeamSelectorProps) {
    const [isAllPokemonOpen, setIsAllPokemonOpen] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 12

    const team = profile.captured_pokemon.filter(p => profile.team.includes(p.id))
    const startIdx = (currentPage - 1) * itemsPerPage
    const endIdx = startIdx + itemsPerPage
    const displayedPokemon = profile.captured_pokemon.slice(startIdx, endIdx)
    const totalPages = Math.ceil(profile.captured_pokemon.length / itemsPerPage)

    const handleToggleTeam = async (pokemonId: string) => {
        try {
            let newTeam: string[]

            if (profile.team.includes(pokemonId)) {
                // Remove from team
                newTeam = profile.team.filter(id => id !== pokemonId)
            } else {
                // Add to team if less than 6 Pokémon
                if (profile.team.length >= 6) {
                    toast.error('Team can only have 6 Pokémon')
                    return
                }
                newTeam = [...profile.team, pokemonId]
            }

            // Update team and recalculate stats
            const stats = calculateTrainerStats(profile.captured_pokemon);
            const { error } = await supabase
                .from('trainers')
                .update({ 
                    team: newTeam,
                    stats 
                })
                .eq('user_id', profile.user_id)

            if (error) throw error

            onTeamUpdate(newTeam)
            toast.success('Team updated successfully')

        } catch (error) {
            console.error('Error updating team:', error)
            toast.error('Failed to update team')
        }
    }

    const handleReorderTeam = async (fromIndex: number, toIndex: number) => {
        try {
            const newTeam = [...profile.team]
            const [movedItem] = newTeam.splice(fromIndex, 1)
            newTeam.splice(toIndex, 0, movedItem)

            // Update in database
            const { error } = await supabase
                .from('trainers')
                .update({ team: newTeam })
                .eq('user_id', profile.user_id)

            if (error) throw error

            onTeamUpdate(newTeam)
            toast.success('Team order updated')

        } catch (error) {
            console.error('Error reordering team:', error)
            toast.error('Failed to reorder team')
        }
    }

    const renderPokemonCard = (pokemon: CapturedPokemon, index?: number, isTeam = false) => (
        <Card
            key={pokemon.id}
            className={`bg-red-100 border-2 border-gray-800 aspect-square relative  ${isTeam ? 'cursor-move shadow-lg transform hover:scale-102 transition-transform' : ''}`}
            draggable={isTeam}
            onDragStart={isTeam ? (e) => {
                e.dataTransfer.setData('text/plain', index!.toString())
            } : undefined}
            onDragOver={isTeam ? (e) => {
                e.preventDefault()
            } : undefined}
            onDrop={isTeam ? (e) => {
                e.preventDefault()
                const fromIndex = parseInt(e.dataTransfer.getData('text/plain'))
                handleReorderTeam(fromIndex, index!)
            } : undefined}
        >
            <div className="aspect-square relative bg-red-50 p-2">
                <div className="absolute top-1 right-1 z-10 w-2 h-2 rounded-full bg-red-500 shadow-inner"></div>
                <Image
                    src={"https://ukmcvfbydqejwaqkdjlj.supabase.co/storage/v1/object/public/pokemon-images/" + pokemon.imagePath}
                    alt={pokemon.stats.currentForm.name}
                    fill
                    className="object-contain p-2"
                />
            </div>
            <div className="p-2 bg-red-600 border-t-2 border-gray-800">
                <div className="flex justify-between items-center">
                    <div>
                        <h4 className="font-bold text-sm text-white">
                            {pokemon.stats.currentForm.name}
                        </h4>
                        <p className="text-xs text-red-100">Lv. {pokemon.stats.currentForm.level}</p>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleTeam(pokemon.id)}
                        className={profile.team.includes(pokemon.id)
                            ? "bg-gray-800 hover:bg-gray-700 text-white border-2 border-gray-900 w-8 h-8 p-0"
                            : "bg-white hover:bg-gray-100 text-gray-900 border-2 border-gray-800 w-8 h-8 p-0"
                        }
                    >
                        {profile.team.includes(pokemon.id) ? '-' : '+'}
                    </Button>
                </div>
            </div>
        </Card>
    )

    return (
        <div className="space-y-4">
            {/* Team Display */}
            <div className="bg-red-600 rounded-lg border-4 border-gray-800 p-4 shadow-lg">
                <div className="flex justify-between items-center mb-3 border-b-2 border-gray-800 pb-2">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-400 border border-gray-800"></div>
                        <h3 className="text-white font-bold uppercase tracking-wide">Active Team</h3>
                    </div>
                    <p className="text-sm text-red-100 bg-gray-800 px-2 py-1 rounded">{team.length}/6</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {team.map((pokemon, index) => renderPokemonCard(pokemon, index, true))}
                    {[...Array(6 - team.length)].map((_, i) => (
                        <div
                            key={i}
                            className="aspect-square bg-red-500 rounded border-2 border-dashed border-gray-800 flex items-center justify-center"
                        >
                            <span className="text-red-100 text-sm">Empty</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* View All Pokemon Button */}
            <div className="flex justify-center">
                <Button
                    onClick={() => setIsAllPokemonOpen(true)}
                    className="bg-gray-800 hover:bg-gray-700 text-white border-2 border-gray-900 shadow-lg transform hover:scale-105 transition-transform"
                >
                    Open Pokédex
                </Button>
            </div>

            {/* All Pokemon Dialog */}
            <Dialog open={isAllPokemonOpen} onOpenChange={setIsAllPokemonOpen}>
                <DialogContent className="max-w-3xl bg-red-600 border-4 border-gray-800">
                    <DialogHeader className="border-b-2 border-gray-800">
                        <div className="flex items-center gap-2">
                            <div className="flex gap-1">
                                <div className="w-3 h-3 rounded-full bg-red-400 border border-gray-800"></div>
                                <div className="w-3 h-3 rounded-full bg-yellow-400 border border-gray-800"></div>
                                <div className="w-3 h-3 rounded-full bg-green-400 border border-gray-800"></div>
                            </div>
                            <DialogTitle className="text-white font-bold tracking-wide">POKÉDEX SYSTEM</DialogTitle>
                        </div>
                    </DialogHeader>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[60vh] overflow-y-auto p-3 bg-red-500 rounded-lg border-2 border-gray-800">
                        {displayedPokemon.map(pokemon => renderPokemonCard(pokemon))}
                    </div>
                    {totalPages > 1 && (
                        <div className="flex justify-center gap-2 mt-4 p-2 bg-gray-800 rounded-lg">
                            <Button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                variant="outline"
                                className="border-2 border-gray-700 bg-red-600 hover:bg-red-500 text-white disabled:opacity-50"
                            >
                                ◀
                            </Button>
                            <span className="py-2 px-4 text-white bg-red-800 rounded border border-gray-700">
                                {currentPage}/{totalPages}
                            </span>
                            <Button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                variant="outline"
                                className="border-2 border-gray-700 bg-red-600 hover:bg-red-500 text-white disabled:opacity-50"
                            >
                                ▶
                            </Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
