import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import Question from '@/lib/models/Question';

export async function GET(req) {
  try {
    await dbConnect();
    const db = mongoose.connection.db;

    const anomalies = [];

    // Helper function to audit questions array
    const auditQuestions = (questionsArray, sourceName) => {
      let count = 0;
      questionsArray.forEach((q, idx) => {
        const qid = q.id || `${sourceName}_index_${idx}`;
        const content = q.content || '(no content)';
        const correct = q.correct_answer;
        const opts = q.options || q.answers || [];

        if (correct === undefined || correct === null) {
          anomalies.push({
            id: qid,
            source: sourceName,
            error: 'correct_answer field is missing entirely',
            content
          });
          count++;
          return;
        }

        if (String(correct).strip ? String(correct).trim() === '' : String(correct) === '') {
          anomalies.push({
            id: qid,
            source: sourceName,
            error: 'correct_answer is an empty or blank string',
            content
          });
          count++;
          return;
        }

        if (!opts || opts.length === 0) {
          anomalies.push({
            id: qid,
            source: sourceName,
            error: 'options array is empty or missing',
            content
          });
          count++;
          return;
        }

        // Clean values for comparison
        const cleanCorrect = String(correct).trim().toLowerCase();
        const cleanOpts = opts.map(o => String(o).trim().toLowerCase());

        if (!opts.includes(correct)) {
          if (cleanOpts.includes(cleanCorrect)) {
            anomalies.push({
              id: qid,
              source: sourceName,
              error: `correct_answer '${correct}' has a whitespace or casing mismatch with options: [${opts.join(', ')}]`,
              content
            });
            count++;
          } else {
            anomalies.push({
              id: qid,
              source: sourceName,
              error: `correct_answer '${correct}' does not exist in options: [${opts.join(', ')}]`,
              content
            });
            count++;
          }
        }
      });
      return count;
    };

    // 1. Audit assessment_questions.json
    let assessmentCount = 0;
    let assessmentAnomalies = 0;
    try {
      const aPath = path.join(process.cwd(), '../assessment_questions.json');
      if (fs.existsSync(aPath)) {
        const data = JSON.parse(fs.readFileSync(aPath, 'utf8'));
        assessmentCount = data.length;
        assessmentAnomalies = auditQuestions(data, 'assessment_questions.json');
      }
    } catch (e) {
      anomalies.push({ source: 'assessment_questions.json', error: `File load/parse error: ${e.message}` });
    }

    // 2. Audit questions.json (Practice Bank)
    let practiceCount = 0;
    let practiceAnomalies = 0;
    try {
      const pPath = path.join(process.cwd(), '../questions.json');
      if (fs.existsSync(pPath)) {
        const data = JSON.parse(fs.readFileSync(pPath, 'utf8'));
        practiceCount = data.length;
        practiceAnomalies = auditQuestions(data, 'questions.json');
      }
    } catch (e) {
      anomalies.push({ source: 'questions.json', error: `File load/parse error: ${e.message}` });
    }

    // 3. Audit production MongoDB questions collection
    let dbCount = 0;
    let dbAnomalies = 0;
    try {
      const dbQs = await Question.find({}).lean();
      dbCount = dbQs.length;
      dbAnomalies = auditQuestions(dbQs, 'MongoDB questions collection');
    } catch (e) {
      anomalies.push({ source: 'MongoDB questions collection', error: `DB query error: ${e.message}` });
    }

    return NextResponse.json({
      success: true,
      summary: {
        assessment_questions_loaded: assessmentCount,
        assessment_questions_anomalies: assessmentAnomalies,
        practice_questions_loaded: practiceCount,
        practice_questions_anomalies: practiceAnomalies,
        mongodb_questions_loaded: dbCount,
        mongodb_questions_anomalies: dbAnomalies,
        total_anomalies_found: anomalies.length
      },
      anomalies
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
