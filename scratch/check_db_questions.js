const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/tutor_db";

const QuestionSchema = new mongoose.Schema({
  id: String,
  subject: String,
  difficulty: String,
  content: String,
  correct_answer: String,
  options: [String],
  answers: [String]
}, { collection: 'questions' });

const Question = mongoose.models.Question || mongoose.model('Question', QuestionSchema);

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB!");

  const questions = await Question.find({});
  console.log(`Auditing ${questions.length} questions in MongoDB...`);

  let anomalies = 0;

  questions.forEach(q => {
    const qid = q.id || `_id:${q._id}`;
    const content = q.content || '(no content)';
    const correct = q.correct_answer;
    const opts = q.options || [];

    if (!correct) {
      console.log(`❌ Question '${qid}' has missing or empty correct_answer!`);
      console.log(`   Content: ${content}`);
      anomalies++;
      return;
    }

    if (!opts || opts.length === 0) {
      console.log(`❌ Question '${qid}' has no options!`);
      console.log(`   Content: ${content}`);
      anomalies++;
      return;
    }

    if (!opts.includes(correct)) {
      const trimmedCorrect = correct.trim();
      const trimmedOpts = opts.map(o => o.trim());
      if (trimmedOpts.includes(trimmedCorrect)) {
        console.log(`⚠️  Question '${qid}' has correct_answer '${correct}' which matches option with whitespace mismatch.`);
        anomalies++;
      } else {
        console.log(`❌ Question '${qid}' has correct_answer '${correct}' which is NOT in options [${opts.join(', ')}]!`);
        console.log(`   Content: ${content}`);
        anomalies++;
      }
    }
  });

  console.log(`Audit finished. Found ${anomalies} anomalies.`);
  process.exit(0);
}

run().catch(console.error);
