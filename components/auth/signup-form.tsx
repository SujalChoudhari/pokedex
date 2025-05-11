"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { supabase } from "@/lib/supabase"

export function SignUpForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (signUpError) throw signUpError

      // Create default trainer profile
      const { error: profileError } = await supabase
        .from('trainers')
        .insert([{
          user_id: data.user?.id,
          name: email.split('@')[0], // Use email username as default name
          stats: {
            totalPokemonCaught: 0,
            uniquePokemonTypes: 0,
            highestLevelPokemon: 0,
            favoritePokemonType: '',
            winRate: 0
          }
        }])

      if (profileError) {
        console.error('Error creating trainer profile:', profileError)
        // Continue anyway as the user can create profile later
      }

      router.push("/login")
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-[350px] mx-auto font-mono">
      {/* Kanto Pokedex Mini Frame */}
      <div className="w-full bg-red-700 shadow-lg border-red-900 rounded-lg overflow-hidden">

        
        {/* Screen Area */}
        <div className="m-2 bg-gray-700 rounded border-2 border-gray-800 shadow-inner p-2">
          <div className="bg-lime-100 rounded overflow-hidden border-2 border-lime-500">
            {/* Header */}
            <div className="bg-lime-200 border-b-2 border-lime-500 p-3">
              <h1 className="text-black font-bold text-lg uppercase tracking-wide text-center">Sign Up</h1>
              <p className="text-gray-700 text-sm text-center mt-1">Create a new account to access your Pokedex</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSignUp} className="p-4 space-y-4">
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-gray-800 font-medium">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-lime-50 border-lime-500 text-gray-800 placeholder:text-gray-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-gray-800 font-medium">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-lime-50 border-lime-500 text-gray-800 placeholder:text-gray-500"
                  />
                </div>
                {error && <p className="text-sm text-red-600 bg-red-100 p-2 rounded border border-red-200">{error}</p>}
              </div>

              <div className="pt-2 space-y-3">
                <Button 
                  type="submit" 
                  className="w-full bg-red-500 hover:bg-red-600 text-white border-b-4 border-red-700 active:border-b-0 active:mt-1 transition-all uppercase font-bold tracking-wide" 
                  disabled={loading}
                >
                  {loading ? "Creating..." : "Sign Up"}
                </Button>
                <p className="text-sm text-gray-600 text-center">
                  Already have an account?{" "}
                  <Link href="/login" className="text-red-500 hover:text-red-600 font-bold">
                    Login
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
