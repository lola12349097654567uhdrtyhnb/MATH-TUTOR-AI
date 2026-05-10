import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import Activity from '@/lib/models/Activity';

export async function POST(req) {
  try {
    const { topic, question_id } = await req.json();
    const cookieStore = await cookies();
    const sessionUser = req.headers.get('x-user-id') || cookieStore.get('session_user')?.value;
    
    await dbConnect();
    const user = await User.findOne({ username: sessionUser });

    const user_data = {
      learning_profile: user.learning_profile || {},
      [`brain_state_${topic}`]: user[`brain_state_${topic}`] || {}
    };

    const pyReq = await fetch(`${process.env.PYTHON_API_URL}/api/get_hint`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_data, topic, question_id })
    });
    const python_resp = await pyReq.json();
    
    user[`hint_used_current_action_${topic}`] = true;
    
    await Activity.create({
      username: sessionUser,
      topic,
      action: 'request_hint',
      details: { question_id }
    });

    await user.save();

    return NextResponse.json({ hint: python_resp.hint });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
