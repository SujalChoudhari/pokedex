"use client"

export function Loader({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div
        className="
          relative
          h-12 w-12 
          rounded-full 
          border-2 border-black 
          overflow-hidden 
          animate-spin
        "
      >
        {/* Top Red Half */}
        <div className="absolute top-0 left-0 w-full h-1/2 bg-red-500"></div>
        {/* Bottom White Half */}
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-white"></div>

        {/* Central Black Band */}
        <div
          className="
            absolute 
            top-1/2 
            left-0 
            w-full 
            h-2.5 {/* 10px height */}
            bg-black 
            transform 
            -translate-y-1/2 
            z-10
          "
        ></div>

        {/* Central Button */}
        <div
          className="
            absolute 
            top-1/2 
            left-1/2 
            transform 
            -translate-x-1/2 
            -translate-y-1/2 
            w-5 h-5 {/* 20px diameter */}
            bg-white 
            rounded-full 
            border-2 border-black 
            z-20
          "
        ></div>
      </div>
    </div>
  )
}
