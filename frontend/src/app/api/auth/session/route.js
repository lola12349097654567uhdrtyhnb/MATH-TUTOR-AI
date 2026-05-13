import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const cookieStore = await cookies();
    const sessionUser = req.headers.get('x-user-id') || cookieStore.get('session_user')?.value;
    if (!sessionUser) return NextResponse.json({ role: null, username: null });

    await dbConnect();
    const user = await User.findOne({ username: sessionUser });
    if (!user) return NextResponse.json({ role: null, username: null });

    const topics = ['fractions', 'algebra', 'exponents', 'geometry'];
    const topicStatus = {};
    const topicGraduated = {};
    topics.forEach(t => {
      topicStatus[t] = user[`diagnostic_completed_${t}`] || user[`diagnostic_index_${t}`] > 0;
      topicGraduated[t] = !!user[`topic_graduated_${t}`];
    });

    return NextResponse.json({ 
      role: user.role, 
      username: user.username,
      topic_status: topicStatus,
      topic_graduated: topicGraduated,
      target_topics: user.target_topics || [],
      pre_assessment: user.pre_assessment || { completed: false },
      post_assessment: user.post_assessment || { completed: false }
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
