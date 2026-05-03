import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import Question from '@/lib/models/Question';

export async function POST(req) {
  try {
    const sessionUser = (await cookies()).get('session_user')?.value;
    if (!sessionUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const inst = await User.findOne({ username: sessionUser });
    if (!inst || inst.role !== 'instructor') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const newQuestion = await req.json();
    
    // Auto increment Question ID so the Python side can accept it easily
    const count = await Question.countDocuments({ subject: newQuestion.subject }) + 100;
    const qid = `q_${newQuestion.subject}_custom_${count}`;
    
    newQuestion.id = qid;
    
    if (newQuestion.type === 'mcq') {
       newQuestion.options = newQuestion.answers; // Setup structure expected by POMDP
    }

    const doc = new Question(newQuestion);
    await doc.save();

    return NextResponse.json({ success: true, qid });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    await dbConnect();
    // Return the latest questions to verify they were added
    const questions = await Question.find().sort({ createdAt: -1 }).limit(10);
    return NextResponse.json({ questions });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
