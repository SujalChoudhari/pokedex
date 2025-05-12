"use client"

import { PokemonCard } from '@/components/pokemon/pokemon-card'
import { PokemonViewer } from '@/components/pokemon/pokemon-viewer'
import { Loader } from '@/components/ui/loader'
import { supabase } from '@/lib/supabase'
import type { TrainerProfile } from '@/lib/trainer-types'
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd'
import { AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface Pokemon {
    id: string
    stats: any
    imagePath: string
}

interface PokemonTeamSelectorProps {
    profile: TrainerProfile
    onTeamUpdate: (newTeam: string[]) => void
}

// Custom wrapper component to handle motion + drag conflicts
const DraggableItem = ({ children, ...props }: any) => {
    return (
        <div {...props}>
            {children}
        </div>
    )
}

export function PokemonTeamSelector({ profile, onTeamUpdate }: PokemonTeamSelectorProps) {
    const [allPokemon, setAllPokemon] = useState<Pokemon[]>([])
    const [teamPokemon, setTeamPokemon] = useState<Pokemon[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedPokemon, setSelectedPokemon] = useState<Pokemon | null>(null)
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

    const handleDragEnd = async (result: any) => {
        if (!result.destination) return

        const { source, destination } = result

        // Same list
        if (source.droppableId === destination.droppableId) {
            if (source.droppableId === 'team') {
                const newTeam = Array.from(teamPokemon)
                const [removed] = newTeam.splice(source.index, 1)
                newTeam.splice(destination.index, 0, removed)
                setTeamPokemon(newTeam)
            } else {
                const newAll = Array.from(allPokemon)
                const [removed] = newAll.splice(source.index, 1)
                newAll.splice(destination.index, 0, removed)
                setAllPokemon(newAll)
            }
        }
        // Different lists
        else {
            const sourceList = source.droppableId === 'team' ? teamPokemon : allPokemon
            const destList = destination.droppableId === 'team' ? teamPokemon : allPokemon

            // Check team size limit
            if (destination.droppableId === 'team' && teamPokemon.length >= 6) {
                toast.error('Team can only have 6 Pokemon')
                return
            }

            const [removed] = sourceList.splice(source.index, 1)
            destList.splice(destination.index, 0, removed)

            if (source.droppableId === 'team') {
                setTeamPokemon(sourceList)
                setAllPokemon(destList)
            } else {
                setTeamPokemon(destList)
                setAllPokemon(sourceList)
            }
        }

        // Save team changes
        try {
            setSaving(true)
            const newTeamIds = teamPokemon.map(p => p.id)

            // Update local state through callback
            onTeamUpdate(newTeamIds)

            // Update database
            const { error } = await supabase
                .from('trainers')
                .update({ team: newTeamIds })
                .eq('user_id', profile.user_id)

            if (error) throw error
        } catch (error) {
            console.error('Error saving team:', error)
            toast.error('Failed to save team changes')
        } finally {
            setSaving(false)
        }
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

                <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="team" direction="horizontal">
                        {(provided) => (
                            <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                className="grid grid-cols-2 sm:grid-cols-6 gap-4"
                            >
                                <AnimatePresence>
                                    {teamPokemon.map((pokemon, index) => (
                                        <Draggable
                                            key={pokemon.id}
                                            draggableId={pokemon.id}
                                            index={index}
                                        >
                                            {(provided, snapshot) => (
                                                <DraggableItem
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    {...provided.dragHandleProps}
                                                    className={`
                                                        aspect-square relative cursor-move
                                                        ${snapshot.isDragging ? 'z-50' : 'z-0'}
                                                    `}
                                                    onClick={() => {
                                                        setSelectedPokemon(pokemon)
                                                        setViewerOpen(true)
                                                    }}
                                                >
                                                    <PokemonCard
                                                        stats={pokemon.stats}
                                                        imagePath={pokemon.imagePath}
                                                    />
                                                </DraggableItem>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </AnimatePresence>

                                {/* Empty Team Slots */}
                                {Array.from({ length: 6 - teamPokemon.length }).map((_, i) => (
                                    <div
                                        key={`empty-${i}`}
                                        className="aspect-auto h-72 bg-gray-200 rounded-lg border-2 border-gray-300 opacity-50 flex items-center text-center text-sm"
                                    >
                                        Drag and drop pokemon here to add to team
                                    </ div>
                                ))}
                            </div>
                        )}
                    </Droppable>

                    {/* All Pokemon Section */}
                    <div className="mt-8 space-y-4">
                        <h2 className="text-xl font-bold text-gray-800 uppercase tracking-wide border-b-2 border-lime-500 pb-2">
                            Others
                        </h2>

                        <Droppable droppableId="all" direction="horizontal">
                            {(provided) => (
                                <div
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4"
                                >
                                    <AnimatePresence>
                                        {allPokemon.map((pokemon, index) => (
                                            <Draggable
                                                key={pokemon.id}
                                                draggableId={pokemon.id}
                                                index={index}
                                            >
                                                {(provided, snapshot) => (
                                                    <DraggableItem
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                        className={`
                                                            aspect-square relative cursor-move
                                                            ${snapshot.isDragging ? 'z-50' : 'z-0'}
                                                        `}
                                                        onClick={() => {
                                                            setSelectedPokemon(pokemon)
                                                            setViewerOpen(true)
                                                        }}
                                                    >
                                                        <PokemonCard
                                                            stats={pokemon.stats}
                                                            imagePath={pokemon.imagePath}
                                                        />
                                                    </DraggableItem>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </AnimatePresence>
                                </div>
                            )}
                        </Droppable>
                    </div>
                </DragDropContext>
            </div>

            {/* Pokemon Viewer Dialog */}
            {selectedPokemon && (
                <PokemonViewer
                    stats={selectedPokemon.stats}
                    imagePath={selectedPokemon.imagePath}
                    open={viewerOpen}
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
