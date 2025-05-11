import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-red-500 to-red-600 p-4">
      <div className="max-w-md mx-auto pt-12">
        {/* Pokédex Frame */}
        <div className="bg-red-600 rounded-lg border-4 border-gray-800 p-6 shadow-2xl relative overflow-hidden">
          {/* Top LED Lights */}
          <div className="flex gap-2 absolute top-4 left-4">
            <div className="w-5 h-5 rounded-full bg-blue-400 border-2 border-white shadow-inner animate-pulse"></div>
            <div className="flex gap-1">
              <div className="w-3 h-3 rounded-full bg-red-400 border border-gray-800"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-400 border border-gray-800"></div>
              <div className="w-3 h-3 rounded-full bg-green-400 border border-gray-800"></div>
            </div>
          </div>

          {/* Main Content */}
          <div className="mt-12 mb-8">
            <div className="bg-green-100 rounded-lg border-2 border-gray-800 p-6 shadow-inner">
              <h1 className="text-2xl font-bold text-center mb-4 font-mono text-gray-800">
                POKÉDEX v2.0
              </h1>
              <p className="text-center text-gray-700 mb-6">
                Welcome to the next generation of Pokémon training. Track, manage, and grow your collection.
              </p>
            </div>
          </div>

          {/* Control Pad Design */}
          <div className="flex justify-center gap-6 mb-8">
            <div className="w-24 h-24 rounded-full border-4 border-gray-800 bg-gray-900"></div>
            <div className="grid grid-cols-2 gap-2">
              <div className="h-8 w-12 bg-gray-800 rounded"></div>
              <div className="h-8 w-12 bg-gray-800 rounded"></div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-4 relative z-10">
            <Link 
              href="/signup"
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-full border-2 border-gray-800 shadow-lg transform hover:scale-105 transition-transform text-center"
            >
              New Trainer
            </Link>
            <Link
              href="/login" 
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-full border-2 border-gray-800 shadow-lg transform hover:scale-105 transition-transform text-center"
            >
              Existing Trainer
            </Link>
          </div>

          {/* Decorative Details */}
          <div className="absolute bottom-4 right-4 flex gap-2">
            <div className="w-8 h-1 bg-gray-800 rounded"></div>
            <div className="w-8 h-1 bg-gray-800 rounded"></div>
          </div>
        </div>

        {/* Version Info */}
        <div className="text-center mt-6 text-white/80 text-sm">
          <p>Kanto Region Edition • v2.0.25</p>
        </div>
      </div>
    </div>
  );
}
