"use client"
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

export default function GroupTasks() {
  const router = useRouter()
  const params = useParams()
  const groupId = params.id
  const [tasks, setTasks] = useState([])
  const [groupName, setGroupName] = useState('Group')
  const [newTask, setNewTask] = useState('')

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem(`groupTasks_${groupId}`) || '[]')
    setTasks(stored)
    const groups = JSON.parse(localStorage.getItem('joinedGroups') || '[]')
    const group = groups.find(g => g.id === groupId)
    if (group) setGroupName(group.name)
  }, [])

  const addTask = () => {
    if (!newTask.trim()) return
    const task = { id: Date.now(), description: newTask.trim(), completed: false }
    const updated = [...tasks, task]
    setTasks(updated)
    localStorage.setItem(`groupTasks_${groupId}`, JSON.stringify(updated))
    setNewTask('')
  }

  const toggleTask = (id) => {
    const updated = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t)
    setTasks(updated)
    localStorage.setItem(`groupTasks_${groupId}`, JSON.stringify(updated))
  }

  const deleteTask = (id) => {
    const updated = tasks.filter(t => t.id !== id)
    setTasks(updated)
    localStorage.setItem(`groupTasks_${groupId}`, JSON.stringify(updated))
  }

  const sendToGroup = async () => {
    const completed = tasks.filter(t => t.completed && t.description.trim())
    if (completed.length === 0) return
    
    const userId = localStorage.getItem('userId')
    
    // first create tasks in backend and complete them
    for (const task of completed) {
      try {
        // create task
        const createRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/tasks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId, description: task.description })
        })
        const createData = await createRes.json()
        
        // complete task → triggers Redis Stream → agent reacts
        // complete task with group context
await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/tasks/${createData.task_id}/complete?user_id=${userId}&group_id=${groupId}`, {
    method: 'PATCH'
  })
      } catch (err) {
        console.error(err)
      }
    }
  
    // then post to group
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/groups/${groupId}/post?user_id=${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          completed_tasks: completed.map(t => t.description),
          uncompleted_tasks: tasks.filter(t => !t.completed).map(t => t.description)
        })
      })
      const remaining = tasks.filter(t => !t.completed)
      setTasks(remaining)
      localStorage.setItem(`groupTasks_${groupId}`, JSON.stringify(remaining))
      router.back()
    } catch (err) {
      console.error(err)
    }
  }

  const completedCount = tasks.filter(t => t.completed).length

  return (
    <div className="min-h-screen bg-[#F5F0E8] relative z-50">

      {/* Header */}
      <div className="bg-[#6C63FF] px-5 pt-14 pb-5 flex items-center justify-between flex-shrink-0">
        <button onClick={() => router.back()} className="text-white text-2xl">←</button>
        <div className="text-center">
          <p className="text-white font-black text-lg">{groupName}</p>
          <p className="text-white/60 text-xs">To-Do List</p>
        </div>
        <button
          onClick={sendToGroup}
          disabled={completedCount === 0}
          className={`text-sm font-black px-4 py-2 rounded-full transition-all ${
            completedCount > 0
              ? 'bg-white text-[#6C63FF] shadow-md'
              : 'text-white/30'
          }`}
        >
          Send {completedCount > 0 ? `(${completedCount})` : ''}
        </button>
      </div>

      {/* Task list */}
      <div className="px-5 py-6 flex flex-col gap-3">

        {tasks.length === 0 && (
          <div className="text-center py-16">
            <p className="text-5xl mb-4">📝</p>
            <p className="font-bold text-gray-600">No tasks yet</p>
            <p className="text-sm text-gray-400 mt-1">Add your first task below</p>
          </div>
        )}

        {tasks.map((task, index) => (
          <div
            key={task.id}
            className={`bg-white rounded-2xl px-4 py-4 flex items-center gap-3 shadow-sm transition-all ${
              task.completed ? 'opacity-70' : ''
            }`}
          >
            <span className="text-gray-300 text-sm font-mono w-5 flex-shrink-0">{index + 1}.</span>
            <button
              onClick={() => toggleTask(task.id)}
              className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                task.completed
                  ? 'bg-[#6C63FF] border-[#6C63FF]'
                  : 'border-gray-300'
              }`}
            >
              {task.completed && <span className="text-white text-xs font-bold">✓</span>}
            </button>
            <p className={`flex-1 text-base ${task.completed ? 'line-through text-gray-400' : 'text-gray-800 font-medium'}`}>
              {task.description}
            </p>
            <button onClick={() => deleteTask(task.id)} className="text-gray-200 hover:text-red-400 text-xl flex-shrink-0">
              ×
            </button>
          </div>
        ))}

        {/* Add task input */}
        <div className="bg-white rounded-2xl px-4 py-3 flex items-center gap-3 shadow-sm border-2 border-dashed border-purple-200">
          <span className="text-gray-300 text-sm font-mono w-5 flex-shrink-0">{tasks.length + 1}.</span>
          <input
            type="text"
            placeholder="Add a new task..."
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addTask()}
            className="flex-1 text-base text-gray-700 focus:outline-none bg-transparent"
          />
          <button
            onClick={addTask}
            className="bg-[#6C63FF] text-white w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0"
          >
            +
          </button>
        </div>

      </div>

      {/* Bottom send button */}
      {completedCount > 0 && (
        <div className="fixed bottom-8 left-0 right-0 flex justify-center px-6">
          <button
            onClick={sendToGroup}
            className="bg-[#6C63FF] text-white px-8 py-4 rounded-2xl font-black shadow-xl text-sm w-full"
          >
            📤 Send {completedCount} completed task{completedCount > 1 ? 's' : ''} to group
          </button>
        </div>
      )}

    </div>
  )
}