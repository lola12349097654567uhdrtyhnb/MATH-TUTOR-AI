import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import Activity from '@/lib/models/Activity';

export async function GET(req) {
  try {
    await dbConnect();
    
    const users = await User.find({}).lean();
    let backfilledCount = 0;
    const debugLogs = [];

    for (const user of users) {
      const username = user.username;
      if (!username) continue;

      const userLog = {
        username,
        role: user.role,
        pre_assessment_responses_count: user.pre_assessment?.responses?.length || 0,
        post_assessment_responses_count: user.post_assessment?.responses?.length || 0,
        seen_geometry_count: user.seen_questions_geometry?.length || 0,
        backfilled_this_user: 0
      };

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
          userLog.backfilled_this_user++;
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
          userLog.backfilled_this_user++;
        }
      }

      // 3. Backfill historic practice/diagnostic question completions (from seen_questions arrays)
      const topicsList = ['fractions', 'algebra', 'exponents', 'geometry'];
      for (const topic of topicsList) {
        const seenQs = user[`seen_questions_${topic}`] || [];
        const isDiagCompleted = !!user[`diagnostic_completed_${topic}`];
        
        for (const qid of seenQs) {
          const exists = await Activity.findOne({
            username,
            topic,
            $or: [
              { 'details.question_id': qid },
              { 'details.original_question_id': qid }
            ]
          });

          if (!exists) {
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
            userLog.backfilled_this_user++;
          }
        }
      }

      debugLogs.push(userLog);
    }

    return NextResponse.json({ 
      success: true, 
      backfilledCount,
      message: `Successfully backfilled ${backfilledCount} historic activity records!`,
      debugLogs
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
