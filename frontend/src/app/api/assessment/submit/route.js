import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import Activity from '@/lib/models/Activity';

function lookupDifficulty(qid) {
  if (!qid) return 'medium';
  if (qid.includes('_easy_')) return 'easy';
  if (qid.includes('_medium_')) return 'medium';
  if (qid.includes('_hard_')) return 'hard';
  if (qid.includes('_master_')) return 'master';
  return 'medium';
}

export async function POST(req) {
  try {
    const cookieStore = await cookies();
    const sessionUser = req.headers.get('x-user-id') || cookieStore.get('session_user')?.value;
    if (!sessionUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { type, score_by_topic, questions_seen, responses } = await req.json();

    if (!type || !score_by_topic) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await dbConnect();
    const user = await User.findOne({ username: sessionUser });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    if (type === 'pre') {
      user.pre_assessment = {
        completed: true,
        score: score_by_topic,
        questions_seen: questions_seen || [],
        responses: responses || []
      };
    } else if (type === 'post') {
      user.post_assessment = {
        completed: true,
        score: score_by_topic,
        responses: responses || []
      };
    }

    // Log each response as an Activity answer_question action to integrate with stats & struggles
    if (responses && Array.isArray(responses)) {
      for (const resp of responses) {
        await Activity.create({
          username: sessionUser,
          topic: resp.subject || 'fractions',
          action: 'answer_question',
          details: {
            question_id: resp.question_id,
            question_text: resp.content || 'Assessment question.',
            student_answer: resp.student_answer,
            correct_answer: resp.correct_answer,
            is_correct: resp.is_correct,
            difficulty: lookupDifficulty(resp.question_id),
            attempt_number: 1,
            is_assessment: true,
            assessment_type: type
          }
        });
      }
    }

    await user.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
