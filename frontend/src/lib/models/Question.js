import mongoose from 'mongoose';

const QuestionSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  subject: { type: String, required: true },
  difficulty: { type: String, required: true },
  content: { type: String, required: true },
  correct_answer: { type: String, required: false },
  answers: { type: [String], required: false },
  options: { type: [String], required: false },
  visual_data: { type: String, required: false },
  hints: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true });

export default mongoose.models.Question || mongoose.model('Question', QuestionSchema);
