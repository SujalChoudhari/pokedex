"use client"

import { useState, useRef } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { PokemonTeamSelector } from './pokemon-team-selector'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Card } from '@/components/ui/card'
import type { TrainerProfile as TrainerProfileType } from '@/lib/trainer-types'
import { PokemonStats } from '@/lib/types'

interface TrainerProfileProps {
  profile: TrainerProfileType | null
  onProfileUpdate: (profile: TrainerProfileType) => void
}

export function TrainerProfile({ profile, onProfileUpdate }: TrainerProfileProps) {
  const [isEditing, setIsEditing] = useState(!profile)
  const [isLoading, setIsLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState({
    name: profile?.name || '',
    age: profile?.age || '',
    gender: profile?.gender || 'other',
    region: profile?.region || ''
  })
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url)

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0]
      if (!file) return

      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file')
        return
      }

      setIsLoading(true)

      // Get current user
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) throw new Error('Not authenticated')

      // Upload avatar
      const timestamp = new Date().getTime()
      const filePath = `${session.user.id}/${timestamp}.jpg`

      const { error: uploadError, data } = await supabase.storage
        .from('trainer-avatars')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('trainer-avatars')
        .getPublicUrl(filePath)

      // Update avatar_url in profile
      const { error: updateError } = await supabase
        .from('trainers')
        .update({ avatar_url: publicUrl })
        .eq('user_id', session.user.id)

      if (updateError) throw updateError

      setAvatarUrl(publicUrl)
      localStorage.setItem(`avatar-${session.user.id}`, publicUrl)
      toast.success('Avatar updated successfully')

    } catch (error) {
      console.error('Error uploading avatar:', error)
      toast.error('Failed to upload avatar')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) throw new Error('Not authenticated')

      const updates = {
        user_id: session.user.id,
        ...formData,
        updated_at: new Date().toISOString()
      }

      let result
      if (!profile) {
        // Create new profile
        const { data, error } = await supabase
          .from('trainers')
          .insert([updates])
          .select()
          .single()

        if (error) throw error
        result = data
      } else {
        // Update existing profile
        const { data, error } = await supabase
          .from('trainers')
          .update(updates)
          .eq('user_id', session.user.id)
          .select()
          .single()

        if (error) throw error
        result = data
      }

      // Update local state
      onProfileUpdate({
        ...result,
        captured_pokemon: profile?.captured_pokemon || []
      })
      setIsEditing(false)
      toast.success(profile ? 'Profile updated successfully' : 'Profile created successfully')

    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update profile')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4 px-4 py-6  mx-auto">
      {/* Avatar and Basic Info */}
      <div className="flex flex-col items-center gap-4 p-4 bg-red-600 rounded-lg border-4 border-red-700 shadow-lg">
        {/* Avatar */}
        <div className="relative w-32 h-32">
          <div className="w-full h-full rounded-full overflow-hidden border-4 border-gray-800 bg-gray-900">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt="Trainer Avatar"
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-800 text-gray-400">
                No Avatar
              </div>
            )}
          </div>
          {isEditing && (
            <>
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 p-0 border-2 border-gray-600"
                disabled={isLoading}
              >
                +
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </>
          )}
        </div>

        {/* Basic Info and Stats */}
        <div className="flex-1 w-full space-y-4">
          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-3 bg-red-500 p-4 rounded-lg">
              <div>
                <Label htmlFor="name" className="text-white">Trainer Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                  className="bg-red-100 border-gray-800 focus:border-gray-900 focus:ring-gray-900"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="age" className="text-white">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
                    className="bg-red-100 border-gray-800 focus:border-gray-900 focus:ring-gray-900"
                  />
                </div>
                <div>
                  <Label htmlFor="gender" className="text-white">Gender</Label>
                  <select
                    id="gender"
                    value={formData.gender}
                    onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value as 'male' | 'female' | 'other' }))}
                    className="w-full h-9 rounded-md border bg-red-100 border-gray-800 px-3 focus:border-gray-900 focus:ring-gray-900"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <Label htmlFor="region" className="text-white">Home Region</Label>
                <Input
                  id="region"
                  value={formData.region}
                  onChange={(e) => setFormData(prev => ({ ...prev, region: e.target.value }))}
                  className="bg-red-100 border-gray-800 focus:border-gray-900 focus:ring-gray-900"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="submit"
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-white border-2 border-gray-700"
                  disabled={isLoading}
                >
                  {isLoading ? 'Saving...' : 'Save Profile'}
                </Button>
                {profile && (
                  <Button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    variant="outline"
                    className="bg-red-500 hover:bg-red-400 text-white border-2 border-gray-700"
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          ) : (
            <>
              <div className="space-y-2 bg-red-500 p-4 rounded-lg text-white">
                <h2 className="text-xl font-bold border-b-2 border-gray-800 pb-2">{profile?.name}</h2>
                <div className="text-sm space-y-1">
                  <p>Age: {profile?.age || 'Not specified'}</p>
                  <p>Gender: {profile?.gender ? profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1) : 'Not specified'}</p>
                  <p>Region: {profile?.region || 'Not specified'}</p>
                </div>
                <Button
                  onClick={() => setIsEditing(true)}
                  variant="outline"
                  className="mt-2 bg-gray-800 hover:bg-gray-700 text-white border-2 border-gray-700"
                >
                  Edit Profile
                </Button>
              </div>

              {/* Trainer Stats */}
              {profile?.stats && (
                <div className="bg-red-500 rounded-lg border-2 border-gray-800 p-4 mt-4">
                  <h3 className="font-bold text-white mb-3 uppercase tracking-wide text-sm border-b-2 border-gray-800 pb-2">Trainer Stats</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-red-400 p-3 rounded-lg border-2 border-gray-800">
                      <p className="text-white text-xs uppercase">Pokemon Caught</p>
                      <p className="font-bold text-white text-lg">{profile.stats.totalPokemonCaught}</p>
                    </div>
                    <div className="bg-red-400 p-3 rounded-lg border-2 border-gray-800">
                      <p className="text-white text-xs uppercase">Unique Types</p>
                      <p className="font-bold text-white text-lg">{profile.stats.uniquePokemonTypes}</p>
                    </div>
                    <div className="bg-red-400 p-3 rounded-lg border-2 border-gray-800">
                      <p className="text-white text-xs uppercase">Highest Level</p>
                      <p className="font-bold text-white text-lg">{profile.stats.highestLevelPokemon}</p>
                    </div>
                    <div className="bg-red-400 p-3 rounded-lg border-2 border-gray-800">
                      <p className="text-white text-xs uppercase">Favorite Type</p>
                      <p className="font-bold text-white text-lg capitalize">{profile.stats.favoritePokemonType || 'None'}</p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

     
    </div>
  )
}
