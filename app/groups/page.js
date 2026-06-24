"use client"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Groups() {
  const router = useRouter()
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupDesc, setNewGroupDesc] = useState('')
  const [creating, setCreating] = useState(false)
  const [joined, setJoined] = useState([])

  useEffect(() => {
    fetchGroups()
    // load already joined groups from localStorage
    const stored = JSON.parse(localStorage.getItem('joinedGroups') || '[]')
    setJoined(stored.map(g => g.id))
  }, [])

  const fetchGroups = async () => {
    const userId = localStorage.getItem('userId')
    if (!userId || userId === 'null') return
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

  const joinGroup = async (groupId) => {
    const userId = localStorage.getItem('userId')
    setJoined(prev => [...prev, groupId])
    const group = groups.find(g => g.id === groupId)
    if (group) {
      const stored = JSON.parse(localStorage.getItem('joinedGroups') || '[]')
      localStorage.setItem('joinedGroups', JSON.stringify([...stored, group]))
    }
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/groups/${groupId}/join?user_id=${userId}`, {
        method: 'POST'
      })
    } catch (err) {
      console.error(err)
    }
  }

  const createGroup = async () => {
    const userId = localStorage.getItem('userId')
    if (!newGroupName || !newGroupDesc) return
    setCreating(true)

    const tempGroup = {
      id: Date.now().toString(),
      name: newGroupName,
      description: newGroupDesc
    }
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
        body: JSON.stringify({
          user_id: userId,
          name: tempGroup.name,
          description: tempGroup.description
        })
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
    <main className="min-h-screen flex flex-col pb-32 relative z-10">

      {/* Header — WhatsApp style */}
      <div className="bg-[#6C63FF] px-6 pt-12 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-white text-xl">←</button>
          <div>
            <h1 className="text-xl font-black text-white">Groups</h1>
            <p className="text-white/70 text-xs">{groups.length} groups found</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="bg-white/20 text-white px-3 py-1.5 rounded-full text-xs font-semibold"
        >
          + New
        </button>
      </div>

      {/* Create group form */}
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

      {/* Groups list — WhatsApp style */}
      <div className="mt-2">
        {!loading && groups.length === 0 && !showCreate && (
          <div className="text-center py-20">
            <p className="text-4xl mb-3">👥</p>
            <p className="font-bold text-gray-700">No groups found</p>
            <p className="text-sm text-gray-400 mt-1">Create one above!</p>
          </div>
        )}

        {groups.map(group => (
          <div
            key={group.id}
            onClick={() => joined.includes(group.id) && router.push(`/group/${group.id}`)}
            className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white"
          >
            {/* Avatar */}
            <div className="w-12 h-12 rounded-full bg-[#6C63FF] flex items-center justify-center flex-shrink-0">
              <span className="text-white font-black text-lg">
                {group.name?.charAt(0).toUpperCase()}
              </span>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900 text-sm">{group.name}</p>
              <p className="text-xs text-gray-400 truncate mt-0.5">{group.description}</p>
            </div>

            {/* Action */}
            {joined.includes(group.id) ? (
              <span className="text-gray-300 text-xl flex-shrink-0">›</span>
            ) : (
              <button
                onClick={(e) => { e.stopPropagation(); joinGroup(group.id) }}
                className="bg-[#6C63FF] text-white px-3 py-1.5 rounded-full text-xs font-semibold flex-shrink-0"
              >
                Join
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Fixed bottom */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#F5F0E8] border-t border-gray-100">
        <button
          onClick={() => router.push('/home')}
          className="w-full bg-[#6C63FF] text-white py-3.5 rounded-2xl font-black"
        >
          Go to Home →
        </button>
      </div>

    </main>
  )
}