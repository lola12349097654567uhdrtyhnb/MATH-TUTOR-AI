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
    
    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const user = await User.findOne({ username: sessionUser });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 1. Log Activity (no mastery penalty for assessment review!)
    await Activity.create({
      username: sessionUser,
      topic,
      action: 'requested_assessment_help',
      details: {
        message: `Student requested AI Help on assessment question ${question_id} to review their mistake.`,
        question_id
      }
    });

    await user.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
