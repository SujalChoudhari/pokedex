"use client"

import { useState, useCallback, useRef } from 'react'
import Webcam from 'react-webcam'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import type { PokemonStats } from '@/lib/types'

export function CameraCapture() {
  const webcamRef = useRef<Webcam>(null)
  const [capturing, setCapturing] = useState(false)
  const [pokemonData, setPokemonData] = useState<PokemonStats | null>(null)

  const captureImage = useCallback(async () => {
    if (!webcamRef.current) return
    
    try {
      setCapturing(true)
      const imageSrc = webcamRef.current.getScreenshot()
      if (!imageSrc) return

      // Upload to Supabase Storage
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

      // Analyze with Gemini
      const response = await fetch('/api/pokemon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageSrc })
      })

      if (!response.ok) throw new Error('Failed to analyze image')
      
      const data = await response.json()
      setPokemonData(data)

      // Store the Pokemon data in Supabase
      const { error: dbError } = await supabase
        .from('captured_pokemon')
        .insert([
          {
            user_id: userId,
            image_path: filePath,
            stats: data,
            captured_at: new Date().toISOString()
          }
        ])

      if (dbError) throw dbError

    } catch (error) {
      console.error('Error capturing Pokemon:', error)
      toast.error('Failed to capture Pokemon', {
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      })
    } finally {
      setCapturing(false)
    }
  }, [])

  // Helper function to convert base64 to blob
  const base64ToBlob = (base64: string) => {
    const byteString = atob(base64.split(',')[1])
    const mimeString = base64.split(',')[0].split(':')[1].split(';')[0]
    const ab = new ArrayBuffer(byteString.length)
    const ia = new Uint8Array(ab)
    
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i)
    }
    
    return new Blob([ab], { type: mimeString })
  }

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div className="relative aspect-video rounded-lg overflow-hidden border-2 border-gray-200">
          <Webcam
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={{
              facingMode: "environment"
            }}
            className="w-full h-full object-cover"
          />
        </div>
        <Button 
          onClick={captureImage} 
          disabled={capturing}
          className="w-full"
        >
          {capturing ? "Analyzing..." : "Capture Pokemon"}
        </Button>

        {pokemonData && (
          <div className="mt-4 space-y-6">
            {/* Current Form */}
            <div className="p-6 border rounded-lg bg-white/50 backdrop-blur-sm">
              <h3 className="text-2xl font-bold mb-4">{pokemonData.currentForm.name} (Lv. {pokemonData.currentForm.level})</h3>
              <div className="space-y-4">
                <p className="italic text-gray-600">{pokemonData.currentForm.description}</p>
                <div className="flex flex-wrap gap-2">
                  {pokemonData.currentForm.types.map((type) => (
                    <span key={type} className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                      {type}
                    </span>
                  ))}
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="font-semibold mb-2">Base Stats</h4>
                    <ul className="space-y-1">
                      <li className="flex justify-between">
                        <span>HP:</span>
                        <span>{pokemonData.currentForm.baseStats.hp}</span>
                      </li>
                      <li className="flex justify-between">
                        <span>Attack:</span>
                        <span>{pokemonData.currentForm.baseStats.attack}</span>
                      </li>
                      <li className="flex justify-between">
                        <span>Defense:</span>
                        <span>{pokemonData.currentForm.baseStats.defense}</span>
                      </li>
                      <li className="flex justify-between">
                        <span>Sp. Attack:</span>
                        <span>{pokemonData.currentForm.baseStats.specialAttack}</span>
                      </li>
                      <li className="flex justify-between">
                        <span>Sp. Defense:</span>
                        <span>{pokemonData.currentForm.baseStats.specialDefense}</span>
                      </li>
                      <li className="flex justify-between">
                        <span>Speed:</span>
                        <span>{pokemonData.currentForm.baseStats.speed}</span>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Moves</h4>
                    <ul className="space-y-1">
                      {pokemonData.currentForm.moves.map((move) => (
                        <li key={move} className="text-sm">{move}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Abilities</h4>
                  <p>{pokemonData.currentForm.abilities.join(', ')}</p>
                </div>
              </div>
            </div>

            {/* Evolution Chain */}
            <div className="p-6 border rounded-lg bg-white/50 backdrop-blur-sm">
              <h3 className="text-xl font-bold mb-4">Evolution Chain</h3>
              <div className="space-y-6">
                {/* Current Form */}
                <div>
                  <h4 className="font-medium text-lg">
                    {pokemonData.evolutionChain.current.name} (Lv. {pokemonData.evolutionChain.current.level})
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">{pokemonData.evolutionChain.current.description}</p>
                  <div className="mt-2">
                    <span className="text-sm font-medium">Moves: </span>
                    <span className="text-sm">{pokemonData.evolutionChain.current.moves.join(', ')}</span>
                  </div>
                </div>

                {/* Next Evolution */}
                <div>
                  <h4 className="font-medium text-lg">
                    {pokemonData.evolutionChain.nextEvolution.name} (Evolves at Lv. {pokemonData.evolutionChain.nextEvolution.evolutionLevel})
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">{pokemonData.evolutionChain.nextEvolution.description}</p>
                  <div className="mt-2">
                    <span className="text-sm font-medium">Moves: </span>
                    <span className="text-sm">{pokemonData.evolutionChain.nextEvolution.moves.join(', ')}</span>
                  </div>
                </div>

                {/* Final Evolution */}
                <div>
                  <h4 className="font-medium text-lg">
                    {pokemonData.evolutionChain.finalEvolution.name} (Evolves at Lv. {pokemonData.evolutionChain.finalEvolution.evolutionLevel})
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">{pokemonData.evolutionChain.finalEvolution.description}</p>
                  <div className="mt-2">
                    <span className="text-sm font-medium">Moves: </span>
                    <span className="text-sm">{pokemonData.evolutionChain.finalEvolution.moves.join(', ')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
