"use client"
import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'

const EMOJIS = ['❤️', '🔥', '👏', '💪', '🎉']

export default function GroupChat() {
  const router = useRouter()
  const params = useParams()
  const groupId = params.id
  const [feed, setFeed] = useState([])
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState('')
  const [reactions, setReactions] = useState({})
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [groupName, setGroupName] = useState('Group')
  const bottomRef = useRef(null)

  useEffect(() => {
    const name = localStorage.getItem('userName') || 'You'
    setUserName(name)

    // get group name from localStorage
    const stored = JSON.parse(localStorage.getItem('joinedGroups') || '[]')
    const group = stored.find(g => g.id === groupId)
    if (group) setGroupName(group.name)

    // check if coming from send tasks
    const shouldSend = sessionStorage.getItem('sendTasks')
    if (shouldSend) {
      sessionStorage.removeItem('sendTasks')
      handleSendTasks()
    }

    fetchGroupFeed()
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [feed])

  const fetchGroupFeed = async () => {
    const userId = localStorage.getItem('userId')
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/groups/${groupId}/feed?user_id=${userId}`)
      const data = await res.json()
      setFeed(data.posts || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSendTasks = async () => {
    const userId = localStorage.getItem('userId')
    const tasksRaw = localStorage.getItem('tasksToSend')
    if (!tasksRaw) return
    
    setSending(true)
    try {
      // tasks are already completed — agent will react via Redis Stream
      // just show success state
      await new Promise(r => setTimeout(r, 1000))
      setSent(true)
      localStorage.removeItem('tasksToSend')
      // refresh feed after delay to show agent reaction
      setTimeout(fetchGroupFeed, 5000)
    } catch (err) {
      console.error(err)
    } finally {
      setSending(false)
    }
  }

  const addReaction = (messageId, emoji) => {
    setReactions(prev => ({
      ...prev,
      [messageId]: {
        ...prev[messageId],
        [emoji]: ((prev[messageId]?.[emoji]) || 0) + 1
      }
    }))
  }

  return (
    <main className="h-screen flex flex-col bg-[#F5F0E8] relative z-10">

      {/* Header — WhatsApp style */}
      <div className="fixed top-0 left-0 right-0 bg-[#6C63FF] z-40 px-4 pt-10 pb-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-white text-xl">←</button>
        <div className="w-9 h-9 rounded-full bg-white/30 flex items-center justify-center">
          <span className="text-white font-black">{groupName.charAt(0)}</span>
        </div>
        <div className="flex-1">
          <p className="text-white font-bold text-sm">{groupName}</p>
          <p className="text-white/70 text-xs">{feed.length} posts</p>
        </div>
        <button
          onClick={fetchGroupFeed}
          className="text-white/70 text-xs"
        >
          Refresh
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto pt-24 pb-32 px-3 flex flex-col gap-3">

        {loading && (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-[#6C63FF] border-t-transparent rounded-full animate-spin"/>
          </div>
        )}

        {!loading && feed.length === 0 && !sent && (
          <div className="text-center py-20">
            <p className="text-4xl mb-3">💬</p>
            <p className="font-bold text-gray-700">No posts yet</p>
            <p className="text-sm text-gray-400 mt-1">Send your tasks to get started!</p>
          </div>
        )}

        {/* Sent confirmation */}
        {sent && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mx-2 text-center">
            <p className="text-green-600 font-bold text-sm">✅ Tasks sent to group!</p>
            <p className="text-green-400 text-xs mt-1">AI agent will react shortly...</p>
          </div>
        )}

        {feed.map((post, index) => (
          <div key={post.id || index} className="flex flex-col gap-1">

            {/* User task message — left side */}
            <div className="max-w-[85%]">
              <p className="text-xs font-bold text-[#6C63FF] mb-1 px-2">
                {post.user_name || 'Member'}
              </p>
              <div className="bg-white rounded-2xl rounded-tl-sm p-3 shadow-sm">
                <p className="text-xs text-gray-400 font-medium mb-2">🎯 Daily Progress</p>
                {post.completed_tasks?.map((task, i) => (
                  <p key={i} className="text-sm text-gray-800 py-0.5">✅ {task}</p>
                ))}
                {post.uncompleted_tasks?.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    {post.uncompleted_tasks.map((task, i) => (
                      <p key={i} className="text-sm text-gray-400 py-0.5">⬜ {task}</p>
                    ))}
                  </div>
                )}
                <p className="text-xs text-gray-300 mt-2 text-right">
                  {post.created_at ? new Date(post.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''}
                </p>
              </div>

              {/* Reactions */}
              <div className="flex gap-1 mt-1 px-2 flex-wrap items-center">
                {Object.entries(reactions[post.id] || {}).map(([emoji, count]) => (
                  <span
                    key={emoji}
                    onClick={() => addReaction(post.id, emoji)}
                    className="bg-white border border-gray-200 rounded-full px-2 py-0.5 text-xs cursor-pointer shadow-sm"
                  >
                    {emoji} {count}
                  </span>
                ))}
                <div className="relative group">
                  <button className="bg-white border border-gray-200 rounded-full px-2 py-0.5 text-xs text-gray-400 shadow-sm">
                    😊
                  </button>
                  <div className="absolute bottom-8 left-0 bg-white rounded-2xl shadow-xl p-2 flex gap-2 invisible group-hover:visible border border-gray-100 z-10">
                    {EMOJIS.map(emoji => (
                      <button key={emoji} onClick={() => addReaction(post.id, emoji)} className="text-xl hover:scale-125 transition-transform">
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Agent reaction — right side */}
            {post.agent_reaction && (
              <div className="max-w-[85%] self-end">
                <p className="text-xs font-bold text-orange-400 mb-1 px-2 text-right">MotivAI 🤖</p>
                <div className="bg-[#6C63FF] rounded-2xl rounded-tr-sm p-3 shadow-sm">
                  <p className="text-white text-sm">{post.agent_reaction}</p>
                  <p className="text-white/50 text-xs mt-1 text-right">
                    {post.created_at ? new Date(post.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''}
                  </p>
                </div>
                <div className="flex gap-1 mt-1 px-2 flex-wrap items-center justify-end">
                  {Object.entries(reactions[`agent_${post.id}`] || {}).map(([emoji, count]) => (
                    <span
                      key={emoji}
                      onClick={() => addReaction(`agent_${post.id}`, emoji)}
                      className="bg-white border border-gray-200 rounded-full px-2 py-0.5 text-xs cursor-pointer shadow-sm"
                    >
                      {emoji} {count}
                    </span>
                  ))}
                  <div className="relative group">
                    <button className="bg-white border border-gray-200 rounded-full px-2 py-0.5 text-xs text-gray-400 shadow-sm">
                      😊
                    </button>
                    <div className="absolute bottom-8 right-0 bg-white rounded-2xl shadow-xl p-2 flex gap-2 invisible group-hover:visible border border-gray-100 z-10">
                      {EMOJIS.map(emoji => (
                        <button key={emoji} onClick={() => addReaction(`agent_${post.id}`, emoji)} className="text-xl hover:scale-125 transition-transform">
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      {/* Bottom — send tasks button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3 flex items-center gap-3">
        <div className="flex-1 bg-gray-100 rounded-full px-4 py-2.5 text-sm text-gray-400">
          Only task updates can be shared 📋
        </div>
        <button
          onClick={handleSendTasks}
          disabled={sending}
          className="bg-[#6C63FF] text-white w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
        >
          {sending ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>
          ) : (
            <span className="text-lg">📤</span>
          )}
        </button>
      </div>

    </main>
  )
}