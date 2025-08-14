# Live Polling System

A real-time live polling system with a Node/Express/MongoDB backend and a React + Vite + Redux + Socket.io frontend. Includes teacher and student experiences, live charts, chat, and admin controls.

## Tech Stack
- Backend: Node.js, Express, Socket.io, Mongoose (MongoDB)
- Frontend: React, Vite, Redux Toolkit, React Router, Tailwind CSS, Chart.js
- Deployment: Vercel (frontend) + any Node host (Render/Railway/Vercel functions)

---

## Local Development

### Prerequisites
- Node 18+ and npm
- MongoDB instance (local or cloud)

### Backend
```
cd server
cp .env.example .env
# Update MONGODB_URI and FRONTEND_ORIGIN (and/or FRONTEND_URL)
npm install
npm start
```
Server will start at http://localhost:4000.

### Frontend
```
cd client
cp .env.example .env
# Set VITE_BACKEND_URL/VITE_SOCKET_URL if different
npm install
npm run dev
```
Frontend will start at http://localhost:5173.

---

## Endpoints (REST)
- GET `/health` → server health
- GET `/api/rooms/:code` → room details (students, currentPoll). teacherPass is omitted
- GET `/api/polls/:roomCode` → poll history (most recent first)
- GET `/api/poll/:pollId` → a specific poll and results

## Socket Events

Client → Server
- `create_room` { code, teacherName, teacherPass }
- `join_room` { roomCode, sessionId, name }
- `start_poll` { roomCode, question, options:[{id,text}|string], duration }
- `submit_answer` { roomCode, sessionId, optionId }
- `end_poll` { roomCode }
- `remove_student` { roomCode, sessionId }
- `chat_message` { roomCode, sender, message, time }

Server → Client
- `room_created` { roomCode, teacherName }
- `room_joined` { roomCode, sessionId, name }
- `poll_started` { roomCode, pollId, question, options, duration, startedAt }
- `poll_time_update` { roomCode, remainingSeconds }
- `answer_received` { roomCode, pollId, optionId, totalAnswers, tallies:[{id,votes}] }
- `poll_ended` { roomCode, pollId, reason, results:{ question, options, totalAnswers, endedAt } }
- `student_removed` { roomCode, sessionId }
- `error` { message, details? }
- `chat_message` { roomCode, sender, message, time }

---

## Features
- Create/join rooms (teacher/students)
- Start timed polls with multiple options
- Real-time voting with automatic end on all-answered or timer expiry
- Results chart updates in real-time
- Remove students in real-time
- Basic in-room chat popup
- REST endpoints for history and results

---

## Deployment

### Backend
- Provide environment variables:
  - `PORT` (if required by host)
  - `MONGODB_URI`
  - `FRONTEND_ORIGIN` (local dev) and/or `FRONTEND_URL` (deployed frontend URL)
- Start command: `npm start`
- Ensure CORS allows your frontend origin(s)

### Frontend (Vercel)
- Environment Variables:
  - `VITE_BACKEND_URL` = your backend base URL (e.g., https://api.example.com)
  - `VITE_SOCKET_URL` = same as above if Socket.io served from same host
- Build command: `npm run build`
- Output directory: `dist`

---

## Manual Test Plan (All Flows)
1. Teacher creates room
   - Visit `/teacher`; backend emits `room_created`.
2. Students join (unique names)
   - Visit `/student`, enter unique names; verify `room_joined` and participant list.
3. Teacher starts poll
   - Fill question/options/duration and click Ask Question; students see `poll_started` with countdown.
4. Students answer
   - Choose options and Submit. When all active students answered (or on timer expiry) poll ends; teacher and students see chart.
5. Teacher removes student
   - Click “Kick out” in participants; student sees kicked screen and is disconnected.
6. Poll history
   - Request `GET /api/polls/DEMO` (replace code) to verify stored polls.
7. UI
   - Compare screens with Figma; check colors, spacing, rounded cards, and chart styling.

---

## Notes
- Current demo room code is `DEMO`; connect real flow by passing generated codes from the teacher UI to students.
- `roomsState` is in-memory and resets on server restart; MongoDB persists polls and rooms.
- Tailwind v4 is used with `@tailwindcss/postcss`.

