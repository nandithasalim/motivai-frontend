"use client"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()
  const [userName, setUserName] = useState('')
  const [tasks, setTasks] = useState([])
  const [newTask, setNewTask] = useState('')
  const [activeTab, setActiveTab] = useState('tasks')
  const [feed, setFeed] = useState([])
  const [loadingFeed, setLoadingFeed] = useState(false)
  const [showGroupModal, setShowGroupModal] = useState(false)
  const [joinedGroups, setJoinedGroups] = useState([])

  const pending = tasks.filter(t => !t.completed)
  const completed = tasks.filter(t => t.completed)

  useEffect(() => {
    const name = localStorage.getItem('userName') || 'Friend'
    setUserName(name)
    const stored = JSON.parse(localStorage.getItem('joinedGroups') || '[]')
    setJoinedGroups(stored)
    const userId = localStorage.getItem('userId')
    if (userId && userId !== 'null') {
      fetchFeed()
    }
  }, [])

  const fetchFeed = async () => {
    const userId = localStorage.getItem('userId')
    if (!userId || userId === 'null') return
    setLoadingFeed(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/feed_return?user_id=${userId}`)
      const data = await res.json()
      setFeed(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingFeed(false)
    }
  }
  useEffect(() => {
    const name = localStorage.getItem('userName') || 'Friend'
    setUserName(name)
    const stored = JSON.parse(localStorage.getItem('joinedGroups') || '[]')
    setJoinedGroups(stored)
    const userId = localStorage.getItem('userId')
    if (userId && userId !== 'null') {
      fetchFeed()
      fetchTasks(userId)  // add this
    }
  }, [])
  
  const fetchTasks = async (userId) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/tasks/${userId}`)
      const data = await res.json()
      const now = new Date()
      setTasks(data
        .filter(t => {
          // show pending always, show completed only if within 24 hours
          if (!t.completed) return true
          const created = new Date(t.created_at)
          const hours = (now - created) / (1000 * 60 * 60)
          return hours < 24
        })
        .map(t => ({
          id: t.id,
          description: t.description,
          completed: t.completed,
          created_at: t.created_at
        }))
      )
    } catch (err) {
      console.error(err)
    }
  }
  const addTask = async () => {
    if (!newTask.trim()) return
    const userId = localStorage.getItem('userId')
    const tempTask = { id: Date.now(), description: newTask, completed: false }
    setTasks(prev => [...prev, tempTask])
    setNewTask('')
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, description: newTask })
      })
      const data = await res.json()
      setTasks(prev => prev.map(t => t.id === tempTask.id ? { ...t, id: data.task_id } : t))
    } catch (err) {
      setTasks(prev => prev.filter(t => t.id !== tempTask.id))
      console.error(err)
    }
  }

  const completeTask = async (taskId) => {
    const userId = localStorage.getItem('userId')
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: true } : t))
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/tasks/${taskId}/complete?user_id=${userId}`, {
        method: 'PATCH'
      })
    } catch (err) {
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: false } : t))
      console.error(err)
    }
  }

  const sendToGroup = async (group) => {
    const userId = localStorage.getItem('userId')
    localStorage.setItem('tasksToSend', JSON.stringify(completed))
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/groups/${group.id}/post?user_id=${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          completed_tasks: completed.map(t => t.description),
          uncompleted_tasks: []
        })
      })
      // clear completed tasks after sending
      setTasks(prev => prev.filter(t => !t.completed))
    } catch (err) {
      console.error(err)
    }
    setShowGroupModal(false)
    router.push(`/group/${group.id}`)
  }

  return (
    <main className="min-h-screen flex flex-col relative z-10">

      {/* Header */}
      <div className="px-6 pt-12 pb-4">
        <p className="text-gray-400 text-sm">Good morning 👋</p>
        <h1 className="text-2xl font-black text-gray-900">Hello, {userName}!</h1>
      </div>

      {/* Tabs */}
      <div className="flex px-6 gap-2 mb-4">
        {['tasks', 'feed', 'groups'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-full text-sm font-semibold capitalize transition-all
              ${activeTab === tab
                ? 'bg-[#6C63FF] text-white'
                : 'bg-white text-gray-500 border border-gray-200'
              }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tasks Tab */}
      {activeTab === 'tasks' && (
        <div className="px-6 flex flex-col gap-4 pb-40">
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-400 font-medium">TODAY</p>
            <p className="text-lg font-black text-gray-900">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
            <p className="text-sm text-gray-400 mt-1">{pending.length} tasks remaining</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center px-4 py-3 gap-3">
              <div className="w-5 h-5 rounded-full border-2 border-gray-200"/>
              <input
                type="text"
                placeholder="Add a new task..."
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addTask()}
                className="flex-1 text-sm text-gray-700 focus:outline-none bg-transparent"
              />
              <button
                onClick={addTask}
                className="bg-[#6C63FF] text-white w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold"
              >
                +
              </button>
            </div>
          </div>

          {pending.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2 px-1">Pending</p>
              <div className="flex flex-col gap-2">
                {pending.map(task => (
                  <div key={task.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-3">
                    <button
                      onClick={() => completeTask(task.id)}
                      className="w-6 h-6 rounded-full border-2 border-gray-300 hover:border-[#6C63FF] flex items-center justify-center transition-all flex-shrink-0"
                    />
                    <p className="text-sm font-semibold text-gray-800 flex-1">{task.description}</p>
                    <div className="bg-yellow-100 text-yellow-600 px-2 py-0.5 rounded-full text-xs font-medium">Todo</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {completed.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2 px-1">Completed</p>
              <div className="flex flex-col gap-2">
                {completed.map(task => (
                  <div key={task.id} className="bg-gray-50 rounded-2xl p-4 border border-gray-100 flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <p className="text-sm font-medium text-gray-400 line-through flex-1">{task.description}</p>
                    <div className="bg-green-100 text-green-600 px-2 py-0.5 rounded-full text-xs font-medium">Done</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tasks.length === 0 && (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">✅</p>
              <p className="font-bold text-gray-700">No tasks yet</p>
              <p className="text-sm text-gray-400 mt-1">Add your first task above</p>
            </div>
          )}
        </div>
      )}

      {/* Feed Tab */}
      {activeTab === 'feed' && (
        <div className="px-6 flex flex-col gap-3 pb-20">
          <button
            onClick={() => router.push('/reels')}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-2xl font-bold text-sm"
          >
            🎬 Watch Reels
          </button>
          {loadingFeed && (
            <div className="flex justify-center py-10">
              <div className="w-8 h-8 border-4 border-[#6C63FF] border-t-transparent rounded-full animate-spin"/>
            </div>
          )}
          {!loadingFeed && feed.map(reel => (
            <div key={reel.id} className="bg-white rounded-2xl p-4 border border-gray-200">
              <h3 className="font-bold text-gray-900 text-sm">{reel.title}</h3>
              <p className="text-gray-500 text-xs mt-1">{reel.summary}</p>
              <div className="flex gap-2 mt-3 flex-wrap">
                {reel.tags?.map(tag => (
                  <span key={tag} className="bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full text-xs font-medium">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
          {!loadingFeed && feed.length === 0 && (
            <div className="text-center py-10">
              <p className="text-gray-400 text-sm">No reels yet. Check back soon!</p>
            </div>
          )}
        </div>
      )}

      {/* Groups Tab */}
      {activeTab === 'groups' && (
        <div className="flex flex-col pb-20">
          <div className="px-4 py-3">
            <button
              onClick={() => router.push('/groups')}
              className="w-full py-3 border border-dashed border-purple-300 rounded-2xl text-purple-500 font-medium text-sm"
            >
              + Find or Create a Group
            </button>
          </div>

          {joinedGroups.length === 0 && (
            <div className="text-center py-10">
              <p className="text-gray-400 text-sm">No groups joined yet</p>
            </div>
          )}

          {joinedGroups.map(group => (
            <div
              key={group.id}
              onClick={() => router.push(`/group/${group.id}`)}
              className="flex items-center gap-4 mx-4 my-2 p-4 border-2 border-gray-100 rounded-3xl bg-white cursor-pointer shadow-sm active:bg-gray-50"
            >
              <div className="w-14 h-14 rounded-full bg-[#6C63FF] flex items-center justify-center flex-shrink-0">
                <span className="text-white font-black text-2xl">{group.name?.charAt(0).toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-black text-gray-900 text-base">{group.name}</p>
                  <p className="text-xs text-gray-400 ml-2">Today</p>
                </div>
                <p className="text-sm text-gray-400 truncate">{group.description}</p>
              </div>
              <span className="text-gray-300 text-xl">›</span>
            </div>
          ))}
        </div>
      )}

      {/* Send to group button */}
      {activeTab === 'tasks' && (
        <div className="fixed bottom-16 left-0 right-0 px-6 py-3 bg-[#F5F0E8] border-t border-gray-100">
          <button
            onClick={() => setShowGroupModal(true)}
            className="w-full bg-[#6C63FF] text-white py-3 rounded-2xl font-bold text-sm"
          >
            📤 Send Tasks to Group
          </button>
        </div>
      )}

      {/* Group modal */}
      {showGroupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-black text-gray-900 text-lg">Send to Group</h2>
              <button onClick={() => setShowGroupModal(false)} className="text-gray-400 text-xl">✕</button>
            </div>

            <div className="bg-purple-50 rounded-2xl p-4 mb-4 border border-purple-100">
              <p className="text-xs font-bold text-purple-400 uppercase mb-2">Message Preview</p>
              <p className="text-sm font-bold text-gray-900 mb-2">🎯 {userName}'s Daily Progress</p>
              <p className="text-xs text-gray-500 mb-2">
                {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
              {completed.length > 0 ? (
                <div className="space-y-1">
                  {completed.map(task => (
                    <p key={task.id} className="text-sm text-gray-700">✅ {task.description}</p>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">No completed tasks yet!</p>
              )}
              {pending.length > 0 && (
                <div className="mt-2 pt-2 border-t border-purple-100">
                  <p className="text-xs text-gray-400">{pending.length} tasks still in progress 💪</p>
                </div>
              )}
            </div>

            {joinedGroups.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-gray-400 text-sm">You haven't joined any groups yet</p>
                <button
                  onClick={() => { setShowGroupModal(false); router.push('/groups') }}
                  className="mt-3 text-[#6C63FF] font-semibold text-sm"
                >
                  Find Groups →
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <p className="text-xs font-bold text-gray-400 uppercase">Choose a group</p>
                {joinedGroups.map(group => (
                  <button
                    key={group.id}
                    onClick={() => sendToGroup(group)}
                    className="w-full bg-white border-2 border-gray-100 hover:border-purple-300 rounded-2xl p-4 text-left transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#6C63FF] flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-black text-sm">{group.name?.charAt(0)}</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-gray-900 text-sm">{group.name}</p>
                        <p className="text-xs text-gray-400">{group.description}</p>
                      </div>
                      <span className="text-[#6C63FF] font-bold text-sm">Send →</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex">
        {[
          { icon: '🏠', label: 'Home', tab: 'tasks' },
          { icon: '🎬', label: 'Feed', tab: 'feed' },
          { icon: '👥', label: 'Groups', tab: 'groups' },
        ].map(item => (
          <button
            key={item.tab}
            onClick={() => setActiveTab(item.tab)}
            className={`flex-1 py-4 flex flex-col items-center gap-1 transition-all
              ${activeTab === item.tab ? 'text-[#6C63FF]' : 'text-gray-400'}`}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        ))}
      </div>

    </main>
  )
}