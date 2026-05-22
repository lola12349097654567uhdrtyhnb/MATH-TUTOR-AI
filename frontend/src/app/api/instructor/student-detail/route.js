import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import Activity from '@/lib/models/Activity';

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

    const { searchParams } = new URL(req.url);
    const targetStudent = searchParams.get('student');
    if (!targetStudent) {
      return NextResponse.json({ error: 'Missing student query param' }, { status: 400 });
    }

    const studentObj = await User.findOne({ username: targetStudent });
    if (!studentObj) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Get all activities for this student
    const activities = await Activity.find({ username: targetStudent }).sort({ createdAt: -1 });

    const topics = ['fractions', 'algebra', 'exponents', 'geometry'];
    const topicStats = {};

    topics.forEach(topic => {
      const topicActs = activities.filter(act => act.topic === topic);
      
      // Filter practice questions (excluding diagnostics & uploads)
      const answers = topicActs.filter(act => act.action === 'answer_question');
      
      const totalAnswers = answers.length;
      const correctAnswers = answers.filter(act => act.details?.is_correct === true).length;
      
      const difficultyBreakdown = {
        easy: { served: 0, correct: 0 },
        medium: { served: 0, correct: 0 },
        hard: { served: 0, correct: 0 }
      };

      const struggles = [];
      let totalResponseTime = 0;
      let responseTimeCount = 0;

      answers.forEach(act => {
        const diff = (act.details?.difficulty || 'medium').toLowerCase();
        const isCorrect = act.details?.is_correct || false;

        if (difficultyBreakdown[diff]) {
          difficultyBreakdown[diff].served += 1;
          if (isCorrect) difficultyBreakdown[diff].correct += 1;
        }

        if (!isCorrect) {
          struggles.push({
            question_id: act.details?.question_id || 'N/A',
            question_text: act.details?.question_text || 'Standard practice question.',
            student_answer: act.details?.student_answer || 'N/A',
            correct_answer: act.details?.correct_answer || 'N/A',
            difficulty: diff,
            timestamp: act.createdAt
          });
        }

        if (act.details?.response_time_seconds) {
          totalResponseTime += act.details.response_time_seconds;
          responseTimeCount += 1;
        }
      });

      // Count times triggered AI Intervention
      const interventions = topicActs.filter(act => act.action === 'ai_intervention' || act.details?.action === 'ai_intervention').length;

      topicStats[topic] = {
        total_questions: totalAnswers,
        correct_questions: correctAnswers,
        accuracy: totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0,
        average_response_time: responseTimeCount > 0 ? Math.round(totalResponseTime / responseTimeCount) : 0,
        difficulty: difficultyBreakdown,
        struggles: struggles.slice(0, 10), // Return up to 10 struggles
        interventions_count: interventions,
        mastery: Math.round((studentObj[`brain_state_${topic}`]?.belief || 0) * 100) / 100,
        graduated: !!studentObj[`topic_graduated_${topic}`]
      };
    });

    return NextResponse.json({
      username: targetStudent,
      profile: studentObj.learning_profile || {},
      target_topics: studentObj.target_topics || [],
      topic_stats: topicStats
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
