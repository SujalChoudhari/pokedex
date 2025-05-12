import { SignupForm } from "@/components/auth/signup-form"

export default function SignUpPage() {
  return (
    <div className="min-h-screen w-screen bg-gradient-to-b from-red-500 to-red-700 flex items-center justify-center p-4">
      {/* Decorative Circles for Pokedex Background */}
      <div className="absolute top-4 left-4 w-8 h-8 bg-sky-400 rounded-full border-4 border-sky-600 shadow-lg"></div>
      <div className="absolute top-6 left-16 flex gap-2">
        <div className="w-4 h-4 bg-red-400 rounded-full border-2 border-red-600"></div>
        <div className="w-4 h-4 bg-yellow-400 rounded-full border-2 border-yellow-600"></div>
        <div className="w-4 h-4 bg-green-500 rounded-full border-2 border-green-700"></div>
      </div>
      
      <SignupForm />

      {/* Additional Decorative Elements */}
      <div className="absolute bottom-4 right-4 w-24 h-24 rounded-full border-8 border-white/20"></div>
      <div className="absolute top-4 right-4 w-16 h-16 rounded-full border-4 border-white/10"></div>
    </div>
  )
}
