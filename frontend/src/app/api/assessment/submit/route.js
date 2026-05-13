import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';

export async function POST(req) {
  try {
    const cookieStore = await cookies();
    const sessionUser = req.headers.get('x-user-id') || cookieStore.get('session_user')?.value;
    if (!sessionUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { type, score_by_topic, questions_seen } = await req.json();

    if (!type || !score_by_topic) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await dbConnect();
    const user = await User.findOne({ username: sessionUser });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    if (type === 'pre') {
      user.pre_assessment = {
        completed: true,
        score: score_by_topic,
        questions_seen: questions_seen || []
      };
    } else if (type === 'post') {
      user.post_assessment = {
        completed: true,
        score: score_by_topic
      };
    }

    await user.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
