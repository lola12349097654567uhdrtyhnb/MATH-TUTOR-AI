import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import Activity from '@/lib/models/Activity';
import fs from 'fs';
import path from 'path';

export async function GET(req) {
  try {
    await dbConnect();

    // 1. Load questions data for difficulty lookups
    let questionsData = [];
    let assessmentData = [];
    try {
      const qPath = path.join(process.cwd(), '../questions.json');
      if (fs.existsSync(qPath)) questionsData = JSON.parse(fs.readFileSync(qPath, 'utf8'));
    } catch (e) {}
    try {
      const aPath = path.join(process.cwd(), '../assessment_questions.json');
      if (fs.existsSync(aPath)) assessmentData = JSON.parse(fs.readFileSync(aPath, 'utf8'));
    } catch (e) {}

    function lookupDifficulty(qid) {
      if (!qid) return 'medium';
      
      // Look up in assessment_questions.json
      const assessMatch = assessmentData.find(q => q.id === qid);
      if (assessMatch && assessMatch.difficulty) return assessMatch.difficulty;
      
      // Look up in questions.json
      const questionsMatch = questionsData.find(q => q.id === qid);
      if (questionsMatch && questionsMatch.difficulty) return questionsMatch.difficulty;
      
      // Deduce from ID string
      if (qid.includes('_easy_')) return 'easy';
      if (qid.includes('_medium_')) return 'medium';
      if (qid.includes('_hard_')) return 'hard';
      if (qid.includes('_master_')) return 'master';
      
      return 'medium';
    }

    // 2. Perform one-time migration to correct the difficulties of all existing activities
    const allActivities = await Activity.find({ action: 'answer_question' });
    let migratedDifficultyCount = 0;
    for (const act of allActivities) {
      const qid = act.details?.question_id || act.details?.original_question_id;
      if (qid) {
        const correctDiff = lookupDifficulty(qid);
        if (act.details.difficulty !== correctDiff) {
          act.details.difficulty = correctDiff;
          act.markModified('details');
          await act.save();
          migratedDifficultyCount++;
        }
      }
    }
    
    // 3. Perform normal backfill for any unrecorded historic seen lists & pre/post assessment responses
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

      // Backfill Pre-Assessment responses
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
              difficulty: lookupDifficulty(qid),
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

      // Backfill Post-Assessment responses
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
              difficulty: lookupDifficulty(qid),
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

      // Backfill historic practice/diagnostic question completions (from seen_questions arrays)
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
                difficulty: lookupDifficulty(qid),
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

    // 4. Clean up orphaned activities of deleted users to free up space and clear the audit queue
    const allUsers = await User.find({}).project({ username: 1 }).lean();
    const existingUsernames = new Set(allUsers.map(u => u.username));
    
    const uniqueActivityUsernames = await Activity.distinct('username');
    const orphanedUsernames = uniqueActivityUsernames.filter(uname => !existingUsernames.has(uname));
    
    let deletedActivitiesCount = 0;
    if (orphanedUsernames.length > 0) {
      const deleteResult = await Activity.deleteMany({ username: { $in: orphanedUsernames } });
      deletedActivitiesCount = deleteResult.deletedCount;
    }

    return NextResponse.json({ 
      success: true, 
      backfilledCount,
      migratedDifficultyCount,
      deletedActivitiesCount,
      message: `Successfully backfilled ${backfilledCount} historic activity records, migrated ${migratedDifficultyCount} difficulties, and purged ${deletedActivitiesCount} orphaned activities of deleted students in the live database!`,
      debugLogs
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
