const Room = require('../models/Room');
const Poll = require('../models/Poll');

async function getRoomDetails(req, res) {
  try {
    const { code } = req.params;
    const room = await Room.findOne({ code }, { teacherPass: 0, __v: 0 }).lean();
    if (!room) return res.status(404).json({ message: 'Room not found' });
    return res.json(room);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch room', details: error.message });
  }
}

async function getRoomPollHistory(req, res) {
  try {
    const { roomCode } = req.params;
    const polls = await Poll.find({ roomCode }).sort({ createdAt: -1 }).lean();
    return res.json(polls);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch polls', details: error.message });
  }
}

async function getPollById(req, res) {
  try {
    const { pollId } = req.params;
    const poll = await Poll.findById(pollId).lean();
    if (!poll) return res.status(404).json({ message: 'Poll not found' });
    return res.json(poll);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch poll', details: error.message });
  }
}

module.exports = {
  getRoomDetails,
  getRoomPollHistory,
  getPollById,
};


