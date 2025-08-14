import { createSlice, nanoid } from '@reduxjs/toolkit'

const initialState = {
  messages: [], // {id, sender, message, time, self}
}

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    addMessage: {
      reducer(state, action) {
        state.messages.push(action.payload)
      },
      prepare({ sender, message, time, self }) {
        return { payload: { id: nanoid(), sender, message, time, self: !!self } }
      },
    },
    clearChat(state) {
      state.messages = []
    },
  },
})

export const { addMessage, clearChat } = chatSlice.actions
export default chatSlice.reducer


