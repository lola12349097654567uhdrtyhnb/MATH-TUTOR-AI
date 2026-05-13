import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';

export async function POST(req) {
  try {
    const { topic, question_id, answer, response_time_seconds } = await req.json();
    const cookieStore = await cookies();
    const sessionUser = req.headers.get('x-user-id') || cookieStore.get('session_user')?.value;
    
    await dbConnect();
    const user = await User.findOne({ username: sessionUser });

    const user_data = {
      learning_profile: user.learning_profile || {},
      [`brain_state_${topic}`]: user[`brain_state_${topic}`] || {}
    };

    const pyReq = await fetch(`${process.env.PYTHON_API_URL}/api/submit_diagnostic`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_data, topic, question_id, answer })
    });
    const python_resp = await pyReq.json();
    
    user[`brain_state_${topic}`] = python_resp.brain_state;
    user[`diagnostic_time_sum_${topic}`] += response_time_seconds;
    if (python_resp.is_correct) {
      user[`diagnostic_correct_${topic}`] += 1;
    }
    user[`diagnostic_index_${topic}`] += 1;

    const current_idx = user[`diagnostic_index_${topic}`];
    const total_questions = python_resp.brain_state.diagnostic_questions.length;
    
    let is_completed = false;
    let next_diagnostic_question = null;
    let topic_intro_required = false;
    let next_action = null;

    if (current_idx >= total_questions) {
      is_completed = true;
      user[`diagnostic_completed_${topic}`] = true;
      user[`topic_intro_seen_${topic}`] = true; 
      
      // Get normal action
      const actReq = await fetch(`${process.env.PYTHON_API_URL}/api/get_next_action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_data: { learning_profile: user.learning_profile, [`brain_state_${topic}`]: user[`brain_state_${topic}`] }, topic, seen_questions: user[`seen_questions_${topic}`] })
      });
      const actRes = await actReq.json();
      next_action = actRes.next_action;
      user[`current_action_${topic}`] = next_action;
      if (next_action) user[`seen_questions_${topic}`].push(next_action.id);
    } else {
      next_diagnostic_question = python_resp.brain_state.diagnostic_questions[current_idx];
      user[`current_action_${topic}`] = next_diagnostic_question;
    }

    await user.save();

    return NextResponse.json({
      is_correct: python_resp.is_correct,
      diagnostic_completed: is_completed,
      next_diagnostic_question,
      topic_intro_required: false,
      next_action,
      progress: { current: current_idx + 1, total: total_questions },
      mastery: Math.round(python_resp.brain_state.belief * 100) / 100
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
