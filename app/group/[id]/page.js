"use client"
import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'

const EMOJIS = ['❤️', '🔥', '👏', '💪', '🎉']

export default function GroupChat() {
  const router = useRouter()
  const params = useParams()
  const groupId = params.id
  const [feed, setFeed] = useState([])
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState('')
  const [userId, setUserId] = useState('')
  const [reactions, setReactions] = useState({})
  const [groupName, setGroupName] = useState('Group')
  const [showEmojiPicker, setShowEmojiPicker] = useState(null)
  const bottomRef = useRef(null)

  useEffect(() => {
    document.body.style.background = '#ECE5DD'
    return () => { document.body.style.background = '' }
  }, [])

  useEffect(() => {
    const name = localStorage.getItem('userName') || 'You'
    const uid = localStorage.getItem('userId') || ''
    setUserName(name)
    setUserId(uid)
    const stored = JSON.parse(localStorage.getItem('joinedGroups') || '[]')
    const group = stored.find(g => g.id === groupId)
    if (group) setGroupName(group.name)
    fetchGroupFeed()
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [feed])

  useEffect(() => {
    const interval = setInterval(fetchGroupFeed, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchGroupFeed = async () => {
    const uid = localStorage.getItem('userId')
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/groups/${groupId}/feed?user_id=${uid}`)
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
    setShowEmojiPicker(null)
  }

  const allMessages = [...feed].sort((a, b) => new Date(a.created_at) - new Date(b.created_at))

  return (
    <div className="fixed inset-0 flex flex-col" style={{ backgroundColor: '#ECE5DD' }}>

      {/* Header */}
<div className="bg-[#6C63FF] px-5 pt-14 pb-4 flex items-center gap-4 flex-shrink-0">
  <button onClick={() => router.back()} className="text-white text-2xl">←</button>
  <div className="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center flex-shrink-0">
    <span className="text-[#6C63FF] font-black text-xl">{groupName.charAt(0)}</span>
  </div>
  <div className="flex-1">
    <p className="text-white font-black text-xl tracking-tight">{groupName}</p>
    <p className="text-white/50 text-xs font-medium">{feed.length} updates today</p>
  </div>
  <button
    onClick={() => router.push(`/group/${groupId}/tasks`)}
    className="bg-white text-[#6C63FF] text-xs font-black px-4 py-2 rounded-full shadow-md"
  >
    ✏️ To DO List
  </button>
</div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-4">

        {loading && (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-[#6C63FF] border-t-transparent rounded-full animate-spin"/>
          </div>
        )}

        {!loading && allMessages.length === 0 && (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">💬</p>
            <p className="font-bold text-gray-600 text-lg">No messages yet</p>
            <p className="text-sm text-gray-400 mt-1">Send your tasks to get started!</p>
          </div>
        )}

        {allMessages.map((post, index) => {
          const isMe = post.user_id === userId
          const time = new Date(post.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
          return (
            <div key={post.id || index} className={`flex flex-col gap-1 ${isMe ? 'items-end' : 'items-start'}`}>

              {!isMe && (
                <p className="text-xs font-bold text-[#6C63FF] px-3">{post.user_name || 'Member'}</p>
              )}

              <div
                style={{ maxWidth: '75%' }}
                className={`rounded-2xl px-4 py-3 shadow-sm ${isMe ? 'bg-[#DCF8C6] rounded-tr-sm' : 'bg-white rounded-tl-sm'}`}
              >
                <p className="text-xs text-gray-400 font-semibold mb-2">Progress</p>
                {post.completed_tasks?.map((task, i) => (
                  <p key={i} className="text-sm text-gray-800 py-0.5">✅ {task}</p>
                ))}
                {post.uncompleted_tasks?.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    {post.uncompleted_tasks.map((task, i) => (
                      <p key={i} className="text-sm text-gray-400 py-0.5">⬜ {task}</p>
                    ))}
                  </div>
                )}
                <p className="text-xs text-gray-300 mt-2 text-right">{time}</p>
              </div>

              <div className={`flex gap-1 px-2 flex-wrap items-center ${isMe ? 'justify-end' : 'justify-start'}`}>
                {Object.entries(reactions[post.id] || {}).map(([emoji, count]) => (
                  <span key={emoji} onClick={() => addReaction(post.id, emoji)}
                    className="bg-white border border-gray-200 rounded-full px-2 py-0.5 text-sm cursor-pointer shadow-sm">
                    {emoji} {count}
                  </span>
                ))}
                <button onClick={() => setShowEmojiPicker(showEmojiPicker === post.id ? null : post.id)}
                  className="bg-white border border-gray-200 rounded-full px-2 py-0.5 text-sm text-gray-400 shadow-sm">😊</button>
                {showEmojiPicker === post.id && (
                  <div className="bg-white rounded-2xl shadow-xl p-3 flex gap-3 border border-gray-100 z-10">
                    {EMOJIS.map(emoji => (
                      <button key={emoji} onClick={() => addReaction(post.id, emoji)} className="text-2xl">{emoji}</button>
                    ))}
                  </div>
                )}
              </div>

              {post.agent_reaction && (
                <div className="flex flex-col items-start gap-1 self-start mt-1" style={{ maxWidth: '75%' }}>
                  <p className="text-xs font-bold px-3" style={{ color: '#FF6B9D' }}>MotivAI 🤖 → {post.user_name}</p>
                  <div style={{ backgroundColor: '#FFB5C8' }} className="rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                    <p className="text-white text-sm leading-relaxed">{post.agent_reaction}</p>
                    <p className="text-white/60 text-xs mt-2 text-right">{time}</p>
                  </div>
                  <div className="flex gap-1 px-2 flex-wrap items-center">
                    {Object.entries(reactions[`agent_${post.id}`] || {}).map(([emoji, count]) => (
                      <span key={emoji} onClick={() => addReaction(`agent_${post.id}`, emoji)}
                        className="bg-white border border-gray-200 rounded-full px-2 py-0.5 text-sm cursor-pointer shadow-sm">
                        {emoji} {count}
                      </span>
                    ))}
                    <button onClick={() => setShowEmojiPicker(showEmojiPicker === `agent_${post.id}` ? null : `agent_${post.id}`)}
                      className="bg-white border border-gray-200 rounded-full px-2 py-0.5 text-sm text-gray-400 shadow-sm">😊</button>
                    {showEmojiPicker === `agent_${post.id}` && (
                      <div className="bg-white rounded-2xl shadow-xl p-3 flex gap-3 border border-gray-100 z-10">
                        {EMOJIS.map(emoji => (
                          <button key={emoji} onClick={() => addReaction(`agent_${post.id}`, emoji)} className="text-2xl">{emoji}</button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          )
        })}

        <div ref={bottomRef} />
      </div>

      {/* Bottom bar */}
      <div className="bg-[#F0F0F0] border-t border-gray-200 px-3 py-3 flex items-center gap-2 flex-shrink-0">
        <div className="flex-1 bg-white rounded-full px-4 py-3 text-sm text-gray-400 shadow-sm">
          Only task updates can be shared 📋
        </div>
        <button
          onClick={() => router.push('/home')}
          className="bg-[#6C63FF] text-white w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm text-xl"
        >
          🏠
        </button>
      </div>

    </div>
  )
}