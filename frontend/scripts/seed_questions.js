import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env.local') });

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

const Question = mongoose.models.Question || mongoose.model('Question', QuestionSchema);

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB");

  const dataPath = path.join(__dirname, '../../../questions.json');
  const rawData = fs.readFileSync(dataPath);
  const questions = JSON.parse(rawData);

  console.log(`Found ${questions.length} questions. Migrating...`);

  for (const q of questions) {
    await Question.findOneAndUpdate(
      { id: q.id },
      { $set: q },
      { upsert: true, new: true }
    );
  }

  console.log("Migration complete!");
  process.exit(0);
}

seed();
