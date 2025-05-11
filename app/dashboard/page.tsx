"use client"

import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { PokemonCard } from "@/components/pokemon/pokemon-card"
import { PokemonViewer } from "@/components/pokemon/pokemon-viewer"
import { Loader } from "@/components/ui/loader"
import { Plus } from "lucide-react"
import { toast } from "sonner"
import type { PokemonStats } from "@/lib/types"

interface CapturedPokemonData {
    id: string
    stats: PokemonStats
    imagePath: string
    user_id?: string
    height: string
    weight: string
}

export default function DashboardPage() {
    const router = useRouter()
    const [selectedPokemon, setSelectedPokemon] = useState<CapturedPokemonData | null>(null)
    const [capturedPokemon, setCapturedPokemon] = useState<CapturedPokemonData[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchPokemon = async () => {
        try {
            setIsLoading(true)
            setError(null)

            const { data: sessionData } = await supabase.auth.getSession()
            const userId = sessionData.session?.user.id
            if (!userId) {
                setError("User not authenticated")
                return
            }

            const { data, error } = await supabase
                .from('captured_pokemon')
                .select('id, stats, image_path, user_id, height, weight')
                .eq('user_id', userId)
                .order('captured_at', { ascending: false })

            if (error) throw error

            if (data) {
                setCapturedPokemon(data.map(p => ({
                    id: p.id,
                    stats: p.stats,
                    imagePath: p.image_path,
                    user_id: p.user_id,
                    height: p.height,
                    weight: p.weight
                })))
            }
        } catch (err) {
            console.error('Error fetching Pokemon:', err)
            setError(err instanceof Error ? err.message : 'Failed to load Pokemon')
            toast.error('Failed to load Pokemon')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchPokemon()
    }, [])

    const handlePokemonRelease = async () => {
        if (selectedPokemon) {
            try {
                // Update local state immediately for better UX
                setCapturedPokemon(prev => prev.filter(p => p.id !== selectedPokemon.id))
                setSelectedPokemon(null)
                
                // Verify the deletion was successful
                const { data } = await supabase
                    .from('captured_pokemon')
                    .select('id')
                    .eq('id', selectedPokemon.id)
                    .single()

                if (data) {
                    // If the Pokemon still exists, refresh the list
                    await fetchPokemon()
                }
            } catch (error) {
                console.error('Error verifying Pokemon release:', error)
            }
        }
    }

    const handleSignOut = async () => {
        try {
            await supabase.auth.signOut()
            router.push("/login")
        } catch (error) {
            console.error('Error signing out:', error)
            toast.error('Failed to sign out')
        }
    }

    return (
        <div className="w-screen h-full mx-auto font-mono">
            {/* Kanto Pokedex Outer Frame */}
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

                {/* Main Content Area */}
                <div className="flex w-full h-full flex-col md:flex-row justify-around">
                    {/* Left Panel: Screen Area */}
                    <div className="flex-grow w-full h-full md:w-3/5 bg-gray-700 rounded border-2 border-gray-800 shadow-inner p-2">
                        {/* Classic Green LCD Screen */}
                        <div className="bg-gray-950 w-full h-full rounded-sm overflow-hidden border-2 border-lime-500 relative flex flex-col">

                            {/* Status Bar */}
                            <div className="bg-lime-200 border-b-2 border-lime-500 p-2 flex justify-between items-center">
                                <h1 className="text-black font-bold text-sm sm:text-base uppercase tracking-wide">Trainer's Pokedex</h1>
                                <div className="flex gap-2">
                                    <Button
                                        onClick={() => router.push('/profile')}
                                        className="h-7 text-xs bg-blue-500 hover:bg-blue-600 text-white"
                                    >
                                        PROFILE
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={handleSignOut}
                                        className="h-7 text-xs bg-red-500 hover:bg-red-600 text-white border-red-700"
                                    >
                                        LOG OUT
                                    </Button>
                                </div>
                            </div>

                            {/* Main Content Area */}
                            <div className="flex-1 overflow-y-auto bg-lime-100 p-2">
                                {isLoading ? (
                                    <div className="h-full flex flex-col items-center justify-center">
                                        <Loader className="text-black" />
                                        <p className="mt-3 text-black text-sm uppercase tracking-wider">Loading Data...</p>
                                    </div>
                                ) : error ? (
                                    <div className="h-full flex flex-col items-center justify-center text-black">
                                        <p className="text-red-600 mb-4 text-sm">{error}</p>
                                        <Button onClick={() => router.refresh()} className="bg-blue-500 hover:bg-blue-600 text-white">
                                            Retry
                                        </Button>
                                    </div>
                                ) : capturedPokemon.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-black">
                                        <p className="text-gray-700 mb-4 text-sm text-center">No Pokemon registered.<br />Begin your journey now!</p>
                                        <Button onClick={() => router.push('/capture')} className="bg-red-500 hover:bg-red-600 text-white gap-2">
                                            <Plus className="h-4 w-4" />Start Catching
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        {capturedPokemon.map((pokemon) => (
                                            <PokemonCard
                                                key={pokemon.id}
                                                stats={pokemon.stats}
                                                imagePath={pokemon.imagePath}
                                                onClick={() => setSelectedPokemon(pokemon)}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Panel: Controls */}
                    <div className="md:w-2/5 flex flex-col justify-center items-center space-y-2 p-1.5 sm:p-2 bg-red-600 rounded border-2 border-red-800">
                        <Button
                            onClick={() => router.push('/capture')}
                            className="
                relative h-16 w-16 sm:h-20 sm:w-20
                rounded-full border-4 border-black overflow-hidden
                bg-white flex items-center justify-center
                transform transition-transform duration-100 active:scale-95
                shadow-md
              "
                        >
                            {/* Pokeball Design */}
                            <div className="absolute top-0 left-0 w-full h-1/2 bg-red-500"></div>
                            <div className="absolute bottom-0 left-0 w-full h-1/2 bg-white"></div>
                            <div className="absolute top-1/2 left-0 w-full h-3 sm:h-4 bg-black transform -translate-y-1/2 z-10"></div>
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-full border-4 border-black z-20 flex items-center justify-center">
                                <Plus className="h-4 w-4" />
                            </div>
                        </Button>
                        <span className="text-white text-xs sm:text-sm font-bold uppercase tracking-wide">Catch New</span>
                    </div>
                </div>
            </div>

            {/* Pokemon Viewer Dialog */}
            {selectedPokemon && (
                <PokemonViewer
                    pokemonId={selectedPokemon.id}
                    stats={selectedPokemon.stats}
                    imagePath={selectedPokemon.imagePath}
                    open={!!selectedPokemon}
                    onOpenChange={(open) => !open && setSelectedPokemon(null)}
                    onPokemonRelease={handlePokemonRelease}
                />
            )}
        </div>
    )
}
