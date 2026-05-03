import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const topic = searchParams.get('topic') || 'fractions';

    const cookieStore = await cookies();
    const sessionUser = cookieStore.get('session_user')?.value;

    if (!sessionUser) {
      return NextResponse.json({ logged_in: false });
    }

    await dbConnect();
    const user = await User.findOne({ username: sessionUser });

    if (!user) {
      return NextResponse.json({ logged_in: false });
    }

    if (!user.profile_configured) {
      return NextResponse.json({ logged_in: true, profile_configured: false, username: sessionUser });
    }

    const isDiagnosticCompleted = user[`diagnostic_completed_${topic}`];
    
    // Construct user_data dict expected by Python microservice
    const user_data = {
      learning_profile: user.learning_profile || {},
      [`brain_state_${topic}`]: user[`brain_state_${topic}`] || {}
    };

    if (!isDiagnosticCompleted) {
      // It implies we need a diagnostic question. Python hasn't returned it yet?
      // Wait, let's ask python to configure_student to get the diagnostic questions.
      const diagReq = await fetch(`${process.env.PYTHON_API_URL}/api/configure_student`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_data, profile_data: user.learning_profile, topic })
      });
      const diagRes = await diagReq.json();

      const diagIndex = user[`diagnostic_index_${topic}`] || 0;
      const diagQuestions = diagRes.diagnostic_questions || [];
      const safeIndex = Math.min(diagIndex, Math.max(0, diagQuestions.length - 1));

      return NextResponse.json({
        logged_in: true,
        profile_configured: true,
        diagnostic_completed: false,
        diagnostic_question: diagQuestions[safeIndex],
        progress: { current: safeIndex + 1, total: diagQuestions.length },
        mastery: Math.round((diagRes.brain_state?.belief || 0) * 100) / 100,
        username: sessionUser
      });
    }

    // Intro check
    if (!user[`topic_intro_seen_${topic}`] && topic !== 'fractions') {
      return NextResponse.json({
        logged_in: true,
        profile_configured: true,
        diagnostic_completed: true,
        topic_intro_required: true,
        topic,
        video_url: topic === 'fractions' ? '/fractions.mp4' : '/algebra_intro.mp4',
        mastery: Math.round((user[`brain_state_${topic}`]?.belief || 0) * 100) / 100,
        username: sessionUser
      });
    }

    // Normal practice
    let current_action = user[`current_action_${topic}`];
    if (!current_action) {
      // Call python to get next action
      const actReq = await fetch(`${process.env.PYTHON_API_URL}/api/get_next_action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_data, topic, seen_questions: user[`seen_questions_${topic}`] || [] })
      });
      const actRes = await actReq.json();
      current_action = actRes.next_action;
      
      user[`current_action_${topic}`] = current_action;
      if (current_action && current_action.id && !user[`seen_questions_${topic}`].includes(current_action.id)) {
        user[`seen_questions_${topic}`].push(current_action.id);
      }
      await user.save();
    }

    return NextResponse.json({
      logged_in: true,
      profile_configured: true,
      diagnostic_completed: true,
      next_action: current_action,
      mastery: Math.round((user[`brain_state_${topic}`]?.belief || 0) * 100) / 100,
      username: sessionUser
    });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
