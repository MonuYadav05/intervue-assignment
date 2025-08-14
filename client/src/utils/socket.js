import { io } from 'socket.io-client';
import { setUser, setRoomCode, setCurrentPoll, setTimeLeft, receiveAnswer, pollEnded, setPhase, setStudents } from '../features/poll/pollSlice.js'
import { addMessage } from '../features/chat/chatSlice.js'

const backendUrl = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

export const socket = io(backendUrl, {
  withCredentials: true,
  autoConnect: true,
});

let handlersBound = false
let appStore = null

export function initSocketHandlers(store) {
  if (handlersBound) return
  appStore = store

  socket.on('room_joined', payload => {
    const { roomCode, sessionId, name } = payload || {}
    if (!roomCode || !sessionId) return
    sessionStorage.setItem('studentName', name)
    sessionStorage.setItem('sessionId', sessionId)
    store.dispatch(setRoomCode(roomCode))
    store.dispatch(setUser({ name, sessionId, role: 'student' }))
    store.dispatch(setPhase('idle'))
  })

  socket.on('poll_started', payload => {
    const { roomCode, pollId, question, options, duration } = payload || {}
    store.dispatch(setRoomCode(roomCode))
    store.dispatch(setCurrentPoll({ id: pollId, question, options }))
    if (typeof duration === 'number') store.dispatch(setTimeLeft(duration))
    store.dispatch(setPhase('answering'))
  })

  socket.on('poll_time_update', payload => {
    if (typeof payload?.remainingSeconds === 'number') {
      store.dispatch(setTimeLeft(payload.remainingSeconds))
    }
  })

  socket.on('answer_received', payload => {
    const tallies = payload?.tallies || []
    store.dispatch(receiveAnswer({ tallies, totalAnswers: payload?.totalAnswers }))
  })

  socket.on('poll_ended', payload => {
    const options = payload?.results?.options || []
    store.dispatch(pollEnded({ options }))
  })

  socket.on('student_removed', payload => {
    try {
      const me = sessionStorage.getItem('sessionId')
      if (payload?.sessionId && me && payload.sessionId === me) {
        store.dispatch(setPhase('kicked'))
        socket.disconnect()
      } else if (appStore?.getState) {
        const curr = appStore.getState().poll?.students || []
        const next = curr.filter(s => s.sessionId !== payload?.sessionId)
        store.dispatch(setStudents(next))
      }
    } catch {}
  })

  // Chat
  socket.on('chat_message', payload => {
    const { sender, message, time } = payload || {}
    const currentUser = store.getState().poll?.name
    // Don't add message if it's from the current user (to prevent duplicates)
    if (sender !== currentUser) {
      store.dispatch(addMessage({ sender, message, time, self: false }))
    }
  })

  socket.on('participants', payload => {
    const list = payload?.participants || []
    store.dispatch(setStudents(list))
  })

  handlersBound = true
}

// Convenience emitters
export function joinRoom(roomCode, sessionId, name) {
  socket.emit('join_room', { roomCode, sessionId, name })
}

export function startPoll(roomCode, question, options, duration) {
  socket.emit('start_poll', { roomCode, question, options, duration })
}

export function submitAnswer(roomCode, sessionId, optionId) {
  socket.emit('submit_answer', { roomCode, sessionId, optionId })
}

export function removeStudent(roomCode, sessionId) {
  socket.emit('remove_student', { roomCode, sessionId })
}


