"use client"
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

export default function Reels() {
  const router = useRouter()
  const [reels, setReels] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    fetchReels()
  }, [])

  const fetchReels = async () => {
    const userId = localStorage.getItem('userId')
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/feed_return?user_id=${userId}`)
      const data = await res.json()
      setReels(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const COLORS = [
    'from-purple-500 to-indigo-600',
    'from-orange-400 to-pink-500',
    'from-green-400 to-teal-500',
    'from-blue-400 to-purple-500',
    'from-pink-400 to-rose-500',
  ]

  return (
    <main className="h-screen overflow-hidden bg-black relative">

      {/* Back button */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center px-4 pt-12 pb-4">
        <button
          onClick={() => router.back()}
          className="text-white text-2xl bg-black/30 w-10 h-10 rounded-full flex items-center justify-center"
        >
          ←
        </button>
        <p className="text-white font-bold ml-3 text-lg">Reels</p>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center items-center h-full">
          <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin"/>
        </div>
      )}

      {/* Reels - vertical scroll */}
      {!loading && (
        <div className="h-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide">
          {reels.length === 0 && (
            <div className="h-screen flex flex-col items-center justify-center">
              <p className="text-white text-4xl mb-4">🎬</p>
              <p className="text-white font-bold">No reels yet</p>
              <p className="text-white/50 text-sm mt-1">Check back soon!</p>
            </div>
          )}

          {reels.map((reel, index) => (
            <div
              key={reel.id}
              className={`h-screen w-full snap-start flex flex-col items-center justify-end pb-20 relative bg-gradient-to-b ${COLORS[index % COLORS.length]}`}
            >
              {/* Background design */}
              <div className="absolute inset-0 flex items-center justify-center opacity-10">
                <p className="text-white text-9xl font-black">{index + 1}</p>
              </div>

              {/* Tags */}
              <div className="absolute top-24 left-4 flex gap-2 flex-wrap">
                {reel.tags?.map(tag => (
                  <span key={tag} className="bg-white/20 text-white px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm">
                    #{tag}
                  </span>
                ))}
              </div>

              {/* Right side actions */}
              <div className="absolute right-4 bottom-32 flex flex-col items-center gap-6">
                <button className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <span className="text-xl">❤️</span>
                  </div>
                  <span className="text-white text-xs">Like</span>
                </button>
                <button className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <span className="text-xl">💬</span>
                  </div>
                  <span className="text-white text-xs">React</span>
                </button>
                <button className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <span className="text-xl">📤</span>
                  </div>
                  <span className="text-white text-xs">Share</span>
                </button>
              </div>

              {/* Content */}
              <div className="px-6 w-full">
                <h2 className="text-white font-black text-2xl mb-2 drop-shadow-lg">
                  {reel.title}
                </h2>
                <p className="text-white/80 text-sm leading-relaxed">
                  {reel.summary}
                </p>
              </div>

            </div>
          ))}
        </div>
      )}

    </main>
  )
}