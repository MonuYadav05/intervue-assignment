const Room = require('../models/Room');
const Poll = require('../models/Poll');

// In-memory state for each room
// roomsState[roomCode] = {
//   activeStudents: Set<sessionId>,
//   socketMap: Map<socketId, { sessionId, role: 'teacher' | 'student' }>,
//   timer: { intervalId, timeoutId, endTime } | null
// }
const roomsState = new Map();

// Global mapping to quickly resolve on disconnect
// socketToRoom[socketId] = { roomCode, sessionId, role }
const socketToRoom = new Map();

function getOrCreateRoomState(roomCode) {
  if (!roomsState.has(roomCode)) {
    roomsState.set(roomCode, {
      activeStudents: new Set(),
      socketMap: new Map(),
      timer: null,
    });
  }
  return roomsState.get(roomCode);
}

function clearRoomTimer(roomCode) {
  const state = roomsState.get(roomCode);
  if (!state || !state.timer) return;
  const { intervalId, timeoutId } = state.timer;
  if (intervalId) clearInterval(intervalId);
  if (timeoutId) clearTimeout(timeoutId);
  state.timer = null;
}

async function endPollInternal(io, roomCode, reason = 'ended') {
  try {
    const room = await Room.findOne({ code: roomCode });
    if (!room) return;

    let poll = null;
    if (room.currentPoll) {
      poll = await Poll.findById(room.currentPoll);
    }
    if (!poll || poll.status !== 'open') {
      // Fallback: find any open poll for the room
      poll = await Poll.findOne({ roomCode, status: 'open' });
    }
    if (!poll) return;

    poll.status = 'closed';
    poll.endedAt = new Date();
    await poll.save();

    clearRoomTimer(roomCode);

    // Reset the room's current poll pointer to allow next poll
    if (room.currentPoll?.toString() === poll._id.toString()) {
      room.currentPoll = null;
      await room.save();
    }

    io.to(roomCode).emit('poll_ended', {
      roomCode,
      pollId: poll._id,
      reason,
      results: {
        options: poll.options,
        totalAnswers: poll.answers?.length || 0,
        question: poll.question,
        endedAt: poll.endedAt,
      },
    });
  } catch (error) {
    io.to(roomCode).emit('error', { message: 'Failed to end poll', details: error.message });
  }
}

async function haveAllActiveStudentsAnswered(roomCode, poll) {
  const state = roomsState.get(roomCode);
  if (!state) return false;
  const active = state.activeStudents;
  if (!poll || !Array.isArray(poll.answers)) return false;

  const answered = new Set(poll.answers.map(a => a.studentSessionId));
  for (const sessionId of active) {
    if (!answered.has(sessionId)) return false;
  }
  return active.size > 0; // all active have answered and there was at least one
}

