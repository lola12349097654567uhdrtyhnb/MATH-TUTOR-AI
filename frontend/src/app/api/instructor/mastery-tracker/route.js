import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import Activity from '@/lib/models/Activity';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const cookieStore = await cookies();
    const sessionUser = req.headers.get('x-user-id') || cookieStore.get('session_user')?.value;
    if (!sessionUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const instructor = await User.findOne({ username: sessionUser });
    if (!instructor || instructor.role !== 'instructor') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch all students
    const allStudents = await User.find({ $or: [{role: 'student'}, {role: { $exists: false }}] }).lean();
    
    // Fetch all activities
    const allActivities = await Activity.find({}).lean();

    const data = allStudents.map(student => {
      const studentActs = allActivities.filter(act => act.username === student.username);
      
      // Extract active days (registration date + all activity log dates)
      const regDate = new Date(student.createdAt || Date.now()).toISOString().split('T')[0];
      const activeDates = Array.from(new Set([
        regDate,
        ...studentActs.map(act => new Date(act.createdAt).toISOString().split('T')[0])
      ]));
      
      const lastActiveDate = studentActs.length > 0
        ? new Date(Math.max(...studentActs.map(a => new Date(a.createdAt).getTime()))).toISOString().split('T')[0]
        : regDate;

      // Calculate active hours using sessionization (15 mins threshold)
      let activeHours = 0;
      if (studentActs.length > 0) {
        const sorted = studentActs
          .map(a => new Date(a.createdAt).getTime())
          .sort((a, b) => a - b);
        
        let totalTimeMs = 0;
        let currentSessionStart = sorted[0];
        let currentSessionLast = sorted[0];
        const SESSION_THRESHOLD_MS = 15 * 60 * 1000;
        
        for (let i = 1; i < sorted.length; i++) {
          if (sorted[i] - currentSessionLast < SESSION_THRESHOLD_MS) {
            currentSessionLast = sorted[i];
          } else {
            totalTimeMs += Math.max(currentSessionLast - currentSessionStart, 60 * 1000);
            currentSessionStart = sorted[i];
            currentSessionLast = sorted[i];
          }
        }
        totalTimeMs += Math.max(currentSessionLast - currentSessionStart, 60 * 1000);
        activeHours = Math.round((totalTimeMs / (1000 * 60 * 60)) * 100) / 100;
      }

      // Gather mastery scores
      const topics = ['fractions', 'algebra', 'exponents', 'geometry'];
      const masteryScores = {};
      let totalMasterySum = 0;
      let graduatedCount = 0;

      topics.forEach(t => {
        const belief = student[`brain_state_${t}`]?.belief || 0;
        masteryScores[t] = belief;
        totalMasterySum += belief;
        if (student[`topic_graduated_${t}`]) {
          graduatedCount++;
        }
      });

      const avgMastery = Math.round((totalMasterySum / topics.length) * 100);
      
      // Rate of learning = topics mastered / active hour (prevent divide by 0)
      const rateOfLearning = activeHours > 0 
        ? Math.round((graduatedCount / activeHours) * 100) / 100 
        : 0;

      return {
        username: student.username,
        active_hours: activeHours,
        average_mastery: avgMastery,
        mastery_scores: masteryScores,
        topics_graduated: graduatedCount,
        rate_of_learning: rateOfLearning,
        questions_answered: studentActs.filter(a => a.action === 'answer_question' || a.action === 'upload_work').length,
        pre_assessment_completed: !!student.pre_assessment?.completed,
        post_assessment_completed: !!student.post_assessment?.completed,
        survey_completed: !!student.evaluation_questionnaire,
        active_dates: activeDates,
        last_active_date: lastActiveDate,
        grade: student.grade || ""
      };
    });

    return NextResponse.json({ students: data });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
