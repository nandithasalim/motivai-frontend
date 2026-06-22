"use client"
import { useRouter } from 'next/navigation'
import Lottie from 'lottie-react'
import { useEffect, useState } from 'react'

export default function Home() {
  const router = useRouter()
  const [animationData, setAnimationData] = useState(null)

  useEffect(() => {
    fetch('https://assets5.lottiefiles.com/packages/lf20_wd1udlcz.json')
      .then(res => res.json())
      .then(data => setAnimationData(data))
  }, [])

  return (
    <main className="min-h-screen bg-[#F5F0E8] flex flex-col items-center justify-center px-8 relative overflow-hidden">
      
      {/* Grid background */}
      <div className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: 'linear-gradient(#ccc 1px, transparent 1px), linear-gradient(90deg, #ccc 1px, transparent 1px)',
          backgroundSize: '30px 30px'
        }}
      />

      {/* Lottie Animation */}
      <div className="relative z-10 mb-4 w-72 h-72">
        {animationData && (
          <Lottie animationData={animationData} loop={true} />
        )}
      </div>

      {/* Text */}
      <div className="relative z-10 text-center space-y-2 mb-10">
        <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tight">
          Unleash Your
        </h1>
        <div className="inline-block bg-yellow-400 px-4 py-1 border-2 border-gray-900">
          <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tight">
            Productivity
          </h1>
        </div>
        <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tight">
          Potential
        </h1>
      </div>

      {/* Button */}
      <div className="relative z-10 w-full max-w-sm">
        <button
          onClick={() => router.push('/signup')}
          className="w-full bg-[#E8734A] text-white py-4 rounded-full text-lg font-bold shadow-lg hover:bg-[#d4613a] transition-colors"
        >
          Let's Start
        </button>
      </div>

    </main>
  )
}