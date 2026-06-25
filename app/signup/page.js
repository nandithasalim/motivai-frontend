"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Signup() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')

  const handleSignup = () => {
    if (!name || !password) return
    localStorage.setItem('userName', name)
    localStorage.removeItem('joinedGroups')  // clear old groups
    localStorage.removeItem('userId')        // clear old user
    router.push('/goals')
  }

  return (
    <main className="min-h-screen flex flex-col px-6 pt-16 relative z-10">
      
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-black text-gray-900">Create Account</h1>
        <p className="text-gray-500 mt-2">Start your productivity journey</p>
      </div>

      {/* Form */}
      <div className="space-y-4">
        <div>
          <label className="text-sm font-semibold text-gray-700">Your Name</label>
          <input
            type="text"
            placeholder="Nanditha"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full mt-1 px-4 py-3 rounded-2xl border-2 border-gray-200 bg-white focus:outline-none focus:border-purple-500 text-gray-900"
          />
        </div>

        <div>
          <label className="text-sm font-semibold text-gray-700">Password</label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full mt-1 px-4 py-3 rounded-2xl border-2 border-gray-200 bg-white focus:outline-none focus:border-purple-500 text-gray-900"
          />
        </div>

        <button
          onClick={handleSignup}
          className="w-full bg-[#6C63FF] text-white py-4 rounded-2xl text-lg font-bold mt-4 hover:bg-purple-700 transition-colors"
        >
          Continue →
        </button>

        
      </div>

    </main>
  )
}