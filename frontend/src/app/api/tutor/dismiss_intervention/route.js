import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';

export async function POST(req) {
  try {
    const { topic } = await req.json();
    const cookieStore = await cookies();
    const sessionUser = req.headers.get('x-user-id') || cookieStore.get('session_user')?.value;
    
    await dbConnect();
    const user = await User.findOne({ username: sessionUser });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Clear stuck counters and reset current_action to force fresh generation
    user[`current_action_${topic}`] = null;
    user[`consecutive_wrong_at_diff_${topic}`] = 0;
    user[`total_at_current_diff_${topic}`] = 0;
    user[`wrong_at_current_diff_${topic}`] = 0;
    
    await user.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
