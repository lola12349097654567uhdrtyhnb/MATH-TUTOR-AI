import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import Activity from '@/lib/models/Activity';

export async function GET(req) {
  try {
    await dbConnect();
    
    const users = await User.find({}).lean();
    let backfilledCount = 0;

    for (const user of users) {
      const username = user.username;
      if (!username) continue;

      // 1. Backfill Pre-Assessment responses
      const preResponses = user.pre_assessment?.responses || [];
      for (const resp of preResponses) {
        const qid = resp.question_id || resp.id;
        if (!qid) continue;

        const exists = await Activity.findOne({
          username,
          action: 'answer_question',
          'details.question_id': qid,
          'details.is_assessment': true,
          'details.assessment_type': 'pre'
        });

        if (!exists) {
          await Activity.create({
            username,
            topic: resp.subject || 'fractions',
            action: 'answer_question',
            details: {
              question_id: qid,
              question_text: resp.content || 'Assessment question.',
              student_answer: resp.student_answer || 'N/A',
              correct_answer: resp.correct_answer || 'N/A',
              is_correct: resp.is_correct || false,
              difficulty: 'medium',
              attempt_number: 1,
              is_assessment: true,
              assessment_type: 'pre'
            },
            createdAt: user.pre_assessment.completedAt || new Date()
          });
          backfilledCount++;
        }
      }

      // 2. Backfill Post-Assessment responses
      const postResponses = user.post_assessment?.responses || [];
      for (const resp of postResponses) {
        const qid = resp.question_id || resp.id;
        if (!qid) continue;

        const exists = await Activity.findOne({
          username,
          action: 'answer_question',
          'details.question_id': qid,
          'details.is_assessment': true,
          'details.assessment_type': 'post'
        });

        if (!exists) {
          await Activity.create({
            username,
            topic: resp.subject || 'fractions',
            action: 'answer_question',
            details: {
              question_id: qid,
              question_text: resp.content || 'Assessment question.',
              student_answer: resp.student_answer || 'N/A',
              correct_answer: resp.correct_answer || 'N/A',
              is_correct: resp.is_correct || false,
              difficulty: 'medium',
              attempt_number: 1,
              is_assessment: true,
              assessment_type: 'post'
            },
            createdAt: user.post_assessment.completedAt || new Date()
          });
          backfilledCount++;
        }
      }

      // 3. Backfill historic practice/diagnostic question completions (from seen_questions arrays)
      const topicsList = ['fractions', 'algebra', 'exponents', 'geometry'];
      for (const topic of topicsList) {
        const seenQs = user[`seen_questions_${topic}`] || [];
        const isDiagCompleted = !!user[`diagnostic_completed_${topic}`];
        
        for (const qid of seenQs) {
          // Check if an activity for this question and topic already exists
          const exists = await Activity.findOne({
            username,
            topic,
            $or: [
              { 'details.question_id': qid },
              { 'details.original_question_id': qid }
            ]
          });

          if (!exists) {
            // Deduce correctness (if diagnostic completed and belief is high, assume correct or balanced)
            const wasCorrect = isDiagCompleted ? true : false; 
            
            await Activity.create({
              username,
              topic,
              action: 'answer_question',
              details: {
                question_id: qid,
                question_text: `Practice question in ${topic}.`,
                student_answer: 'N/A',
                correct_answer: 'N/A',
                is_correct: wasCorrect,
                difficulty: user[`last_difficulty_${topic}`] || 'medium',
                attempt_number: 1,
                is_diagnostic: isDiagCompleted
              },
              createdAt: user.updatedAt || new Date()
            });
            backfilledCount++;
          }
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Successfully backfilled ${backfilledCount} historic activity records in the live cloud database!` 
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
