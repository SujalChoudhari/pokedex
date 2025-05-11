"use client"

import { usePathname, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export function Navigation() {
  const router = useRouter()
  const pathname = usePathname()
  
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
    <div className="bg-lime-200 border-b-2 border-lime-500 p-2 flex justify-between items-center">
      <h1 className="text-black font-bold text-sm sm:text-base uppercase tracking-wide">
        {pathname === '/dashboard' && "Trainer's Pokedex"}
        {pathname === '/profile' && "Trainer Profile"}
        {pathname === '/capture' && "Pokemon Scanner"}
      </h1>
      <div className="flex gap-2">
        {pathname !== '/profile' && (
          <Button
            onClick={() => router.push('/profile')}
            className="h-7 text-xs bg-blue-500 hover:bg-blue-600 text-white"
          >
            PROFILE
          </Button>
        )}
        {pathname !== '/dashboard' && pathname !== '/capture' && (
          <Button
            onClick={() => router.push('/dashboard')}
            className="h-7 text-xs bg-blue-500 hover:bg-blue-600 text-white"
          >
            POKEDEX
          </Button>
        )}
        <Button 
          variant="outline" 
          onClick={handleSignOut}
          className="h-7 text-xs bg-red-500 hover:bg-red-600 text-white border-red-700"
        >
          LOG OUT
        </Button>
      </div>
    </div>
  )
}
