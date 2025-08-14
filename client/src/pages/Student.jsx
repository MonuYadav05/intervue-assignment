import { useEffect, useMemo, useState } from 'react'
import { socket, initSocketHandlers, joinRoom, submitAnswer } from '../utils/socket'
import { useDispatch, useSelector } from 'react-redux'
import { setUser, setRoomCode, setPhase } from '../features/poll/pollSlice'
import NameModal from '../components/NameModal'
import PollView from '../components/PollView'
import WaitingForResults from '../components/WaitingForResults'
import ResultsChart from '../components/ResultsChart'
import ChatPopup from '../components/ChatPopup'
import Badge from '../components/Badge'

export default function Student() {
    const dispatch = useDispatch()
    initSocketHandlers(window.__APP_STORE__ || { dispatch: () => { } })

    const poll = useSelector(s => s.poll.currentPoll)
    const remainingSeconds = useSelector(s => s.poll.timeLeft)
    const phase = useSelector(s => s.poll.phase)
    const roomCode = useSelector(s => s.poll.roomCode) || 'DEMO'
    const nameInfo = useSelector(s => ({ name: s.poll.name, sessionId: s.poll.sessionId }))

    useEffect(() => {
        const name = sessionStorage.getItem('studentName')
        const sessionId = sessionStorage.getItem('sessionId')
        if (name && sessionId) {
            dispatch(setUser({ name, sessionId, role: 'student' }))
            dispatch(setRoomCode(roomCode))
            joinRoom(roomCode, sessionId, name)
            dispatch(setPhase('idle'))
        }
    }, [])

    // Monitor phase changes for better user feedback
    useEffect(() => {
        if (phase === 'kicked') {
            console.log('Student has been kicked out - phase changed to kicked')
            // Clear any stored session data
            sessionStorage.removeItem('studentName')
            sessionStorage.removeItem('sessionId')
        }
    }, [phase])

    function handleConfirm(info) {
        dispatch(setUser({ ...info, role: 'student' }))
        dispatch(setRoomCode(roomCode))
        joinRoom(roomCode, info.sessionId, info.name)
        dispatch(setPhase('idle'))
    }

    async function submitAnswerAction(optionId) {
        if (!poll || !nameInfo?.sessionId) return
        dispatch(setPhase('waiting_results'))
        submitAnswer(roomCode, nameInfo.sessionId, optionId)
    }

    const content = useMemo(() => {
        // Don't show any content if name is not provided yet
        if (!nameInfo.name) {
            return null
        }

        if (phase === 'kicked') {
            return (
                <div className=" flex flex-col items-center justify-center text-center mt-34">
                    <Badge />
                    <div className="">
                        <h1 className="mt-5 text-2xl sm:text-3xl ">
                            You’ve been Kicked out !
                        </h1>
                        <p className="mt-2 text-gray-500 text-sm leading-relaxed">
                            Looks like the teacher had removed you from the poll system .Please
                            Try again sometime.   </p>
                    </div>
                </div>
            )
        }

        if (phase === 'answering') {
            return <PollView poll={poll} remainingSeconds={remainingSeconds} onSubmit={submitAnswerAction} />
        }
        if (phase === 'waiting_results') {
            return <WaitingForResults />
        }
        if (phase === 'results') {
            return (
                <div className="max-w-2xl mx-auto">
                    <ResultsChart question={poll?.question} options={poll?.options || []} total={(poll?.options || []).reduce((s, o) => s + (o.votes || 0), 0)} />
                    <p className="text-center mt-4 text-gray-600">Wait for the teacher to ask a new question..</p>
                </div>
            )
        }

        // Default case: show waiting for questions
        return (
            <div className="min-h-[50vh] flex flex-col items-center justify-center gap-6">
                <Badge />
                <div className="w-6 h-6 rounded-full border-2 border-violet-500 border-r-transparent animate-spin" />
                <p className="text-center text-lg font-medium">Wait for the teacher to ask questions..</p>
            </div>
        )
    }, [phase, poll, remainingSeconds, nameInfo.name])
    console.log(nameInfo)
    return (
        <div className=" bg-white px-6 my-28">
            {!nameInfo.name && <NameModal open onConfirm={handleConfirm} />}
            <div className="max-w-4xl mx-auto">{content}</div>
            <ChatPopup roomCode={roomCode} />
        </div>
    )
}


