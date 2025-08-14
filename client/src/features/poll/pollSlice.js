import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  roomCode: null,
  role: null, // 'student' | 'teacher'
  name: null,
  sessionId: null,
  currentPoll: null, // { id, question, options: [{id, text, votes}] }
  timeLeft: null,
  phase: 'idle', // idle | answering | waiting_results | results | kicked
  totalAnswers: 0,
  students: [],
}

const pollSlice = createSlice({
  name: 'poll',
  initialState,
  reducers: {
    setUser(state, action) {
      const { name, sessionId, role } = action.payload
      state.name = name
      state.sessionId = sessionId
      state.role = role || state.role
    },
    setRoomCode(state, action) {
      state.roomCode = action.payload
    },
    setPhase(state, action) {
      state.phase = action.payload
    },
    setCurrentPoll(state, action) {
      state.currentPoll = action.payload
      state.totalAnswers = 0
    },
    setTimeLeft(state, action) {
      state.timeLeft = action.payload
    },
    receiveAnswer(state, action) {
      const { tallies, totalAnswers } = action.payload
      if (!state.currentPoll) return
      const voteMap = new Map(tallies.map(t => [t.id, t.votes]))
      state.currentPoll.options = state.currentPoll.options.map(o => ({
        ...o,
        votes: voteMap.has(o.id) ? voteMap.get(o.id) : o.votes || 0,
      }))
      state.totalAnswers = typeof totalAnswers === 'number' ? totalAnswers : state.totalAnswers
    },
    pollEnded(state, action) {
      const { options } = action.payload
      if (state.currentPoll && options) {
        state.currentPoll.options = options
      }
      state.phase = 'results'
      state.timeLeft = null
    },
    setStudents(state, action) {
      state.students = Array.isArray(action.payload) ? action.payload : state.students
    },
    resetState() {
      return initialState
    },
  },
})

export const {
  setUser,
  setRoomCode,
  setPhase,
  setCurrentPoll,
  setTimeLeft,
  receiveAnswer,
  pollEnded,
  setStudents,
  resetState,
} = pollSlice.actions

export default pollSlice.reducer


