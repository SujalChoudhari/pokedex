"use client"

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Loader } from '@/components/ui/loader'
import { supabase } from '@/lib/supabase'
import type { PokemonStats } from '@/lib/types'

interface PokemonViewerProps {
  stats: PokemonStats
  imagePath: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PokemonViewer({ imagePath, stats, open, onOpenChange }: PokemonViewerProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch image URL when component mounts
  useEffect(() => {
    const fetchImageUrl = async () => {
      if (!open) return // Don't fetch if dialog is closed
      
      try {
        // Check localStorage first
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
          // Cache the URL in localStorage
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-red-700 border-4 border-red-900">
        {/* Top Decorative Lights */}
        <div className="flex items-center mb-2 px-1">
          <div className="w-2 h-2 bg-sky-400 rounded-full border border-sky-600"></div>
          <div className="ml-1.5 flex gap-1">
            <div className="w-1.5 h-1.5 bg-red-400 rounded-full border border-red-600"></div>
            <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full border border-yellow-600"></div>
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full border border-green-700"></div>
          </div>
        </div>

        <DialogHeader className="bg-lime-200 border-2 border-lime-500 rounded-t p-2">
          <DialogTitle className="text-black font-bold uppercase text-sm tracking-wide">Pokemon Analysis</DialogTitle>
        </DialogHeader>
        
        <div className="bg-lime-100 p-4 rounded-b border-2 border-t-0 border-lime-500">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Pokemon Image */}
            <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-lime-500 bg-lime-50">
              {isLoading ? (
                <div className="absolute inset-0 flex items-center justify-center bg-lime-100">
                  <Loader className="text-black"/>
                </div>
              ) : imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={stats.currentForm.name}
                  fill
                  className="object-contain p-2"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-lime-100">
                  <p className="text-sm text-gray-700">Failed to load image</p>
                </div>
              )}
            </div>

            {/* Pokemon Info */}
            <div className="space-y-4">
              <div className="bg-lime-200 p-2 rounded border border-lime-500">
                <h2 className="text-xl font-bold text-black uppercase">{stats.currentForm.name}</h2>
                <p className="text-sm text-gray-700">Level {stats.currentForm.level}</p>
              </div>

              <div className="bg-lime-200 p-2 rounded border border-lime-500">
                <h3 className="font-bold text-sm mb-2 text-black uppercase">Types</h3>
                <div className="flex flex-wrap gap-2">
                  {stats.currentForm.types.map((type) => (
                    <span 
                      key={type}
                      className="px-2 py-1 rounded-md bg-lime-300 border border-lime-500 text-gray-800 text-xs uppercase"
                    >
                      {type}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-lime-200 p-2 rounded border border-lime-500">
                  <h3 className="font-bold text-sm mb-2 text-black uppercase">Base Stats</h3>
                  <ul className="space-y-1 text-xs">
                    <li className="flex justify-between">
                      <span className="text-gray-700">HP:</span>
                      <span className="font-mono text-black">{stats.currentForm.baseStats.hp}</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-gray-700">Attack:</span>
                      <span className="font-mono text-black">{stats.currentForm.baseStats.attack}</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-gray-700">Defense:</span>
                      <span className="font-mono text-black">{stats.currentForm.baseStats.defense}</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-gray-700">Sp. Attack:</span>
                      <span className="font-mono text-black">{stats.currentForm.baseStats.specialAttack}</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-gray-700">Sp. Defense:</span>
                      <span className="font-mono text-black">{stats.currentForm.baseStats.specialDefense}</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-gray-700">Speed:</span>
                      <span className="font-mono text-black">{stats.currentForm.baseStats.speed}</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-lime-200 p-2 rounded border border-lime-500">
                  <h3 className="font-bold text-sm mb-2 text-black uppercase">Moves</h3>
                  <div className="flex flex-wrap gap-1">
                    {stats.currentForm.moves.map((move) => (
                      <span key={move} className="text-xs text-gray-700">{move}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-lime-200 p-2 rounded border border-lime-500">
                <h3 className="font-bold text-sm mb-2 text-black uppercase">Evolution Chain</h3>
                <div className="space-y-2 text-xs">
                  <div>
                    <p className="font-medium text-black">{stats.evolutionChain.nextEvolution.name}</p>
                    <p className="text-gray-700">Evolves at Level {stats.evolutionChain.nextEvolution.evolutionLevel}</p>
                  </div>
                  <div>
                    <p className="font-medium text-black">{stats.evolutionChain.finalEvolution.name}</p>
                    <p className="text-gray-700">Evolves at Level {stats.evolutionChain.finalEvolution.evolutionLevel}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
