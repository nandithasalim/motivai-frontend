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
  }, [])

  const fetchGroups = async () => {
    const userId = localStorage.getItem('userId')
    console.log('fetching groups for userId:', userId)
    if (!userId || userId === 'null') return
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/groups/match?user_id=${userId}`)
      const data = await res.json()
      console.log('groups data:', data)
      setGroups(data.matched_groups || [])
    } catch (err) {
      console.error('fetch groups error:', err)
    } finally {
      setLoading(false)
    }
  }

  const joinGroup = async (groupId) => {
    const userId = localStorage.getItem('userId')
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/groups/${groupId}/join?user_id=${userId}`, {
        method: 'POST'
      })
      setJoined([...joined, groupId])
    } catch (err) {
      console.error(err)
    }
  }

  const createGroup = async () => {
    const userId = localStorage.getItem('userId')
    if (!newGroupName || !newGroupDesc) return
    setCreating(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/groups/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          name: newGroupName,
          description: newGroupDesc
        })
      })
      const data = await res.json()
      
      // add to groups list directly — don't wait for match
      const newGroup = {
        id: data.group_id,
        name: newGroupName,
        description: newGroupDesc
      }
      setGroups(prev => [...prev, newGroup])
      setJoined(prev => [...prev, data.group_id])
      setShowCreate(false)
      setNewGroupName('')
      setNewGroupDesc('')
    } catch (err) {
      console.error(err)
    } finally {
      setCreating(false)
    }
  }

  return (
    <main className="min-h-screen flex flex-col px-6 pt-12 pb-32 relative z-10">

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-gray-400 text-xl">←</button>
        <div>
          <h1 className="text-2xl font-black text-gray-900">Groups</h1>
          <p className="text-gray-400 text-sm">Find your community</p>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-[#6C63FF] border-t-transparent rounded-full animate-spin"/>
        </div>
      )}

      {/* Groups list */}
      {!loading && groups.map(group => (
        <div key={group.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm mb-3">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="font-bold text-gray-900">{group.name}</h3>
              <p className="text-sm text-gray-400 mt-0.5">{group.description}</p>
            </div>
            <div className="flex items-center gap-2 ml-3">
              <button
                onClick={() => joinGroup(group.id)}
                disabled={joined.includes(group.id)}
                className={`px-4 py-2 rounded-xl font-semibold text-sm transition-colors
                  ${joined.includes(group.id)
                    ? 'bg-green-100 text-green-600'
                    : 'bg-[#6C63FF] text-white'
                  }`}
              >
                {joined.includes(group.id) ? '✓ Joined' : 'Join'}
              </button>
              {joined.includes(group.id) && (
                <button
                  onClick={() => router.push(`/group/${group.id}`)}
                  className="bg-purple-100 text-purple-600 px-3 py-2 rounded-xl text-sm font-semibold"
                >
                  View →
                </button>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* No groups */}
      {!loading && groups.length === 0 && (
        <div className="text-center py-10">
          <p className="text-gray-400">No groups found</p>
          <p className="text-gray-300 text-sm mt-1">Create one below!</p>
        </div>
      )}

      {/* Create group */}
      <button
        onClick={() => setShowCreate(!showCreate)}
        className="w-full py-3 border-2 border-dashed border-purple-300 rounded-2xl text-purple-500 font-semibold mb-4 mt-2"
      >
        + Create New Group
      </button>

      {showCreate && (
        <div className="bg-white rounded-2xl p-4 border border-purple-100 mb-4 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-3">Create Group</h3>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Group name (e.g. Kerala Runners)"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-purple-400 text-sm"
            />
            <textarea
              placeholder="Description (e.g. Runners in Kerala training for marathons)"
              value={newGroupDesc}
              onChange={(e) => setNewGroupDesc(e.target.value)}
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-purple-400 text-sm resize-none"
            />
            <button
              onClick={createGroup}
              disabled={creating}
              className="w-full bg-[#6C63FF] text-white py-3 rounded-xl font-bold text-sm"
            >
              {creating ? 'Creating...' : 'Create Group'}
            </button>
          </div>
        </div>
      )}

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