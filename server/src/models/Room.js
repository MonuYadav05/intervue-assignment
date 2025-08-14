const mongoose = require('mongoose');

const { Schema } = mongoose;

const studentSchema = new Schema(
  {
    sessionId: { type: String, required: true },
    name: { type: String, required: true },
    socketId: { type: String, default: null },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const roomSchema = new Schema(
  {
    code: { type: String, required: true, index: true, unique: true },
    teacherName: { type: String, required: true },
    teacherPass: { type: String, required: true },
    students: { type: [studentSchema], default: [] },
    currentPoll: { type: Schema.Types.ObjectId, ref: 'Poll', default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Room', roomSchema);


