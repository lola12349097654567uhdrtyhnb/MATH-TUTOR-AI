import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';

export async function GET() {
  try {
    const sessionUser = (await cookies()).get('session_user')?.value;
    if (!sessionUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const instructor = await User.findOne({ username: sessionUser });
    if (!instructor || instructor.role !== 'instructor') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const students = await User.find({ $or: [{role: 'student'}, {role: { $exists: false }}] });

    const calculateTotal = (scoreObj) => {
      if (!scoreObj) return { correct: 0, total: 0 };
      let correct = 0;
      let total = 0;
      Object.values(scoreObj).forEach(t => {
        correct += t.correct || 0;
        total += t.total || 0;
      });
      return { correct, total };
    };

    const results = students.map(stu => {
      const pre = calculateTotal(stu.pre_assessment?.score);
      const post = calculateTotal(stu.post_assessment?.score);
      
      const prePct = pre.total > 0 ? Math.round((pre.correct / pre.total) * 100) : null;
      const postPct = post.total > 0 ? Math.round((post.correct / post.total) * 100) : null;
      const delta = (prePct !== null && postPct !== null) ? (postPct - prePct) : null;

      return {
        username: stu.username,
        pre_completed: !!stu.pre_assessment?.completed,
        post_completed: !!stu.post_assessment?.completed,
        pre_score: prePct,
        post_score: postPct,
        delta: delta
      };
    });

    return NextResponse.json({ results });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
