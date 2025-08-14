import { configureStore } from '@reduxjs/toolkit';
import pollReducer from '../features/poll/pollSlice.js';
import chatReducer from '../features/chat/chatSlice.js';

export const store = configureStore({
  reducer: {
    poll: pollReducer,
    chat: chatReducer,
  },
});


