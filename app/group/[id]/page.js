"use client"

import { useState, useEffect, useRef, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'

const EMOJIS = ['❤️', '🔥', '👏', '💪', '🎉']

/* Deterministic avatar tint per member so people are recognizable at a glance */
const AVATAR_TINTS = [
  'from-[#6C63FF] to-[#9B7BFF]',
  'from-[#FF6B9D] to-[#FFB5C8]',
  'from-[#00B8A9] to-[#5BD9CE]',
  'from-[#F6A609] to-[#FFD166]',
  'from-[#3D8BFD] to-[#7FB6FF]',
]
const tintFor = (key = '') => {
  let h = 0
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0
  return AVATAR_TINTS[h % AVATAR_TINTS.length]
}

const initials = (name = '') =>
  name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?'

const dayLabel = (iso) => {
  const d = new Date(iso)
  const today = new Date()
  const yesterday = new Date(Date.now() - 86400000)
  const same = (a, b) => a.toDateString() === b.toDateString()
  if (same(d, today)) return 'Today'
  if (same(d, yesterday)) return 'Yesterday'
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

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
  const [live, setLive] = useState(true)
  const bottomRef = useRef(null)

  useEffect(() => {
    document.body.style.background = '#EFEAF6'
    return () => {
      document.body.style.background = ''
    }
  }, [])

  useEffect(() => {
    setUserName(localStorage.getItem('userName') || 'You')
    setUserId(localStorage.getItem('userId') || '')
    const stored = JSON.parse(localStorage.getItem('joinedGroups') || '[]')
    const group = stored.find((g) => g.id === groupId)
    if (group) setGroupName(group.name)
    fetchGroupFeed()
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [feed])

  useEffect(() => {
    const eventSource = new EventSource(
      `${process.env.NEXT_PUBLIC_API_URL}/v1/groups/${groupId}/stream`
    )
    eventSource.onopen = () => setLive(true)
    eventSource.onmessage = () => fetchGroupFeed()
    eventSource.onerror = () => {
      setLive(false)
      eventSource.close()
      setTimeout(() => window.location.reload(), 5000)
    }
    return () => eventSource.close()
  }, [])

  const fetchGroupFeed = async () => {
    const uid = localStorage.getItem('userId')
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/groups/${groupId}/feed?user_id=${uid}`
      )
      const data = await res.json()
      setFeed(data.posts || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const addReaction = (messageId, emoji) => {
    setReactions((prev) => ({
      ...prev,
      [messageId]: {
        ...prev[messageId],
        [emoji]: (prev[messageId]?.[emoji] || 0) + 1,
      },
    }))
    setShowEmojiPicker(null)
  }

  const allMessages = useMemo(
    () => [...feed].sort((a, b) => new Date(a.created_at) - new Date(b.created_at)),
    [feed]
  )

  const doneCount = useMemo(
    () => allMessages.reduce((n, p) => n + (p.completed_tasks?.length || 0), 0),
    [allMessages]
  )

  return (
    <div className="fixed inset-0 flex flex-col bg-[#EFEAF6] text-[#221C33] antialiased">
      {/* ---------- Header ---------- */}
      <header className="relative flex-shrink-0 overflow-hidden bg-gradient-to-br from-[#6C63FF] via-[#7A6BFF] to-[#9B7BFF] px-5 pb-6 pt-14 shadow-[0_10px_30px_-12px_rgba(108,99,255,0.75)]">
        <div className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-24 left-10 h-40 w-40 rounded-full bg-[#FF6B9D]/25 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <button
            onClick={() => router.back()}
            aria-label="Go back"
            className="grid h-10 w-10 place-items-center rounded-full text-xl text-white/90 transition hover:bg-white/15 active:scale-95"
          >
            ←
          </button>

          <div
            className={`grid h-12 w-12 flex-shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${tintFor(
              groupName
            )} ring-2 ring-white/70 shadow-lg`}
          >
            <span className="text-lg font-black tracking-tight text-white">
              {groupName.charAt(0).toUpperCase()}
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-xl font-black leading-tight tracking-tight text-white">
              {groupName}
            </p>
            <p className="mt-0.5 flex items-center gap-1.5 text-[11px] font-semibold text-white/70">
              <span
                className={`inline-block h-1.5 w-1.5 rounded-full ${
                  live ? 'animate-pulse bg-[#7CF5C4]' : 'bg-white/40'
                }`}
              />
              {live ? 'Live' : 'Reconnecting…'}
              <span className="text-white/30">•</span>
              {feed.length} update{feed.length === 1 ? '' : 's'} today
            </p>
          </div>

          <button
            onClick={() => router.push(`/group/${groupId}/tasks`)}
            className="flex-shrink-0 rounded-full bg-white px-4 py-2 text-[11px] font-black tracking-tight text-[#6C63FF] shadow-md transition hover:shadow-lg active:scale-95"
          >
            ✏️ To-Do
          </button>
        </div>

        {/* Tiny daily stat strip */}
        <div className="relative mt-4 flex gap-2">
          <Stat label="Tasks done" value={doneCount} />
          <Stat label="Updates" value={feed.length} />
          <Stat label="You" value={userName || '—'} />
        </div>
      </header>

      {/* ---------- Messages ---------- */}
      <main className="flex flex-1 flex-col gap-3 overflow-y-auto px-3 py-5">
        {loading && <SkeletonFeed />}

        {!loading && allMessages.length === 0 && (
          <div className="grid flex-1 place-items-center px-8 text-center">
            <div>
              <div className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-white text-4xl shadow-[0_12px_30px_-12px_rgba(108,99,255,0.5)]">
                💬
              </div>
              <p className="mt-5 text-lg font-black tracking-tight">Quiet in here</p>
              <p className="mx-auto mt-1 max-w-[15rem] text-sm leading-relaxed text-[#221C33]/50">
                Share your first task update and the group will light up.
              </p>
              <button
                onClick={() => router.push(`/group/${groupId}/tasks`)}
                className="mt-5 rounded-full bg-[#6C63FF] px-5 py-2.5 text-sm font-bold text-white shadow-lg transition active:scale-95"
              >
                Add today's tasks
              </button>
            </div>
          </div>
        )}

        {allMessages.map((post, index) => {
          const isMe = post.user_id === userId
          const time = new Date(post.created_at).toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
          })
          const prev = allMessages[index - 1]
          const showDay =
            !prev || dayLabel(prev.created_at) !== dayLabel(post.created_at)
          const done = post.completed_tasks?.length || 0
          const open = post.uncompleted_tasks?.length || 0
          const total = done + open
          const pct = total ? Math.round((done / total) * 100) : 0

          return (
            <div key={post.id || index} className="flex flex-col gap-3">
              {showDay && (
                <div className="my-1 flex items-center gap-3 px-2">
                  <div className="h-px flex-1 bg-[#221C33]/10" />
                  <span className="rounded-full bg-white/70 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#221C33]/45 backdrop-blur">
                    {dayLabel(post.created_at)}
                  </span>
                  <div className="h-px flex-1 bg-[#221C33]/10" />
                </div>
              )}

              <div className={`flex flex-col gap-1.5 ${isMe ? 'items-end' : 'items-start'}`}>
                <div className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                  {!isMe && (
                    <div
                      className={`grid h-8 w-8 flex-shrink-0 place-items-center rounded-full bg-gradient-to-br ${tintFor(
                        post.user_name || 'Member'
                      )} text-[11px] font-black text-white shadow-sm`}
                    >
                      {initials(post.user_name || 'Member')}
                    </div>
                  )}

                  <div style={{ maxWidth: '78%' }} className="min-w-0">
                    {!isMe && (
                      <p className="mb-1 px-1 text-[11px] font-bold tracking-tight text-[#6C63FF]">
                        {post.user_name || 'Member'}
                      </p>
                    )}

                    <div
                      className={`rounded-3xl border px-4 py-3 shadow-[0_6px_20px_-14px_rgba(34,28,51,0.6)] ${
                        isMe
                          ? 'rounded-br-lg border-[#6C63FF]/15 bg-gradient-to-br from-[#EFEDFF] to-[#E4E1FF]'
                          : 'rounded-bl-lg border-black/5 bg-white'
                      }`}
                    >
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#221C33]/35">
                          Progress
                        </p>
                        {total > 0 && (
                          <span className="rounded-full bg-[#221C33]/5 px-2 py-0.5 text-[10px] font-bold text-[#221C33]/55">
                            {done}/{total}
                          </span>
                        )}
                      </div>

                      {total > 0 && (
                        <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-[#221C33]/8">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[#6C63FF] to-[#00B8A9] transition-[width] duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      )}

                      <ul className="space-y-1">
                        {post.completed_tasks?.map((task, i) => (
                          <li key={i} className="flex gap-2 text-sm leading-snug text-[#221C33]">
                            <span className="mt-[3px] grid h-4 w-4 flex-shrink-0 place-items-center rounded-md bg-[#00B8A9] text-[10px] font-black text-white">
                              ✓
                            </span>
                            <span>{task}</span>
                          </li>
                        ))}
                      </ul>

                      {open > 0 && (
                        <ul className="mt-2.5 space-y-1 border-t border-dashed border-[#221C33]/10 pt-2.5">
                          {post.uncompleted_tasks.map((task, i) => (
                            <li
                              key={i}
                              className="flex gap-2 text-sm leading-snug text-[#221C33]/40"
                            >
                              <span className="mt-[3px] h-4 w-4 flex-shrink-0 rounded-md border-2 border-[#221C33]/15" />
                              <span>{task}</span>
                            </li>
                          ))}
                        </ul>
                      )}

                      <p className="mt-2.5 text-right text-[10px] font-medium tabular-nums text-[#221C33]/30">
                        {time}
                      </p>
                    </div>
                  </div>
                </div>

                <ReactionBar
                  align={isMe ? 'end' : 'start'}
                  reactions={reactions[post.id]}
                  open={showEmojiPicker === post.id}
                  onToggle={() =>
                    setShowEmojiPicker(showEmojiPicker === post.id ? null : post.id)
                  }
                  onPick={(emoji) => addReaction(post.id, emoji)}
                  indent={!isMe}
                />

                {post.agent_reaction && (
                  <div className="mt-1 flex flex-col items-start gap-1.5 self-start">
                    <p className="flex items-center gap-1.5 px-1 text-[11px] font-bold text-[#FF6B9D]">
                      <span className="grid h-5 w-5 place-items-center rounded-full bg-[#FF6B9D] text-[10px] text-white">
                        🤖
                      </span>
                      MotivAI → {post.user_name}
                    </p>
                    <div
                      style={{ maxWidth: '78%' }}
                      className="rounded-3xl rounded-bl-lg bg-gradient-to-br from-[#FF8FB4] to-[#FFB5C8] px-4 py-3 shadow-[0_8px_24px_-14px_rgba(255,107,157,0.9)]"
                    >
                      <p className="text-sm leading-relaxed text-white">{post.agent_reaction}</p>
                      <p className="mt-2 text-right text-[10px] font-medium tabular-nums text-white/60">
                        {time}
                      </p>
                    </div>
                    <ReactionBar
                      align="start"
                      reactions={reactions[`agent_${post.id}`]}
                      open={showEmojiPicker === `agent_${post.id}`}
                      onToggle={() =>
                        setShowEmojiPicker(
                          showEmojiPicker === `agent_${post.id}` ? null : `agent_${post.id}`
                        )
                      }
                      onPick={(emoji) => addReaction(`agent_${post.id}`, emoji)}
                    />
                  </div>
                )}
              </div>
            </div>
          )
        })}

        <div ref={bottomRef} />
      </main>

      {/* ---------- Bottom bar ---------- */}
      <footer className="flex-shrink-0 border-t border-black/5 bg-white/80 px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-full bg-[#221C33]/[0.04] px-4 py-3 text-sm font-medium text-[#221C33]/40">
            <span>📋</span>
            <span className="truncate">Only task updates can be shared here</span>
          </div>
          <button
            onClick={() => router.push(`/group/${groupId}/tasks`)}
            aria-label="Update tasks"
            className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#6C63FF] to-[#9B7BFF] text-lg text-white shadow-lg transition active:scale-95"
          >
            ✏️
          </button>
          <button
            onClick={() => router.push('/home')}
            aria-label="Home"
            className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-full bg-white text-lg shadow-sm ring-1 ring-black/5 transition active:scale-95"
          >
            🏠
          </button>
        </div>
      </footer>
    </div>
  )
}

/* ---------------- small pieces ---------------- */

function Stat({ label, value }) {
  return (
    <div className="flex-1 rounded-2xl bg-white/12 px-3 py-2 backdrop-blur-sm ring-1 ring-white/15">
      <p className="truncate text-sm font-black leading-none text-white">{value}</p>
      <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-white/55">
        {label}
      </p>
    </div>
  )
}

function ReactionBar({ reactions = {}, open, onToggle, onPick, align = 'start', indent }) {
  const entries = Object.entries(reactions || {})
  return (
    <div
      className={`relative flex flex-wrap items-center gap-1.5 ${
        align === 'end' ? 'justify-end pr-1' : `justify-start ${indent ? 'pl-11' : 'pl-1'}`
      }`}
    >
      {entries.map(([emoji, count]) => (
        <button
          key={emoji}
          onClick={() => onPick(emoji)}
          className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-[#221C33]/70 shadow-sm ring-1 ring-black/5 transition hover:-translate-y-0.5 active:scale-95"
        >
          {emoji} <span className="tabular-nums">{count}</span>
        </button>
      ))}

      <button
        onClick={onToggle}
        aria-label="Add reaction"
        className={`grid h-7 w-7 place-items-center rounded-full text-sm shadow-sm ring-1 ring-black/5 transition active:scale-95 ${
          open ? 'bg-[#6C63FF] text-white' : 'bg-white text-[#221C33]/35'
        }`}
      >
        ☺
      </button>

      {open && (
        <div
          className={`absolute bottom-9 z-20 flex gap-1 rounded-2xl bg-white p-2 shadow-[0_18px_40px_-18px_rgba(34,28,51,0.7)] ring-1 ring-black/5 ${
            align === 'end' ? 'right-1' : 'left-1'
          }`}
        >
          {EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => onPick(emoji)}
              className="grid h-9 w-9 place-items-center rounded-xl text-xl transition hover:scale-110 hover:bg-[#221C33]/5"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function SkeletonFeed() {
  return (
    <div className="space-y-4 px-1 pt-2">
      {[0, 1, 2].map((i) => (
        <div key={i} className={`flex ${i === 1 ? 'justify-end' : 'justify-start'}`}>
          <div className="w-[70%] animate-pulse rounded-3xl bg-white/70 p-4 shadow-sm">
            <div className="h-2.5 w-16 rounded-full bg-[#221C33]/10" />
            <div className="mt-3 h-1.5 w-full rounded-full bg-[#221C33]/8" />
            <div className="mt-3 h-3 w-4/5 rounded-full bg-[#221C33]/10" />
            <div className="mt-2 h-3 w-3/5 rounded-full bg-[#221C33]/10" />
          </div>
        </div>
      ))}
    </div>
  )
}
