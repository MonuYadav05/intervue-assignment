import { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { addMessage } from '../features/chat/chatSlice'
import { socket } from '../utils/socket'
import Button from './Button'

export default function ChatPopup({ roomCode }) {
    const [open, setOpen] = useState(false)
    const [activeTab, setActiveTab] = useState('chat') // 'chat' or 'participants'
    const messages = useSelector(s => s.chat.messages)
    const students = useSelector(s => s.poll.students)
    const name = useSelector(s => s.poll.name) || 'You'
    const listRef = useRef(null)
    const dispatch = useDispatch()

    useEffect(() => {
        if (!open) return
        const el = listRef.current
        if (el) el.scrollTop = el.scrollHeight
    }, [messages, open])

    function sendMessage(e) {
        e.preventDefault()
        const input = e.currentTarget.elements.msg
        const text = input.value.trim()
        if (!text) return
        const payload = { roomCode, sender: name, message: text, time: new Date().toISOString() }
        socket.emit('chat_message', payload)
        dispatch(addMessage({ sender: name, message: text, time: payload.time, self: true }))
        input.value = ''
    }

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(v => !v)}
                className="fixed bottom-6 right-6 w-20 h-20 rounded-full bg-indigo-500 text-white shadow-xl flex justify-center items-center place-items-center"
                aria-label="Open chat"
            >
                <img src="ChatBubble.png" alt="" className='mt-2' />
            </button>

            {open && (
                <div className="fixed bottom-24 right-6 w-80 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
                    <div className="flex border-b">
                        <button
                            onClick={() => setActiveTab('chat')}
                            className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors ${activeTab === 'chat'
                                ? 'text-gray-900 border-b-2 border-violet-500'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Chat
                        </button>
                        <button
                            onClick={() => setActiveTab('participants')}
                            className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors ${activeTab === 'participants'
                                ? 'text-gray-900 border-b-2 border-violet-500'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Participants
                        </button>
                    </div>

                    {activeTab === 'chat' ? (
                        <>
                            <div ref={listRef} className="h-72 overflow-y-auto p-4 space-y-3">
                                {messages.map(m => (
                                    <div key={m.id} className={`flex ${m.self ? 'justify-end' : 'justify-start'}`}>
                                        <div className="max-w-[70%]">
                                            <div className={`text-xs text-violet-600 font-medium mb-1 ${m.self ? 'text-right' : 'text-left'}`}>
                                                {m.sender || 'Anonymous'}
                                            </div>
                                            <div className={`${m.self ? 'bg-violet-500 text-white' : 'bg-gray-800 text-white'} rounded-lg px-3 py-2 text-sm`}>
                                                {m.message}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {messages.length === 0 && (
                                    <p className="text-xs text-gray-500">No messages yet</p>
                                )}
                            </div>
                            <form onSubmit={sendMessage} className="p-3 border-t flex items-center gap-2">
                                <input name="msg" placeholder="Type a message" className="flex-1 border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                                <Button type="submit" className="w-auto h-auto px-4 py-2 text-sm">
                                    Send
                                </Button>
                            </form>
                        </>
                    ) : (
                        <div className="h-72 overflow-y-auto p-4">
                            <div className="space-y-2">
                                {students.length > 0 ? (
                                    <>
                                        <div className={` flex  items-start ${name === 'Teacher' ? 'justify-between' : ' justify-start'}   gap-4 `}>
                                            <div className="text-sm font-semibold text-gray-700">Name</div>
                                            {name === 'Teacher' && <div className="text-sm font-semibold text-gray-700">Action</div>}
                                        </div>
                                        {students.map((student, index) => (
                                            <div key={student.sessionId || index} className={`flex ${name === 'Teacher' ? 'justify-between' : 'justify-start'} gap-4 py-2`}>
                                                <div className="text-sm  font-semibold">
                                                    {student.name || 'Anonymous'}
                                                </div>
                                                {name === 'Teacher' && (
                                                    <div>
                                                        <button
                                                            onClick={() => {
                                                                if (window.confirm(`Are you sure you want to kick out ${student.name || 'this student'}?`)) {
                                                                    socket.emit('remove_student', { roomCode, sessionId: student.sessionId })
                                                                }
                                                            }}
                                                            className="text-blue-600 underline cursor-pointer text-sm hover:text-blue-800 transition-colors"
                                                        >
                                                            Kick out
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </>
                                ) : (
                                    <div className="text-center py-8">
                                        <p className="text-sm text-gray-500">No participants yet</p>
                                        <p className="text-xs text-gray-400 mt-1">Students will appear here when they join</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </>
    )
}


