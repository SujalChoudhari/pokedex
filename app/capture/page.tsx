"use client"

import { useRouter } from 'next/navigation'
import { CameraCapture } from "@/components/pokemon/camera-capture"

export default function CapturePage() {
  const router = useRouter()
  
  return (
    <div className="min-h-screen bg-slate-950">
      <CameraCapture
        onCaptureSuccess={() => {
          router.push("/dashboard")
        }}
      />
    </div>
  )
}
