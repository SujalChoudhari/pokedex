"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Loader } from '@/components/ui/loader'
import { Button } from '@/components/ui/button'
import { TrainerProfile } from '@/components/profile/trainer-profile'
import { toast } from 'sonner'
import type { TrainerProfile as TrainerProfileType } from '@/lib/trainer-types'
import { calculateTrainerStats } from '@/lib/stats-calculator'

export default function ProfilePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [profile, setProfile] = useState<TrainerProfileType | null>(null)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) {
          router.push('/login')
          return
        }

        const { data: trainer, error: trainerError } = await supabase
          .from('trainers')
          .select('*')
          .eq('user_id', session.user.id)
          .single()

        if (trainerError && trainerError.code !== 'PGRST116') {
          throw trainerError
        }

        const { data: pokemon, error: pokemonError } = await supabase
          .from('captured_pokemon')
          .select('id, stats, image_path, captured_at')
          .eq('user_id', session.user.id)
          .order('captured_at', { ascending: false })

        if (pokemonError) throw pokemonError

        const captured = pokemon.map(p => ({
          id: p.id,
          stats: p.stats,
          imagePath: p.image_path,
          captured_at: p.captured_at
        }))

        const stats = calculateTrainerStats(captured)

        if (trainer) {
          // Update trainer stats
          const { error: statsError } = await supabase
            .from('trainers')
            .update({ stats })
            .eq('id', trainer.id)

          if (statsError) {
            console.error('Error updating stats:', statsError)
          }

          setProfile({
            ...trainer,
            stats,
            team: trainer.team || [],
            captured_pokemon: captured
          })
        }

      } catch (err) {
        console.error('Error fetching profile:', err)
        setError('Failed to load profile')
        toast.error('Failed to load profile')
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfile()
  }, [router])

  if (isLoading) return <Loader />

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
                <h1 className="text-black font-bold text-sm sm:text-base uppercase tracking-wide">Trainer Profile</h1>
                <div className="flex gap-2">
                  <Button
                    onClick={() => router.push('/dashboard')}
                    className="h-7 text-xs bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    POKÉDEX
                  </Button>
                </div>
              </div>

              {/* Main Content Area */}
              <div className="flex-1 overflow-y-auto bg-lime-100 p-2">
                <TrainerProfile
                  profile={profile}
                  onProfileUpdate={setProfile}
                />
              </div>
            </div>
          </div>

          {/* Right Panel: Controls */}
          <div className="md:w-2/5 flex flex-col justify-center items-center space-y-2 p-1.5 sm:p-2 bg-red-600 rounded border-2 border-red-800"></div>
        </div>
      </div>
    </div>
  )
}
