"use client"
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

const EMOJIS = ['❤️', '🔥', '👏', '💪', '🎉']

export default function GroupChat() {
  const router = useRouter()
  const params = useParams()
  const groupId = params.id
  const [feed, setFeed] = useState([])
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState('')
  const [reactions, setReactions] = useState({})

  useEffect(() => {
    const name = localStorage.getItem('userName') || 'You'
    setUserName(name)
    fetchGroupFeed()
  }, [])

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
    <main className="min-h-screen flex flex-col bg-[#F5F0E8] relative z-10">

      {/* Header */}
      <div className="fixed top-0 left-0 right-0 bg-[#6C63FF] z-40 px-4 py-4 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-white text-xl">←</button>
        <div className="w-9 h-9 rounded-full bg-white/30 flex items-center justify-center">
          <span className="text-white font-bold text-sm">G</span>
        </div>
        <div>
          <p className="text-white font-bold text-sm">Group Chat</p>
          <p className="text-white/70 text-xs">{feed.length} posts</p>
        </div>
      </div>

      {/* Messages */}
      <div className="pt-24 pb-6 px-4 flex flex-col gap-4">

        {loading && (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-[#6C63FF] border-t-transparent rounded-full animate-spin"/>
          </div>
        )}

        {!loading && feed.length === 0 && (
          <div className="text-center py-20">
            <p className="text-4xl mb-3">💬</p>
            <p className="font-bold text-gray-700">No posts yet</p>
            <p className="text-sm text-gray-400 mt-1">Complete tasks to share with group</p>
          </div>
        )}

        {!loading && feed.map((post, index) => (
          <div key={post.id || index} className="flex flex-col gap-2">

            {/* User task message */}
            <div className="max-w-[85%]">
              <p className="text-xs font-bold text-[#6C63FF] mb-1 px-1">
                {post.user_name || 'Member'}
              </p>
              <div className="bg-white rounded-2xl rounded-tl-sm p-3 shadow-sm">
                <p className="text-xs text-gray-400 mb-2 font-medium">🎯 Daily Progress</p>
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

              {/* Reactions row */}
              <div className="flex gap-1 mt-1 px-1 flex-wrap items-center">
                {Object.entries(reactions[post.id] || {}).map(([emoji, count]) => (
                  <span
                    key={emoji}
                    onClick={() => addReaction(post.id, emoji)}
                    className="bg-white border border-gray-200 rounded-full px-2 py-0.5 text-xs flex items-center gap-1 cursor-pointer shadow-sm"
                  >
                    {emoji} {count}
                  </span>
                ))}
                {/* Emoji picker */}
                <div className="relative group">
                  <button className="bg-white border border-gray-200 rounded-full px-2 py-0.5 text-xs text-gray-400 shadow-sm">
                    😊
                  </button>
                  <div className="absolute bottom-8 left-0 bg-white rounded-2xl shadow-xl p-2 flex gap-2 invisible group-hover:visible border border-gray-100 z-10">
                    {EMOJIS.map(emoji => (
                      <button
                        key={emoji}
                        onClick={() => addReaction(post.id, emoji)}
                        className="text-xl hover:scale-125 transition-transform"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Agent reaction */}
            {post.agent_reaction && (
              <div className="max-w-[85%] self-end">
                <p className="text-xs font-bold text-orange-400 mb-1 px-1 text-right">
                  MotivAI 🤖
                </p>
                <div className="bg-[#6C63FF] rounded-2xl rounded-tr-sm p-3 shadow-sm">
                  <p className="text-white text-sm">{post.agent_reaction}</p>
                  <p className="text-white/50 text-xs mt-1 text-right">
                    {post.created_at ? new Date(post.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''}
                  </p>
                </div>

                {/* Reactions on agent message */}
                <div className="flex gap-1 mt-1 px-1 flex-wrap items-center justify-end">
                  {Object.entries(reactions[`agent_${post.id}`] || {}).map(([emoji, count]) => (
                    <span
                      key={emoji}
                      onClick={() => addReaction(`agent_${post.id}`, emoji)}
                      className="bg-white border border-gray-200 rounded-full px-2 py-0.5 text-xs flex items-center gap-1 cursor-pointer shadow-sm"
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
                        <button
                          key={emoji}
                          onClick={() => addReaction(`agent_${post.id}`, emoji)}
                          className="text-xl hover:scale-125 transition-transform"
                        >
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
      </div>

    </main>
  )
}