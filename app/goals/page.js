"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const DEFAULT_GOALS = [
  { id: 1, label: "Fitness" },
  { id: 2, label: "Coding" },
  { id: 3, label: "Reading" },
  { id: 4, label: "Meditation" },
  { id: 5, label: "Nutrition" },
  { id: 6, label: "Finance" },
  { id: 7, label: "Creativity" },
  { id: 8, label: "Sleep" },
  { id: 9, label: "Travel" },
  { id: 10, label: "Music" },
  { id: 11, label: "Writing" },
  { id: 12, label: "Networking" },
  { id: 13, label: "Learning" },
  { id: 14, label: "Strength" },
  { id: 15, label: "Swimming" },
  { id: 16, label: "Cycling" },
  { id: 17, label: "Cooking" },
  { id: 18, label: "Photography" },
  { id: 19, label: "Mindfulness" },
  { id: 20, label: "Focus" },
]

export default function Goals() {
  const router = useRouter()
  const [goals, setGoals] = useState(DEFAULT_GOALS)
  const [selected, setSelected] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [showAddGoal, setShowAddGoal] = useState(false)
  const [newGoal, setNewGoal] = useState('')
  const MAX = 5

  const filtered = goals.filter(g =>
    g.label.toLowerCase().includes(search.toLowerCase())
  )

  const noResults = filtered.length === 0 && search.length > 0

  const toggle = (goal) => {
    if (selected.find(s => s.id === goal.id)) {
      setSelected(selected.filter(s => s.id !== goal.id))
    } else {
      if (selected.length >= MAX) return
      setSelected([...selected, goal])
    }
  }

  const addCustomGoal = () => {
    if (!newGoal.trim()) return
    const custom = {
      id: goals.length + 1,
      label: newGoal.trim(),
    }
    setGoals([...goals, custom])
    if (selected.length < MAX) setSelected([...selected, custom])
    setNewGoal('')
    setShowAddGoal(false)
    setSearch('')
  }

  const handleContinue = async () => {
    if (selected.length < 1) {
      alert('Please select at least 1 goal')
      return
    }
    setLoading(true)
    const name = localStorage.getItem('userName') || 'User'
    
    // API needs exactly 3 goals — pad if less
    const goalLabels = selected.map(g => g.label)
    while (goalLabels.length < 3) goalLabels.push(goalLabels[0])

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/goals_embedding`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name,
          goals: goalLabels.slice(0, 3)
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
    <main className="min-h-screen flex flex-col px-6 pt-12 pb-32 relative z-10">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-black text-gray-900">Your Goals</h1>
        <p className="text-gray-400 mt-1 text-sm">Pick up to 5 goals</p>
      </div>

      {/* Progress bar */}
      <div className="flex gap-1.5 mb-5">
        {Array.from({ length: MAX }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
              i < selected.length ? 'bg-[#6C63FF]' : 'bg-gray-200'
            }`}
          />
        ))}
      </div>

      {/* Selected pills */}
      {selected.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-4">
          {selected.map(g => (
            <span
              key={g.id}
              onClick={() => toggle(g)}
              className="bg-[#6C63FF] text-white px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer flex items-center gap-1"
            >
              {g.label}
              <span className="opacity-60 text-xs">✕</span>
            </span>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="relative mb-5">
        <input
          type="text"
          placeholder="Search or add goals"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-purple-400 text-sm shadow-sm"
        />
      </div>

      {/* No results — add custom */}
      {noResults && (
        <button
          onClick={() => { setNewGoal(search); setShowAddGoal(true) }}
          className="w-full py-3 border border-dashed border-purple-300 rounded-xl text-purple-500 font-medium mb-4 text-sm"
        >
          + Add "{search}" as custom goal
        </button>
      )}

      {/* Custom goal input */}
      {showAddGoal && (
        <div className="bg-white rounded-xl p-4 mb-4 border border-gray-200 shadow-sm">
          <p className="font-semibold text-gray-700 mb-2 text-sm">Name your goal</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={newGoal}
              onChange={(e) => setNewGoal(e.target.value)}
              placeholder="e.g. Marathon training"
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-purple-400 text-sm"
            />
            <button
              onClick={addCustomGoal}
              className="bg-[#6C63FF] text-white px-4 rounded-lg font-semibold text-sm"
            >
              Add
            </button>
          </div>
        </div>
      )}

      {/* Goals list */}
      <div className="space-y-2">
        {filtered.map(goal => {
          const isSelected = !!selected.find(s => s.id === goal.id)
          const isDisabled = !isSelected && selected.length >= MAX

          return (
            <button
              key={goal.id}
              onClick={() => toggle(goal)}
              disabled={isDisabled}
              className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl border transition-all text-left
                ${isSelected
                  ? 'bg-[#6C63FF] border-[#6C63FF] text-white'
                  : isDisabled
                    ? 'bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed'
                    : 'bg-white border-gray-200 text-gray-800 hover:border-purple-300'
                }`}
            >
              <span className="font-semibold text-sm">{goal.label}</span>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all
                ${isSelected ? 'bg-white border-white' : 'border-gray-300'}`}
              >
                {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-[#6C63FF]" />}
              </div>
            </button>
          )
        })}
      </div>

      {/* Fixed bottom */}
      <div className="fixed bottom-0 left-0 right-0 p-5 bg-[#F5F0E8] border-t border-gray-100">
        <button
          onClick={handleContinue}
          disabled={selected.length < 1 || loading}
          className={`w-full py-4 rounded-xl text-base font-black transition-all
            ${selected.length >= 1
              ? 'bg-[#6C63FF] text-white shadow-lg shadow-purple-200'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
        >
          {loading
            ? 'Setting up...'
            : selected.length >= 1
              ? `Continue with ${selected.length} goal${selected.length > 1 ? 's' : ''} →`
              : 'Select at least 1 goal'
          }
        </button>
      </div>

    </main>
  )
}