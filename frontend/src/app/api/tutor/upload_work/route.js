import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import Activity from '@/lib/models/Activity';

const VIDEO_MAP = {
  fraction_addition: "/addition_tutor.mp4",
  fraction_subtraction: "/subtraction_tutor.mp4",
  fraction_multiplication: "/multiplication_tutor.mp4",
  fraction_division: "/division_tutor.mp4",
  algebra_transposing: "/fractions.mp4",
  algebra_substitution: "/fractions.mp4",
  exponents_laws: "/sample.mp4",
  exponents_scientific: "/sample.mp4",
  geometry_pythagoras: "/sample.mp4",
  geometry_wrong_formula: null,
  geometry_calculation_error: null,
};

export async function POST(req) {
  try {
    const formData = await req.formData();
    const topic = formData.get('topic');
    const question_text = formData.get('question_text');
    const file = formData.get('file');

    const cookieStore = await cookies();
    const sessionUser = req.headers.get('x-user-id') || cookieStore.get('session_user')?.value;
    
    await dbConnect();
    const user = await User.findOne({ username: sessionUser });

    const user_data = {
      learning_profile: user.learning_profile || {},
      [`brain_state_${topic}`]: user[`brain_state_${topic}`] || {}
    };

    // Convert File to Base64
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64_image = buffer.toString('base64');

    const pyReq = await fetch(`${process.env.PYTHON_API_URL}/api/upload_work`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ base64_image, question_text, topic, user_data })
    });
    const python_resp = await pyReq.json();
    
    user[`brain_state_${topic}`] = python_resp.brain_state;
    user[`questions_since_last_upload_${topic}`] = 0; // reset
    
    if (python_resp.is_valid_math) {
      const orig = user[`current_action_${topic}`]?.original_question_id || '';
      if (orig.includes('_master_')) {
          user[`master_validations_${topic}`] = (user[`master_validations_${topic}`] || 0) + 1;
      }
    } else {
      user[`mastery_streak_${topic}`] = 0; // reset MCQ streak on failed upload
    }
    
    // Log activity with image trace strictly requested by user
    await Activity.create({
      username: sessionUser,
      topic,
      action: 'upload_work',
      details: {
        is_valid_math: python_resp.is_valid_math,
        image_trace: `data:${file.type};base64,${base64_image}`,
        original_question_id: user[`current_action_${topic}`]?.original_question_id,
        original_question_text: user[`current_action_${topic}`]?.question_text,
        student_guess: user[`current_action_${topic}`]?.student_guess,
        options: user[`current_action_${topic}`]?.options
      }
    });

    // Always fetch next action so the user can continue even if they failed
    const actReq = await fetch(`${process.env.PYTHON_API_URL}/api/get_next_action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_data: { learning_profile: user.learning_profile, [`brain_state_${topic}`]: user[`brain_state_${topic}`] }, topic, seen_questions: user[`seen_questions_${topic}`] || [] })
    });
    const actRes = await actReq.json();
    const next_action = actRes.next_action;
    user[`current_action_${topic}`] = next_action;
    if (next_action) user[`seen_questions_${topic}`].push(next_action.id);

    let topic_graduated = false;
    if (user[`mastery_streak_${topic}`] >= 3 && user[`master_validations_${topic}`] >= 2 && !user[`topic_graduated_${topic}`]) {
        user[`topic_graduated_${topic}`] = true;
        topic_graduated = true;
        await Activity.create({
          username: sessionUser,
          topic,
          action: 'topic_graduated',
          details: { message: 'Graduation bounds met via upload_work' }
        });
    }

    await user.save();

    let final_video_url = '/fractions.mp4';
    let python_sub_topic = python_resp.sub_topic || "default";
    if (python_sub_topic in VIDEO_MAP) {
      final_video_url = VIDEO_MAP[python_sub_topic];
    }

    return NextResponse.json({
      is_valid_math: python_resp.is_valid_math,
      message: python_resp.is_valid_math ? "Excellent work! Math checks out." : python_resp.feedback || "Your scratchpad math didn't properly compute! Please review the topic video below before continuing.",
      mastery: Math.round(python_resp.brain_state.belief * 100) / 100,
      video_url: final_video_url,
      next_action,
      topic_graduated
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
