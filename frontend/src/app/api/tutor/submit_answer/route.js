import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import Activity from '@/lib/models/Activity';

export async function POST(req) {
  try {
    const { topic, question_id, answer, response_time_seconds, hint_used } = await req.json();
    const sessionUser = (await cookies()).get('session_user')?.value;
    
    await dbConnect();
    const user = await User.findOne({ username: sessionUser });

    const user_data = {
      learning_profile: user.learning_profile || {},
      [`brain_state_${topic}`]: user[`brain_state_${topic}`] || {}
    };

    let pyUrl = process.env.PYTHON_API_URL || 'http://127.0.0.1:5000';
    if (!pyUrl.startsWith('http')) pyUrl = `https://${pyUrl}`;
    if (pyUrl.endsWith('/')) pyUrl = pyUrl.slice(0, -1);

    const pyReq = await fetch(`${pyUrl}/api/submit_answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        user_data, topic, question_id, answer, response_time_seconds, 
        hint_used, attempt_count: user[`attempt_count_current_action_${topic}`] || 1
      })
    });
    
    if (!pyReq.ok) {
      const text = await pyReq.text();
      throw new Error(`Python API error: ${pyReq.status} ${text}`);
    }
    const python_resp = await pyReq.json();
    
    user[`brain_state_${topic}`] = python_resp.brain_state;
    
    // Log activity
    await Activity.create({
      username: sessionUser,
      topic,
      action: 'answer_question',
      details: { question_id, is_correct: python_resp.is_correct }
    });

    let next_action = null;

    if (python_resp.is_correct) {
      if (question_id.includes('_master_')) {
        user[`mastery_streak_${topic}`] = (user[`mastery_streak_${topic}`] || 0) + 1;
      }
      user[`attempt_count_current_action_${topic}`] = 1;
      user[`hint_used_current_action_${topic}`] = false;
      user[`questions_since_last_upload_${topic}`] = (user[`questions_since_last_upload_${topic}`] || 0) + 1;

      if (user[`questions_since_last_upload_${topic}`] >= 5 && document_is_hard_enough(python_resp.mastery)) {
         next_action = { 
           type: 'upload_work', 
           question_text: user[`current_action_${topic}`]?.content || 'Show your work.',
           original_question_id: question_id,
           student_guess: answer,
           options: user[`current_action_${topic}`]?.options
         };
         user[`current_action_${topic}`] = next_action;
      } else {
         const actReq = await fetch(`${pyUrl}/api/get_next_action`, {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ user_data: { learning_profile: user.learning_profile, [`brain_state_${topic}`]: user[`brain_state_${topic}`] }, topic, seen_questions: user[`seen_questions_${topic}`] })
         });
         
         if (!actReq.ok) {
           const text = await actReq.text();
           throw new Error(`Python API error: ${actReq.status} ${text}`);
         }
         const actRes = await actReq.json();
         next_action = actRes.next_action;
         user[`current_action_${topic}`] = next_action;
         if (next_action && next_action.id) user[`seen_questions_${topic}`].push(next_action.id);
      }
    } else {
      user[`mastery_streak_${topic}`] = 0; // reset streak
      user[`attempt_count_current_action_${topic}`] += 1;
    }
    
    let topic_graduated = false;
    if (user[`mastery_streak_${topic}`] >= 3 && user[`master_validations_${topic}`] >= 2 && !user[`topic_graduated_${topic}`]) {
        user[`topic_graduated_${topic}`] = true;
        topic_graduated = true;
        await Activity.create({
          username: sessionUser,
          topic,
          action: 'topic_graduated',
          details: { message: 'Graduation bounds met via submit_answer' }
        });
    }

    await user.save();

    return NextResponse.json({
      is_correct: python_resp.is_correct,
      mastery: Math.round(python_resp.mastery * 100) / 100,
      response_time_seconds,
      next_action,
      topic_graduated
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function document_is_hard_enough(mastery) {
  // simple surrogate function for checking if we should challenge them with an upload
  // Real implementation in python would trigger this based on difficulty bounds.
  return true;
}
