import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import Activity from '@/lib/models/Activity';
import fs from 'fs';
import path from 'path';

export async function GET(req) {
  try {
    const sessionUser = (await cookies()).get('session_user')?.value;
    if (!sessionUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const inst = await User.findOne({ username: sessionUser });
    if (!inst || inst.role !== 'instructor') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const targetUsername = searchParams.get('student');

    let query = { action: 'upload_work' };
    if (targetUsername) query.username = targetUsername;

    const submissions = await Activity.find(query)
      .sort({ createdAt: -1 })
      .limit(50);

    // Read questions.json to inject missing text for old logs
    let questionsData = {};
    try {
      const qPath = path.join(process.cwd(), '../../questions.json');
      if (fs.existsSync(qPath)) questionsData = JSON.parse(fs.readFileSync(qPath, 'utf8'));
    } catch(e) {}

    const patchedSubmissions = submissions.map(sub => {
      let subObj = sub.toObject();
      if (!subObj.topic && subObj.details?.original_question_id) {
        const qid = subObj.details.original_question_id;
        if (qid.includes('_geo_')) subObj.topic = 'geometry';
        else if (qid.includes('_exp_')) subObj.topic = 'exponents';
        else if (qid.includes('_frac_')) subObj.topic = 'fractions';
        else if (qid.includes('_alg_')) subObj.topic = 'algebra';
      }
      
      if (!subObj.details?.original_question_text && subObj.details?.original_question_id && subObj.topic) {
        const topicQs = questionsData[subObj.topic] || [];
        const match = topicQs.find(q => q.id === subObj.details.original_question_id);
        if (match) subObj.details.original_question_text = match.question;
      }
      return subObj;
    });

    return NextResponse.json({ submissions: patchedSubmissions });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const sessionUser = (await cookies()).get('session_user')?.value;
    if (!sessionUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const inst = await User.findOne({ username: sessionUser });
    if (!inst || inst.role !== 'instructor') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { targetUsername, activityId, action, topic, remarkText } = await req.json();
    const student = await User.findOne({ username: targetUsername });
    const activity = await Activity.findById(activityId);

    if (!student || !activity) return NextResponse.json({ error: 'Student or Activity not found' }, { status: 404 });

    const brainKey = `brain_state_${topic}`;
    if (!student[brainKey]) student[brainKey] = { belief: 0.3 };
    
    if (action === 'grant_mastery') {
      // "Student is Correct"
      if (activity.details?.is_valid_math === false) {
        // OVERRIDE: AI failed them, but instructor says they are correct
        student[brainKey].belief = 0.95; 
      }
      // If AI already said they were correct, we just agree. No change needed to mastery.
      activity.cleared = true;
    } else if (action === 'penalize') {
      // "Student is Incorrect"
      if (activity.details?.is_valid_math === true) {
        // OVERRIDE: AI passed them, but instructor says they are wrong
        student[brainKey].belief = 0.05;
      }
      // If AI already said wrong, we just agree. No change needed to mastery.
      activity.cleared = true;
    } else if (action === 'archive') {
      activity.archived = true;
    } else if (action === 'add_remark') {
      activity.remark = remarkText;
      activity.cleared = true;
      // Send notification to student
      student.notifications.push({
        message: `Instructor ${inst.username} left a remark on your ${topic} work: "${remarkText}"`,
        read: false
      });
    }

    student.markModified(brainKey);
    await student.save();
    await activity.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
