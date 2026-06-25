"use client"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function FindGroups() {
  const router = useRouter()
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [joined, setJoined] = useState([])
  const [showCreate, setShowCreate] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupDesc, setNewGroupDesc] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    // wake up Render
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/`)
    fetchMatchedGroups()
    const stored = JSON.parse(localStorage.getItem('joinedGroups') || '[]')
    setJoined(stored.map(g => g.id))
  }, [])

  const fetchMatchedGroups = async () => {
    const userId = localStorage.getItem('userId')
    if (!userId) return
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/groups/match?user_id=${userId}`)
      const data = await res.json()
      setGroups(data.matched_groups || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const joinGroup = async (group) => {
    const userId = localStorage.getItem('userId')
    
    // optimistic update
    setJoined(prev => [...prev, group.id])
    const stored = JSON.parse(localStorage.getItem('joinedGroups') || '[]')
    localStorage.setItem('joinedGroups', JSON.stringify([...stored, group]))
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/groups/${group.id}/join?user_id=${userId}`, {
        method: 'POST'
      })
      if (!res.ok) {
        console.error('Join failed:', res.status)
        // retry once
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/groups/${group.id}/join?user_id=${userId}`, {
          method: 'POST'
        })
      }
    } catch (err) {
      console.error('Join error:', err)
      // retry once
      try {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/groups/${group.id}/join?user_id=${userId}`, {
          method: 'POST'
        })
      } catch (e) {
        console.error('Retry failed:', e)
      }
    }
  }

  const createGroup = async () => {
    const userId = localStorage.getItem('userId')
    if (!newGroupName || !newGroupDesc) return
    setCreating(true)
    const tempGroup = { id: Date.now().toString(), name: newGroupName, description: newGroupDesc }
    setGroups(prev => [...prev, tempGroup])
    setJoined(prev => [...prev, tempGroup.id])
    const stored = JSON.parse(localStorage.getItem('joinedGroups') || '[]')
    localStorage.setItem('joinedGroups', JSON.stringify([...stored, tempGroup]))
    setShowCreate(false)
    setNewGroupName('')
    setNewGroupDesc('')
    setCreating(false)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/groups/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, name: tempGroup.name, description: tempGroup.description })
      })
      const data = await res.json()
      const updated = JSON.parse(localStorage.getItem('joinedGroups') || '[]')
        .map(g => g.id === tempGroup.id ? { ...g, id: data.group_id } : g)
      localStorage.setItem('joinedGroups', JSON.stringify(updated))
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <main className="min-h-screen flex flex-col pb-20 relative z-10">

      {/* Header */}
      <div className="bg-[#6C63FF] px-5 pt-14 pb-4 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-white text-2xl">←</button>
        <div className="flex-1">
          <p className="text-white font-black text-lg">Find Groups</p>
          <p className="text-white/60 text-xs">Matched to your goals</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="bg-white text-[#6C63FF] px-3 py-1.5 rounded-full text-xs font-black"
        >
          + New
        </button>
      </div>

      {/* Create group */}
      {showCreate && (
        <div className="mx-4 mt-4 bg-white rounded-2xl p-4 border border-purple-100 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-3">Create Group</h3>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Group name"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-purple-400 text-sm"
            />
            <textarea
              placeholder="What is this group about?"
              value={newGroupDesc}
              onChange={(e) => setNewGroupDesc(e.target.value)}
              rows={2}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-purple-400 text-sm resize-none"
            />
            <button
              onClick={createGroup}
              disabled={creating || !newGroupName || !newGroupDesc}
              className="w-full bg-[#6C63FF] text-white py-2.5 rounded-xl font-bold text-sm"
            >
              {creating ? 'Creating...' : 'Create Group'}
            </button>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-[#6C63FF] border-t-transparent rounded-full animate-spin"/>
        </div>
      )}

      {/* Groups list */}
      <div className="mt-2">
        {!loading && groups.length === 0 && (
          <div className="text-center py-20">
            <p className="text-4xl mb-3">👥</p>
            <p className="font-bold text-gray-700">No matching groups found</p>
            <p className="text-sm text-gray-400 mt-1">Create one above!</p>
          </div>
        )}

        {groups.map(group => (
          <div
            key={group.id}
            className="flex items-center gap-3 px-4 py-4 border-b border-gray-100 bg-white"
          >
            <div className="w-12 h-12 rounded-full bg-[#6C63FF] flex items-center justify-center flex-shrink-0">
              <span className="text-white font-black text-lg">{group.name?.charAt(0).toUpperCase()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900 text-sm">{group.name}</p>
              <p className="text-xs text-gray-400 truncate">{group.description}</p>
            </div>
            {joined.includes(group.id) ? (
              <button
                onClick={() => router.push(`/group/${group.id}`)}
                className="bg-green-100 text-green-600 px-3 py-1.5 rounded-full text-xs font-semibold flex-shrink-0"
              >
                ✓ Open
              </button>
            ) : (
              <button
                onClick={() => joinGroup(group)}
                className="bg-[#6C63FF] text-white px-3 py-1.5 rounded-full text-xs font-semibold flex-shrink-0"
              >
                Join
              </button>
            )}
          </div>
        ))}
      </div>
      {/* Fixed bottom */}
<div className="fixed bottom-0 left-0 right-0 p-5 bg-[#F5F0E8] border-t border-gray-100">
  <button
    onClick={() => router.push('/home')}
    className="w-full bg-[#6C63FF] text-white py-4 rounded-2xl font-black"
  >
    Continue to Home →
  </button>
</div>
    </main>
  )
}