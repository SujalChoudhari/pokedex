"use client"

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Card } from '@/components/ui/card'
import { Loader } from '@/components/ui/loader'
import { supabase } from '@/lib/supabase'
import type { PokemonStats } from '@/lib/types'

interface PokemonCardProps {
  stats: PokemonStats
  imagePath: string
  onClick?: () => void
}

export function PokemonCard({ imagePath, stats, onClick }: PokemonCardProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch image URL when component mounts
  useEffect(() => {
    const fetchImageUrl = async () => {
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
  }, [imagePath])

  return (
    <Card 
      className="group relative overflow-hidden cursor-pointer transition-all hover:scale-105 bg-lime-100 border-2 border-lime-500" 
      onClick={onClick}
    >
      <div className="aspect-square relative bg-lime-50">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-lime-100">
            <Loader className="text-black" />
          </div>
        ) : imageUrl ? (
          <Image
            src={imageUrl}
            alt={stats.currentForm.name}
            fill
            className="object-cover p-2"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-lime-100">
            <p className="text-sm text-gray-700">Failed to load image</p>
          </div>
        )}
      </div>
      <div className="p-2 bg-lime-200 border-t-2 border-lime-500">
        <h3 className="font-bold text-sm text-black uppercase">{stats.currentForm.name}</h3>
        <p className="text-xs text-gray-700">Lv. {stats.currentForm.level}</p>
      </div>
    </Card>
  )
}
