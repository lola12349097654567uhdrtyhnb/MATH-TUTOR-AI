import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'pre';
    
    const cookieStore = await cookies();
    const sessionUser = req.headers.get('x-user-id') || cookieStore.get('session_user')?.value;
    if (!sessionUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const user = await User.findOne({ username: sessionUser });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const topics = user.target_topics;
    if (!topics || topics.length !== 2) {
      return NextResponse.json({ error: 'Target topics not set' }, { status: 400 });
    }

    let exclude_ids = [];
    if (type === 'post') {
      exclude_ids = user.pre_assessment?.questions_seen || [];
    }

    const pyReq = await fetch(`${process.env.PYTHON_API_URL}/api/get_assessment_questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topics, count_per_topic: 5, exclude_ids })
    });
    
    if (!pyReq.ok) {
      throw new Error('Failed to fetch from python backend');
    }
    
    const data = await pyReq.json();
    return NextResponse.json({ questions: data.questions, target_topics: topics });
    
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
