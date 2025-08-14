const mongoose = require('mongoose');

const { Schema } = mongoose;

const optionSchema = new Schema(
  {
    id: { type: String, required: true },
    text: { type: String, required: true },
    votes: { type: Number, default: 0, min: 0 },
    correct: { type: Boolean, default: null },
  },
  { _id: false }
);

const answerSchema = new Schema(
  {
    studentSessionId: { type: String, required: true },
    optionId: { type: String, required: true },
    answeredAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const pollSchema = new Schema(
  {
    roomCode: { type: String, required: true, index: true },
    question: { type: String, required: true },
    options: { type: [optionSchema], default: [] },
    status: { type: String, enum: ['open', 'closed'], default: 'closed', index: true },
    duration: { type: Number, default: null },
    startedAt: { type: Date, default: null },
    endedAt: { type: Date, default: null },
    answers: { type: [answerSchema], default: [] },
  },
  { timestamps: true }
);

pollSchema.index({ roomCode: 1, status: 1 });

module.exports = mongoose.model('Poll', pollSchema);

 
