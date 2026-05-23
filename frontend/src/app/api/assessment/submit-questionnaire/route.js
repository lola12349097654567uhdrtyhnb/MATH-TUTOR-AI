import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';

export async function POST(req) {
  try {
    const cookieStore = await cookies();
    const sessionUser = req.headers.get('x-user-id') || cookieStore.get('session_user')?.value;
    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { satisfaction, q1_ai_helpful, q2_difficulty_appropriate, q3_recommend, feedback_text } = await req.json();

    if (satisfaction === undefined) {
      return NextResponse.json({ error: 'Satisfaction rating is required' }, { status: 400 });
    }

    await dbConnect();
    const user = await User.findOne({ username: sessionUser });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await User.updateOne(
      { username: sessionUser },
      {
        $set: {
          evaluation_questionnaire: {
            submitted_at: new Date(),
            satisfaction: Number(satisfaction),
            q1_ai_helpful: String(q1_ai_helpful),
            q2_difficulty_appropriate: String(q2_difficulty_appropriate),
            q3_recommend: String(q3_recommend),
            feedback_text: String(feedback_text || '')
          }
        }
      }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
