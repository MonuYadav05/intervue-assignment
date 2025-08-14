require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const { initSocketManager } = require('./services/socketManager');

const app = express();

const PORT = process.env.PORT || 4000;
const MONGODB_URI = process.env.MONGODB_URI || '';
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';
const FRONTEND_URL = process.env.FRONTEND_URL || null;
const ALLOWED_ORIGINS = [FRONTEND_ORIGIN, FRONTEND_URL].filter(Boolean);

// Middleware
app.use(
  cors({
    origin: ALLOWED_ORIGINS.length > 0 ? ALLOWED_ORIGINS : FRONTEND_ORIGIN,
    credentials: true,
  })
);
app.use(express.json());

// API routes
const pollsRoutes = require('./routes/polls');
app.use('/api', pollsRoutes);

// Basic health route
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Create HTTP server and attach Socket.io
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ALLOWED_ORIGINS.length > 0 ? ALLOWED_ORIGINS : FRONTEND_ORIGIN,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Initialize real-time logic
initSocketManager(io);
console.log('Socket.io running');

// Connect to MongoDB and start server
async function start() {
  if (!MONGODB_URI) {
    console.error('Missing MONGODB_URI in environment.');
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGODB_URI , {
       useNewUrlParser: true,
       useUnifiedTopology: true,
       ssl: true
    });
    console.log('Connected to MongoDB');

    server.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();

module.exports = { app, server, io };


