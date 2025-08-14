const express = require('express');
const { getRoomDetails, getRoomPollHistory, getPollById } = require('../controllers/polls');

const router = express.Router();

// GET /api/rooms/:code -> room details
router.get('/rooms/:code', getRoomDetails);

// GET /api/polls/:roomCode -> poll history for the room
router.get('/polls/:roomCode', getRoomPollHistory);

// GET /api/poll/:pollId -> poll results
router.get('/poll/:pollId', getPollById);

module.exports = router;


