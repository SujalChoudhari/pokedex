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
    <div className="space-y-4">
      {/* Avatar and Basic Info */}
      <div className="flex flex-col items-center sm:flex-row sm:items-start gap-4 p-3 bg-lime-200 rounded border border-lime-500">
        {/* Avatar */}
        <div className="relative w-32 h-32">
          <div className="w-full h-full rounded-full overflow-hidden border-4 border-lime-500 bg-lime-50">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt="Trainer Avatar"
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-lime-100 text-lime-500">
                No Avatar
              </div>
            )}
          </div>
          {isEditing && (
            <>
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-lime-500 hover:bg-lime-600 p-0"
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
        <div className="flex-1 space-y-4">
          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <Label htmlFor="name">Trainer Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                  className="bg-lime-50 border-lime-500"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
                    className="bg-lime-50 border-lime-500"
                  />
                </div>
                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <select
                    id="gender"
                    value={formData.gender}
                    onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value as 'male' | 'female' | 'other' }))}
                    className="w-full h-9 rounded-md border bg-lime-50 border-lime-500 px-3"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <Label htmlFor="region">Home Region</Label>
                <Input
                  id="region"
                  value={formData.region}
                  onChange={(e) => setFormData(prev => ({ ...prev, region: e.target.value }))}
                  className="bg-lime-50 border-lime-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="submit"
                  className="flex-1 bg-lime-500 hover:bg-lime-600 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? 'Saving...' : 'Save Profile'}
                </Button>
                {profile && (
                  <Button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    variant="outline"
                    className="bg-gray-200 hover:bg-gray-300"
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          ) : (
            <>
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-black">{profile?.name}</h2>
                <div className="text-sm text-gray-700 space-y-1">
                  <p>Age: {profile?.age || 'Not specified'}</p>
                  <p>Gender: {profile?.gender ? profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1) : 'Not specified'}</p>
                  <p>Region: {profile?.region || 'Not specified'}</p>
                </div>
                <Button
                  onClick={() => setIsEditing(true)}
                  variant="outline"
                  className="mt-2 bg-lime-500 hover:bg-lime-600 text-white"
                >
                  Edit Profile
                </Button>
              </div>

              {/* Trainer Stats */}
              {profile?.stats && (
                <div className="bg-lime-100 rounded border border-lime-500 p-3 mt-4">
                  <h3 className="font-bold text-black mb-2 uppercase tracking-wide text-sm">Trainer Stats</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-lime-50 p-2 rounded border border-lime-300">
                      <p className="text-gray-600 text-xs uppercase">Pokemon Caught</p>
                      <p className="font-bold text-black">{profile.stats.totalPokemonCaught}</p>
                    </div>
                    <div className="bg-lime-50 p-2 rounded border border-lime-300">
                      <p className="text-gray-600 text-xs uppercase">Unique Types</p>
                      <p className="font-bold text-black">{profile.stats.uniquePokemonTypes}</p>
                    </div>
                    <div className="bg-lime-50 p-2 rounded border border-lime-300">
                      <p className="text-gray-600 text-xs uppercase">Highest Level</p>
                      <p className="font-bold text-black">{profile.stats.highestLevelPokemon}</p>
                    </div>
                    <div className="bg-lime-50 p-2 rounded border border-lime-300">
                      <p className="text-gray-600 text-xs uppercase">Favorite Type</p>
                      <p className="font-bold text-black capitalize">{profile.stats.favoritePokemonType || 'None'}</p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Pokemon Team */}
      {profile?.captured_pokemon && profile.captured_pokemon.length > 0 && (
        <PokemonTeamSelector
          profile={profile}
          onTeamUpdate={(newTeam) => {
            onProfileUpdate({
              ...profile,
              team: newTeam
            });
          }}
        />
      )}
    </div>
  )
}
