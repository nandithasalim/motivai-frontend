"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const DEFAULT_GOALS = [
  { id: 1, emoji: "🏃", label: "Fitness" },
  { id: 2, emoji: "💻", label: "Coding" },
  { id: 3, emoji: "📚", label: "Reading" },
  { id: 4, emoji: "🧘", label: "Meditation" },
  { id: 5, emoji: "🥗", label: "Nutrition" },
  { id: 6, emoji: "💰", label: "Finance" },
  { id: 7, emoji: "🎨", label: "Creativity" },
  { id: 8, emoji: "😴", label: "Sleep" },
  { id: 9, emoji: "🌍", label: "Travel" },
  { id: 10, emoji: "🎵", label: "Music" },
  { id: 11, emoji: "✍️", label: "Writing" },
  { id: 12, emoji: "🤝", label: "Networking" },
  { id: 13, emoji: "🧠", label: "Learning" },
  { id: 14, emoji: "💪", label: "Strength" },
  { id: 15, emoji: "🏊", label: "Swimming" },
  { id: 16, emoji: "🚴", label: "Cycling" },
  { id: 17, emoji: "🍳", label: "Cooking" },
  { id: 18, emoji: "📷", label: "Photography" },
  { id: 19, emoji: "🌱", label: "Mindfulness" },
  { id: 20, emoji: "🎯", label: "Focus" },
]

export default function Goals() {
  const router = useRouter()
  const [goals, setGoals] = useState(DEFAULT_GOALS)
  const [selected, setSelected] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [showAddGoal, setShowAddGoal] = useState(false)
  const [newGoal, setNewGoal] = useState('')
  const [newEmoji, setNewEmoji] = useState('⭐')

  const filtered = goals.filter(g =>
    g.label.toLowerCase().includes(search.toLowerCase())
  )

  const noResults = filtered.length === 0 && search.length > 0

  const toggle = (goal) => {
    if (selected.find(s => s.id === goal.id)) {
      setSelected(selected.filter(s => s.id !== goal.id))
    } else {
      if (selected.length >= 3) return
      setSelected([...selected, goal])
    }
  }

  const addCustomGoal = () => {
    if (!newGoal.trim()) return
    const custom = {
      id: goals.length + 1,
      emoji: newEmoji,
      label: newGoal.trim()
    }
    setGoals([...goals, custom])
    setSelected([...selected, custom].slice(0, 3))
    setNewGoal('')
    setShowAddGoal(false)
    setSearch('')
  }

  const handleContinue = async () => {
    if (selected.length < 3) {
      alert('Please select exactly 3 goals')
      return
    }
    setLoading(true)
    const name = localStorage.getItem('userName') || 'User'
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/goals_embedding`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name,
          goals: selected.map(g => g.label)
        })
      })
      const data = await res.json()
      localStorage.setItem('userId', data.user_id)
      localStorage.setItem('userGoals', JSON.stringify(selected.map(g => g.label)))
      router.push('/groups')
    } catch (err) {
      alert('Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex flex-col px-6 pt-12 pb-32 relative z-10 bg-transparent">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-black text-gray-900">Pick Your Goals</h1>
        <p className="text-gray-500 mt-1">Select exactly 3 goals</p>
      </div>

      {/* Progress */}
      <div className="flex gap-2 mb-4">
        {[1,2,3].map(i => (
          <div key={i} className={`h-2 flex-1 rounded-full transition-colors ${i <= selected.length ? 'bg-purple-500' : 'bg-gray-200'}`} />
        ))}
      </div>

      {/* Selected goals pills */}
      {selected.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-4">
          {selected.map(g => (
            <span
              key={g.id}
              onClick={() => toggle(g)}
              className="bg-purple-500 text-white px-3 py-1 rounded-full text-sm font-semibold cursor-pointer"
            >
              {g.emoji} {g.label} ✕
            </span>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="relative mb-4">
        <span className="absolute left-3 top-3 text-gray-400">🔍</span>
        <input
          type="text"
          placeholder="Search goals..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-2xl border-2 border-gray-200 bg-white focus:outline-none focus:border-purple-500"
        />
      </div>

      {/* Add custom goal */}
      {noResults && !showAddGoal && (
        <button
          onClick={() => { setNewGoal(search); setShowAddGoal(true) }}
          className="w-full py-3 border-2 border-dashed border-purple-400 rounded-2xl text-purple-600 font-semibold mb-4"
        >
          + Add "{search}" as new goal
        </button>
      )}

      {showAddGoal && (
        <div className="bg-white rounded-2xl p-4 mb-4 border-2 border-purple-200">
          <p className="font-semibold text-gray-700 mb-2">Add custom goal</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={newEmoji}
              onChange={(e) => setNewEmoji(e.target.value)}
              className="w-12 text-center border-2 border-gray-200 rounded-xl py-2"
              maxLength={2}
            />
            <input
              type="text"
              value={newGoal}
              onChange={(e) => setNewGoal(e.target.value)}
              placeholder="Goal name"
              className="flex-1 border-2 border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-purple-500"
            />
            <button
              onClick={addCustomGoal}
              className="bg-purple-500 text-white px-4 rounded-xl font-semibold"
            >
              Add
            </button>
          </div>
        </div>
      )}

      {/* Goals grid */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {filtered.map(goal => {
          const isSelected = selected.find(s => s.id === goal.id)
          const isDisabled = !isSelected && selected.length >= 3
          return (
            <button
              key={goal.id}
              onClick={() => toggle(goal)}
              disabled={isDisabled}
              className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all
                ${isSelected
                  ? 'bg-purple-500 border-purple-500 text-white'
                  : isDisabled
                    ? 'bg-gray-100 border-gray-100 text-gray-300'
                    : 'bg-white border-gray-200 text-gray-700 hover:border-purple-300'
                }`}
            >
              <span className="text-2xl mb-1">{goal.emoji}</span>
              <span className="text-xs font-semibold">{goal.label}</span>
            </button>
          )
        })}
      </div>

      {/* Fixed bottom button */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-[#F5F0E8]">
        <button
          onClick={handleContinue}
          disabled={selected.length !== 3 || loading}
          className={`w-full py-4 rounded-2xl text-lg font-bold transition-colors
            ${selected.length === 3
              ? 'bg-[#6C63FF] text-white hover:bg-purple-700'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
        >
          {loading ? 'Setting up...' : `Continue (${selected.length}/3)`}
        </button>
      </div>

    </main>
  )
}

