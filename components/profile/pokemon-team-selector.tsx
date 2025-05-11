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
            className={`bg-lime-50 border-lime-500 aspect-square  relative ${isTeam ? 'cursor-move' : ''}`}
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
            <div className="aspect-square relative">
                <Image
                    src={"https://ukmcvfbydqejwaqkdjlj.supabase.co/storage/v1/object/public/pokemon-images/" + pokemon.imagePath}
                    alt={pokemon.stats.currentForm.name}
                    fill
                    className="object-cover"
                />
            </div>
            <div className="p-2 bg-lime-100 border-t border-lime-500">
                <div className="flex justify-between items-center">
                    <div>
                        <h4 className="font-bold text-sm text-black">
                            {pokemon.stats.currentForm.name}
                        </h4>
                        <p className="text-xs text-gray-600">Lv. {pokemon.stats.currentForm.level}</p>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleTeam(pokemon.id)}
                        className={profile.team.includes(pokemon.id)
                            ? "bg-red-500 hover:bg-red-600 text-white border-red-700"
                            : "bg-lime-500 hover:bg-lime-600 text-white border-lime-700"
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
            <div className="bg-lime-200 rounded border-2 border-lime-500 p-3">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-black font-bold uppercase">My Team</h3>
                    <p className="text-sm text-gray-600">{team.length}/6 Pokémon</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {team.map((pokemon, index) => renderPokemonCard(pokemon, index, true))}
                    {[...Array(6 - team.length)].map((_, i) => (
                        <div
                            key={i}
                            className="aspect-square bg-lime-100 rounded border-2 border-dashed border-lime-500 flex items-center justify-center"
                        >
                            <span className="text-lime-500">Empty Slot</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* View All Pokemon Button */}
            <div className="flex justify-center">
                <Button
                    onClick={() => setIsAllPokemonOpen(true)}
                    className="bg-lime-500 hover:bg-lime-600 text-white"
                >
                    View All Pokemon
                </Button>
            </div>

            {/* All Pokemon Dialog */}
            <Dialog open={isAllPokemonOpen} onOpenChange={setIsAllPokemonOpen}>
                <DialogContent className="max-w-3xl ">
                    <DialogHeader>
                        <DialogTitle className="text-yellow-900">All Pokémon</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[60vh] overflow-y-auto p-1">
                        {displayedPokemon.map(pokemon => renderPokemonCard(pokemon))}
                    </div>
                    {totalPages > 1 && (
                        <div className="flex justify-center gap-2 mt-4">
                            <Button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                variant="outline"
                                className="border-yellow-400 text-yellow-400 hover:bg-yellow-500 hover:text-black"
                            >
                                Previous
                            </Button>
                            <span className="py-2 text-yellow-400">
                                Page {currentPage} of {totalPages}
                            </span>
                            <Button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                variant="outline"
                                className="border-yellow-400 text-yellow-400 hover:bg-yellow-500 hover:text-black"
                            >
                                Next
                            </Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
