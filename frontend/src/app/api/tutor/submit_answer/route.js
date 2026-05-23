import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import Activity from '@/lib/models/Activity';

export async function POST(req) {
  try {
    const { topic, question_id, answer, response_time_seconds, hint_used, question_text, correct_answer, question_difficulty, options } = await req.json();
    const cookieStore = await cookies();
    const sessionUser = req.headers.get('x-user-id') || cookieStore.get('session_user')?.value;
    
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
    const attemptNumber = user[`attempt_count_current_action_${topic}`] || 1;
    
    // --- RICH ACTIVITY LOG ---
    await Activity.create({
      username: sessionUser,
      topic,
      action: 'answer_question',
      details: { 
        question_id, 
        question_text: question_text || user[`current_action_${topic}`]?.content || '',
        student_answer: answer,
        correct_answer: correct_answer || user[`current_action_${topic}`]?.correct_answer || '',
        is_correct: python_resp.is_correct,
        difficulty: question_difficulty || user[`current_action_${topic}`]?.difficulty || 'medium',
        attempt_number: attemptNumber,
        options: options || user[`current_action_${topic}`]?.options || []
      }
    });

    // --- STUCK DETECTION TRACKING ---
    const lastDiff = user[`last_difficulty_${topic}`];
    const currentDiff = question_difficulty || user[`current_action_${topic}`]?.difficulty || 'medium';

    if (lastDiff !== currentDiff) {
      // Difficulty changed — reset counters
      user[`consecutive_wrong_at_diff_${topic}`] = 0;
      user[`total_at_current_diff_${topic}`] = 0;
      user[`wrong_at_current_diff_${topic}`] = 0;
      user[`last_difficulty_${topic}`] = currentDiff;
    }

    user[`total_at_current_diff_${topic}`] = (user[`total_at_current_diff_${topic}`] || 0) + 1;

    if (!python_resp.is_correct) {
      // Increment consecutive wrong on any incorrect submission
      user[`consecutive_wrong_at_diff_${topic}`] = (user[`consecutive_wrong_at_diff_${topic}`] || 0) + 1;
      user[`wrong_at_current_diff_${topic}`] = (user[`wrong_at_current_diff_${topic}`] || 0) + 1;
    }

    const totalAtDiff = user[`total_at_current_diff_${topic}`] || 1;
    const wrongAtDiff = user[`wrong_at_current_diff_${topic}`] || 0;
    const consecutiveWrong = user[`consecutive_wrong_at_diff_${topic}`] || 0;
    const wrongRatio = wrongAtDiff / totalAtDiff;

    let next_action = null;

    if (python_resp.is_correct) {
      if (question_id.includes('_master_')) {
        user[`mastery_streak_${topic}`] = (user[`mastery_streak_${topic}`] || 0) + 1;
      }

      // --- NEW DETAILED PEDAGOGICAL INTERVENTION FLOW ---
      // Condition A: Got this exact question wrong 2 or more times before getting it correct (attemptNumber >= 3)
      const struggledOnThisQuestion = attemptNumber >= 3;

      // Condition B: Stayed at same level for 8+ questions and got >= 50% of them wrong
      const persistentDifficulty = (totalAtDiff >= 8 && wrongRatio >= 0.5);

      const shouldIntervene = struggledOnThisQuestion || persistentDifficulty;

      // Reset attempt and consecutive counters for next action
      user[`attempt_count_current_action_${topic}`] = 1;
      user[`hint_used_current_action_${topic}`] = false;
      user[`questions_since_last_upload_${topic}`] = (user[`questions_since_last_upload_${topic}`] || 0) + 1;
      user[`consecutive_wrong_at_diff_${topic}`] = 0; // reset consecutive wrong on correct answer

      if (shouldIntervene) {
        // Trigger intervention AFTER they finally answer correctly!
        next_action = buildInterventionAction(user, topic, currentDiff, question_id, correct_answer || answer);
        user[`current_action_${topic}`] = next_action;

        // Log the intervention activity for instructor dashboard
        await Activity.create({
          username: sessionUser,
          topic,
          action: 'ai_intervention',
          details: {
            message: `AI Intervention triggered for ${topic} at ${currentDiff} difficulty.`,
            difficulty: currentDiff,
            question_id
          }
        });

        // Reset tracking counters for the difficulty level
        user[`total_at_current_diff_${topic}`] = 0;
        user[`wrong_at_current_diff_${topic}`] = 0;
      } else if (user[`questions_since_last_upload_${topic}`] >= 2 && document_is_hard_enough(python_resp.mastery)) {
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
      user[`mastery_streak_${topic}`] = 0;
      user[`attempt_count_current_action_${topic}`] += 1;
      // Do NOT set next_action, they stay on the current question to try again!
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

function buildInterventionAction(user, topic, difficulty, question_id, correct_ans) {
  const currentQ = user[`current_action_${topic}`];
  return {
    type: 'ai_intervention',
    difficulty,
    topic,
    question_id,
    question_text: currentQ?.question_text || currentQ?.content || '',
    correct_answer: correct_ans || currentQ?.correct_answer || '',
    options: currentQ?.options || []
  };
}

function document_is_hard_enough(mastery) {
  return true;
}
