import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';

export async function POST(req) {
  try {
    const profile_data = await req.json();
    const cookieStore = await cookies();
    const sessionUser = cookieStore.get('session_user')?.value;
    
    if (!sessionUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const user = await User.findOne({ username: sessionUser });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    user.learning_profile = profile_data;
    user.profile_configured = true;

    // Both topics get reset diagnostics effectively since it's a new profile
    const topics = ['fractions', 'algebra', 'exponents', 'geometry'];
    for (const topic of topics) {
      const user_data_for_python = { learning_profile: profile_data, [`brain_state_${topic}`]: user[`brain_state_${topic}`] || {} };
      
      const res = await fetch(`${process.env.PYTHON_API_URL}/api/configure_student`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_data: user_data_for_python, profile_data, topic })
      });
      const data = await res.json();
      
      user[`brain_state_${topic}`] = data.brain_state;
    }

    await user.save();
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
