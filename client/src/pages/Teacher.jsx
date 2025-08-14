import PollForm from '../components/PollForm'
import LiveResults from '../components/LiveResults'
import { useDispatch, useSelector } from 'react-redux'
import { initSocketHandlers, startPoll, socket, removeStudent } from '../utils/socket'
import { setRoomCode, setUser, setStudents } from '../features/poll/pollSlice'
import ChatPopup from '../components/ChatPopup'
import { useEffect } from 'react'

export default function Teacher() {
    const dispatch = useDispatch()
    initSocketHandlers(window.__APP_STORE__ || { dispatch: () => { } })

    const roomCode = 'DEMO'
    if (!window.__teacher_inited) {
        window.__teacher_inited = true
        dispatch(setRoomCode(roomCode))
        dispatch(setUser({ name: 'Teacher', sessionId: 'teacher', role: 'teacher' }))
        socket.emit('create_room', { code: roomCode, teacherName: 'Teacher', teacherPass: 'pass' })
    }

    const poll = useSelector(s => s.poll.currentPoll)
    const total = useSelector(s => s.poll.totalAnswers)

    function handleStart({ question, options, duration }) {
        startPoll(roomCode, question, options.map(o => ({ id: o.id, text: o.text, correct: o.correct })), duration)
    }

    const students = useSelector(s => s.poll.students)

    function handleRemoveStudent(s) {
        removeStudent(roomCode, s.sessionId)
    }

    // Fallback: pull current participants once on mount via REST
    useEffect(() => {
        const apiBase = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000'
        fetch(`${apiBase}/api/rooms/${roomCode}`)
            .then(r => r.ok ? r.json() : null)
            .then(data => {
                if (data && Array.isArray(data.students)) {
                    const list = data.students.map(s => ({ sessionId: s.sessionId, name: s.name }))
                    dispatch(setStudents(list))
                }
            })
            .catch(() => { })
    }, [])

    return (
        <div className="max-w-6xl mx-auto px-6 py-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <PollForm onStart={handleStart} />
                    <LiveResults question={poll?.question} options={poll?.options || []} total={total} />
                </div>
            </div>
            <ChatPopup roomCode={roomCode} />
        </div>
    )
}


