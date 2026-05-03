import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';

export async function POST(req) {
  try {
    const { topic } = await req.json();
    const sessionUser = (await cookies()).get('session_user')?.value;
    
    await dbConnect();
    const user = await User.findOne({ username: sessionUser });

    user[`topic_intro_seen_${topic}`] = true;

    // Get normal action since intro is over
    const actReq = await fetch(`${process.env.PYTHON_API_URL}/api/get_next_action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_data: { learning_profile: user.learning_profile, [`brain_state_${topic}`]: user[`brain_state_${topic}`] }, topic, seen_questions: user[`seen_questions_${topic}`] || [] })
    });
    const actRes = await actReq.json();
    const next_action = actRes.next_action;
    
    user[`current_action_${topic}`] = next_action;
    if (next_action) user[`seen_questions_${topic}`].push(next_action.id);

    await user.save();

    return NextResponse.json({ next_action });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
