"use client"

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Card } from '@/components/ui/card'
import { Loader } from '@/components/ui/loader'
import { supabase } from '@/lib/supabase'
import type { PokemonStats } from '@/lib/types'
import { motion } from 'framer-motion'

interface PokemonCardProps {
  stats: PokemonStats
  imagePath: string
  onClick?: () => void
}

export function PokemonCard({ imagePath, stats, onClick }: PokemonCardProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchImageUrl = async () => {
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
  }, [imagePath])

  const getTypeColor = (type: string) => {
    const colors = {
      fire: 'from-red-500 to-orange-500',
      water: 'from-blue-500 to-blue-400',
      grass: 'from-green-500 to-green-400',
      electric: 'from-yellow-400 to-yellow-300',
      ice: 'from-cyan-400 to-cyan-300',
      fighting: 'from-orange-700 to-orange-600',
      poison: 'from-purple-500 to-purple-400',
      ground: 'from-amber-700 to-amber-600',
      flying: 'from-indigo-400 to-indigo-300',
      psychic: 'from-pink-500 to-pink-400',
      bug: 'from-lime-500 to-lime-400',
      rock: 'from-stone-500 to-stone-400',
      ghost: 'from-violet-600 to-violet-500',
      dragon: 'from-violet-500 to-violet-400',
      dark: 'from-gray-800 to-gray-700',
      steel: 'from-slate-400 to-slate-300',
      fairy: 'from-pink-400 to-pink-300',
      normal: 'from-gray-400 to-gray-300'
    }
    return colors[type.toLowerCase() as keyof typeof colors] || 'from-gray-500 to-gray-400'
  }

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative"
    >
      <Card 
        onClick={onClick}
        className={`
          relative overflow-hidden cursor-pointer
          bg-gradient-to-br ${getTypeColor(stats.currentForm.types[0])}
          border-2 border-gray-800 rounded-lg shadow-lg
          transform transition-all duration-200 h-72
        `}
      >
        <div className="absolute top-0 left-0 w-full h-full bg-white/10" />
        
        <div className="relative aspect-square bg-black/20 p-2">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader className="text-white" />
            </div>
          ) : imageUrl ? (
            <div className="relative w-full h-full">
              <Image
                src={imageUrl}
                alt={stats.currentForm.name}
                fill
                className="object-contain drop-shadow-lg transform hover:scale-110 transition-transform duration-200"
              />
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-sm text-white/70">Failed to load image</p>
            </div>
          )}
        </div>

        <div className="p-3 bg-black/30 border-t border-white/10">
          <h3 className="font-bold text-white text-sm uppercase tracking-wide mb-1">
            {stats.currentForm.name}
          </h3>
          <div className="flex items-center justify-between">
            <p className="text-xs text-white/80">Lv. {stats.currentForm.level}</p>
            <div className="flex gap-1">
              {stats.currentForm.types.map((type) => (
                <span
                  key={type}
                  className="px-1.5 py-0.5 text-[10px] bg-black/30 rounded text-white uppercase tracking-wider"
                >
                  {type}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-white/50 shadow-inner" />
        <div className="absolute top-3 right-3 w-1 h-1 rounded-full bg-white/30" />
      </Card>
    </motion.div>
  )
}