function initSocketManager(io) {
  io.on('connection', socket => {
    // Basic chat relay within room
    socket.on('chat_message', payload => {
      try {
        const { roomCode, sender, message, time } = payload || {}
        if (!roomCode || !message) return
        io.to(roomCode).emit('chat_message', { roomCode, sender, message, time: time || new Date().toISOString() })
      } catch {}
    })
    // create_room: { code, teacherName, teacherPass }
    socket.on('create_room', async payload => {
      try {
        const { code, teacherName, teacherPass } = payload || {};
        if (!code || !teacherName || !teacherPass) {
          return socket.emit('error', { message: 'Missing required fields for create_room' });
        }

        let room = await Room.findOne({ code });
        if (!room) {
          room = await Room.create({ code, teacherName, teacherPass, students: [] });
        }

        const state = getOrCreateRoomState(code);
        state.socketMap.set(socket.id, { sessionId: null, role: 'teacher' });
        socketToRoom.set(socket.id, { roomCode: code, sessionId: null, role: 'teacher' });

        socket.join(code);
        socket.emit('room_created', { roomCode: code, teacherName: room.teacherName });
      } catch (error) {
        socket.emit('error', { message: 'Failed to create room', details: error.message });
      }
    });

    // join_room: { roomCode, sessionId, name }
    socket.on('join_room', async payload => {
      try {
        const { roomCode, sessionId, name } = payload || {};
        if (!roomCode || !sessionId || !name) {
          return socket.emit('error', { message: 'Missing required fields for join_room' });
        }

        const room = await Room.findOne({ code: roomCode });
        if (!room) {
          return socket.emit('error', { message: 'Room not found' });
        }

        const existingIndex = room.students.findIndex(s => s.sessionId === sessionId);
        if (existingIndex >= 0) {
          room.students[existingIndex].name = name;
          room.students[existingIndex].socketId = socket.id;
          room.students[existingIndex].joinedAt = new Date();
        } else {
          room.students.push({ sessionId, name, socketId: socket.id });
        }
        await room.save();

        const state = getOrCreateRoomState(roomCode);
        state.activeStudents.add(sessionId);
        state.socketMap.set(socket.id, { sessionId, role: 'student' });
        socketToRoom.set(socket.id, { roomCode, sessionId, role: 'student' });

        socket.join(roomCode);
        // Emit participants list to everyone in room (after join)
        socket.emit('room_joined', { roomCode, sessionId, name });
        const fresh = await Room.findOne({ code: roomCode });
        const participants = fresh ? fresh.students.map(s => ({ sessionId: s.sessionId, name: s.name })) : room.students.map(s => ({ sessionId: s.sessionId, name: s.name }));
        io.to(roomCode).emit('participants', { roomCode, participants });

        // If there is an active poll, immediately inform the newly joined student
        if (room.currentPoll) {
          const poll = await Poll.findById(room.currentPoll);
          if (poll && poll.status === 'open') {
            const state = getOrCreateRoomState(roomCode);
            let remainingSeconds = null;
            if (state?.timer?.endTime) {
              remainingSeconds = Math.max(0, Math.ceil((state.timer.endTime - Date.now()) / 1000));
            }
            socket.emit('poll_started', {
              roomCode,
              pollId: poll._id,
              question: poll.question,
              options: poll.options,
              duration: remainingSeconds,
              startedAt: poll.startedAt,
            });
          }
        }
      } catch (error) {
        socket.emit('error', { message: 'Failed to join room', details: error.message });
      }
    });

    // start_poll: { roomCode, question, options: [{id?, text}], duration: seconds }
    socket.on('start_poll', async payload => {
      try {
        const { roomCode, question, options, duration } = payload || {};
        if (!roomCode || !question || !Array.isArray(options) || options.length === 0) {
          return socket.emit('error', { message: 'Invalid start_poll payload' });
        }

        const mapping = socketToRoom.get(socket.id);
        if (!mapping || mapping.roomCode !== roomCode || mapping.role !== 'teacher') {
          return socket.emit('error', { message: 'Only the teacher can start a poll' });
        }

        const room = await Room.findOne({ code: roomCode });
        if (!room) return socket.emit('error', { message: 'Room not found' });

        // Check existing poll status
        let existingPoll = null;
        if (room.currentPoll) {
          existingPoll = await Poll.findById(room.currentPoll);
        } else {
          existingPoll = await Poll.findOne({ roomCode, status: 'open' });
        }

        if (existingPoll && existingPoll.status === 'open') {
          const allAnswered = await haveAllActiveStudentsAnswered(roomCode, existingPoll);
          if (!allAnswered) {
            return socket.emit('error', { message: 'Previous poll still open and not all students have answered' });
          }
          // End the previous poll before starting a new one
          await endPollInternal(io, roomCode, 'all_answered');
        }

        const normalizedOptions = options.map((opt, idx) => {
          if (typeof opt === 'string') {
            return { id: `opt_${idx + 1}`, text: opt, votes: 0, correct: null };
          }
          return { id: opt.id || `opt_${idx + 1}`, text: opt.text, votes: 0, correct: typeof opt.correct === 'boolean' ? opt.correct : null };
        });

        const now = new Date();
        const poll = await Poll.create({
          roomCode,
          question,
          options: normalizedOptions,
          status: 'open',
          duration: typeof duration === 'number' ? duration : null,
          startedAt: now,
          answers: [],
        });

        room.currentPoll = poll._id;
        await room.save();

        const state = getOrCreateRoomState(roomCode);
        clearRoomTimer(roomCode);
        if (poll.duration && poll.duration > 0) {
          const endTime = Date.now() + poll.duration * 1000;
          const intervalId = setInterval(async () => {
            const remainingMs = endTime - Date.now();
            const remainingSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
            io.to(roomCode).emit('poll_time_update', { roomCode, remainingSeconds });

            // When time runs out, end the poll once
            if (remainingSeconds <= 0) {
              clearRoomTimer(roomCode);
              await endPollInternal(io, roomCode, 'time_expired');
            }
          }, 1000);
          // Failsafe timeout
          const timeoutId = setTimeout(async () => {
            clearRoomTimer(roomCode);
            await endPollInternal(io, roomCode, 'time_expired');
          }, poll.duration * 1000 + 100); // small buffer

          state.timer = { intervalId, timeoutId, endTime };
        }

        io.to(roomCode).emit('poll_started', {
          roomCode,
          pollId: poll._id,
          question: poll.question,
          options: poll.options,
          duration: poll.duration,
          startedAt: poll.startedAt,
        });
      } catch (error) {
        socket.emit('error', { message: 'Failed to start poll', details: error.message });
      }
    });

    // submit_answer: { roomCode, sessionId, optionId }
    socket.on('submit_answer', async payload => {
      try {
        const { roomCode, sessionId, optionId } = payload || {};
        if (!roomCode || !sessionId || !optionId) {
          return socket.emit('error', { message: 'Invalid submit_answer payload' });
        }

        const mapping = socketToRoom.get(socket.id);
        if (!mapping || mapping.roomCode !== roomCode || mapping.role !== 'student' || mapping.sessionId !== sessionId) {
          return socket.emit('error', { message: 'Not authorized to submit answer' });
        }

        const room = await Room.findOne({ code: roomCode });
        if (!room || !room.currentPoll) {
          return socket.emit('error', { message: 'No active poll' });
        }

        const poll = await Poll.findById(room.currentPoll);
        if (!poll || poll.status !== 'open') {
          return socket.emit('error', { message: 'Poll is not open' });
        }

        const already = poll.answers.find(a => a.studentSessionId === sessionId);
        if (already) {
          return socket.emit('error', { message: 'Already answered' });
        }

        const opt = poll.options.find(o => o.id === optionId);
        if (!opt) {
          return socket.emit('error', { message: 'Invalid option' });
        }

        poll.answers.push({ studentSessionId: sessionId, optionId });
        opt.votes = (opt.votes || 0) + 1;
        await poll.save();

        io.to(roomCode).emit('answer_received', {
          roomCode,
          pollId: poll._id,
          optionId,
          totalAnswers: poll.answers.length,
          tallies: poll.options.map(o => ({ id: o.id, votes: o.votes })),
        });

        const allAnswered = await haveAllActiveStudentsAnswered(roomCode, poll);
        if (allAnswered) {
          await endPollInternal(io, roomCode, 'all_answered');
        }
      } catch (error) {
        socket.emit('error', { message: 'Failed to submit answer', details: error.message });
      }
    });

    // end_poll: { roomCode }
    socket.on('end_poll', async payload => {
      try {
        const { roomCode } = payload || {};
        if (!roomCode) return socket.emit('error', { message: 'roomCode required' });

        const mapping = socketToRoom.get(socket.id);
        if (!mapping || mapping.roomCode !== roomCode || mapping.role !== 'teacher') {
          return socket.emit('error', { message: 'Only the teacher can end the poll' });
        }

        await endPollInternal(io, roomCode, 'teacher_ended');
      } catch (error) {
        socket.emit('error', { message: 'Failed to end poll', details: error.message });
      }
    });

    // remove_student: { roomCode, sessionId }
    socket.on('remove_student', async payload => {
      try {
        const { roomCode, sessionId } = payload || {};
        if (!roomCode || !sessionId) return socket.emit('error', { message: 'roomCode and sessionId required' });

        const mapping = socketToRoom.get(socket.id);
        if (!mapping || mapping.roomCode !== roomCode || mapping.role !== 'teacher') {
          return socket.emit('error', { message: 'Only the teacher can remove a student' });
        }

        const room = await Room.findOneAndUpdate(
          { code: roomCode },
          { $pull: { students: { sessionId } } },
          { new: true }
        );
        if (!room) return socket.emit('error', { message: 'Room not found' });

        const state = getOrCreateRoomState(roomCode);
        state.activeStudents.delete(sessionId);

        // Find and notify/disconnect the student's socket(s)
        for (const [sockId, info] of state.socketMap.entries()) {
          if (info.sessionId === sessionId) {
            const target = io.sockets.sockets.get(sockId);
            if (target) {
              target.leave(roomCode);
              target.emit('student_removed', { roomCode, sessionId });
              socketToRoom.delete(sockId);
              state.socketMap.delete(sockId);
              try { target.disconnect(true); } catch {}
            }
          }
        }

        io.to(roomCode).emit('student_removed', { roomCode, sessionId });
        // Broadcast updated participants list
        io.to(roomCode).emit('participants', { roomCode, participants: room.students.map(s => ({ sessionId: s.sessionId, name: s.name })) });
      } catch (error) {
        socket.emit('error', { message: 'Failed to remove student', details: error.message });
      }
    });

    // Clean up on disconnect
    socket.on('disconnect', () => {
      const mapping = socketToRoom.get(socket.id);
      if (!mapping) return;
      const { roomCode, sessionId } = mapping;
      const state = roomsState.get(roomCode);
      if (state) {
        state.socketMap.delete(socket.id);
        if (sessionId) {
          state.activeStudents.delete(sessionId);
        }
      }
      socketToRoom.delete(socket.id);
      // Best-effort broadcast fresh participants from DB
      (async () => {
        try {
          const room = await Room.findOne({ code: roomCode });
          if (room) {
            const participants = room.students.map(s => ({ sessionId: s.sessionId, name: s.name }));
            io.to(roomCode).emit('participants', { roomCode, participants });
          }
        } catch {}
      })();
    });
  });
}

module.exports = {
  initSocketManager,
  roomsState,
};


