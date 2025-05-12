"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { motion } from "framer-motion"

export function SignupForm() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        if (password !== confirmPassword) {
            setError("Passwords do not match")
            setLoading(false)
            return
        }

        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
            })

            if (error) throw error

            const { data: { session } } = await supabase.auth.getSession()
            console.log("Session after signup:", session)

            if (session) {
                router.push("/dashboard")
            } else {
                throw new Error("Failed to get session after signup")
            }
        } catch (error: any) {
            console.error("Signup error:", error)
            setError(error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <motion.div 
            className="w-[350px] mx-auto font-mono"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            {/* Kanto Pokedex Mini Frame */}
            <div className="w-full bg-gradient-to-b from-red-600 to-red-700 shadow-lg border-4 border-red-800 rounded-lg overflow-hidden">
                {/* Top LED Lights */}
                <motion.div 
                    className="flex items-center gap-4 p-3 border-b-4 border-red-800"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                >
                    <div className="w-5 h-5 rounded-full bg-blue-400 border-2 border-blue-600 animate-pulse shadow-lg"></div>
                    <div className="flex gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-400 border border-red-600"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-400 border border-yellow-600"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500 border border-green-700"></div>
                    </div>
                </motion.div>

                {/* Screen Area */}
                <div className="m-4 bg-gray-800 rounded-lg border-4 border-gray-900 shadow-inner p-2">
                    <motion.div 
                        className="bg-gradient-to-b from-lime-100 to-lime-200 rounded-lg overflow-hidden border-2 border-lime-500"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4 }}
                    >
                        {/* Header */}
                        <div className="bg-lime-300 border-b-2 border-lime-500 p-4">
                            <motion.h1 
                                className="text-black font-bold text-xl uppercase tracking-wide text-center"
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                            >
                                Sign Up
                            </motion.h1>
                            <motion.p 
                                className="text-gray-700 text-sm text-center mt-1"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.6 }}
                            >
                                Start your Pokemon journey!
                            </motion.p>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSignup} className="p-6 space-y-4">
                            <motion.div 
                                className="space-y-3"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.7 }}
                            >
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-gray-800 font-medium">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="Enter your email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="bg-white border-2 border-gray-300 focus:border-gray-400 text-gray-800 placeholder:text-gray-400"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="password" className="text-gray-800 font-medium">Password</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="Choose a password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="bg-white border-2 border-gray-300 focus:border-gray-400 text-gray-800 placeholder:text-gray-400"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword" className="text-gray-800 font-medium">Confirm Password</Label>
                                    <Input
                                        id="confirmPassword"
                                        type="password"
                                        placeholder="Confirm your password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        className="bg-white border-2 border-gray-300 focus:border-gray-400 text-gray-800 placeholder:text-gray-400"
                                    />
                                </div>
                                {error && (
                                    <motion.p 
                                        className="text-sm text-red-600 bg-red-100 p-3 rounded-lg border border-red-200"
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                    >
                                        {error}
                                    </motion.p>
                                )}
                            </motion.div>

                            <motion.div 
                                className="pt-2 space-y-4"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.8 }}
                            >
                                <Button 
                                    type="submit" 
                                    className="w-full bg-red-500 hover:bg-red-600 text-white border-b-4 border-red-700 active:border-b-0 active:mt-1 transition-all uppercase font-bold tracking-wide h-12" 
                                    disabled={loading}
                                >
                                    {loading ? "Creating Account..." : "Sign Up"}
                                </Button>
                                <p className="text-sm text-gray-600 text-center">
                                    Already have an account?{" "}
                                    <Link href="/login" className="text-red-500 hover:text-red-600 font-bold">
                                        Login
                                    </Link>
                                </p>
                            </motion.div>
                        </form>
                    </motion.div>
                </div>

                {/* Bottom Decorative Elements */}
                <div className="p-4 flex justify-center">
                    <div className="w-16 h-16 rounded-full bg-gray-800 border-4 border-gray-900 flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full bg-gray-700 border-2 border-gray-600"></div>
                    </div>
                </div>
            </div>
        </motion.div>
    )
}
