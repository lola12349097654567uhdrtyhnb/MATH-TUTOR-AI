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

    // Fetch all students and activities
    const allStudents = await User.find({ $or: [{role: 'student'}, {role: { $exists: false }}] }).lean();
    const allActivities = await Activity.find({}).lean();

    // Helper: Compute Overall Assessment Score
    const getOverallScore = (assessmentObj) => {
      if (!assessmentObj || !assessmentObj.completed || !assessmentObj.score) return null;
      let totalCorrect = 0;
      let totalQuestions = 0;
      for (const topic in assessmentObj.score) {
        const item = assessmentObj.score[topic];
        if (item && typeof item === 'object') {
          totalCorrect += item.correct || 0;
          totalQuestions += item.total || 0;
        }
      }
      return totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : null;
    };

    const dataset = allStudents.map(student => {
      const studentActs = allActivities.filter(act => act.username === student.username);
      const answerActs = studentActs.filter(act => act.action === 'answer_question');

      // 1. Conceptual Learning Gain Metrics
      const preScore = getOverallScore(student.pre_assessment);
      const postScore = getOverallScore(student.post_assessment);
      const learningGain = (preScore !== null && postScore !== null) ? (postScore - preScore) : null;

      // 2. Cognitive & Behavioral Telemetry
      // Response Latency (average across answer_questions with time logged)
      const latencyActs = answerActs.filter(act => act.details?.response_time_seconds !== undefined);
      const avgLatency = latencyActs.length > 0
        ? Math.round((latencyActs.reduce((acc, act) => acc + act.details.response_time_seconds, 0) / latencyActs.length) * 10) / 10
        : null;

      // Local Struggle Frequency (attempts >= 3 on unique question IDs)
      const struggledQuestions = new Set();
      answerActs.forEach(act => {
        if (act.details?.attempt_number >= 3 && act.details?.question_id) {
          struggledQuestions.add(act.details.question_id);
        }
      });
      const struggleFrequency = struggledQuestions.size;

      // POMDP Difficulty Trajectory (served volume per tier)
      const difficultyCounts = { easy: 0, medium: 0, hard: 0, master: 0 };
      answerActs.forEach(act => {
        const diff = (act.details?.difficulty || 'medium').toLowerCase();
        if (difficultyCounts[diff] !== undefined) {
          difficultyCounts[diff]++;
        }
      });

      // 3. Generative AI Impact ("Two-Wrong" Walkthrough Rule)
      const aiInterventions = studentActs.filter(act => act.action === 'ai_intervention');
      const scaffoldCount = aiInterventions.length;

      // Post-Intervention Success Rate
      let successfulInterventions = 0;
      aiInterventions.forEach(intervention => {
        const triggerTime = new Date(intervention.createdAt).getTime();
        const topic = intervention.topic;
        
        // Find the absolute first answer_question activity after this AI scaffolding trigger in the same topic
        const postActs = answerActs
          .filter(act => act.topic === topic && new Date(act.createdAt).getTime() > triggerTime)
          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        
        if (postActs.length > 0 && postActs[0].details?.is_correct) {
          successfulInterventions++;
        }
      });

      const interventionSuccessRate = scaffoldCount > 0
        ? Math.round((successfulInterventions / scaffoldCount) * 100)
        : null;

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

      const questionsAnswered = studentActs.filter(a => a.action === 'answer_question' || a.action === 'upload_work').length;

      return {
        username: student.username,
        grade: student.grade || 'N/A',
        cohort: student.cohort || '',
        pre_score: preScore,
        post_score: postScore,
        learning_gain: learningGain,
        avg_latency_sec: avgLatency,
        struggle_frequency: struggleFrequency,
        difficulty_trajectory: difficultyCounts,
        scaffold_count: scaffoldCount,
        post_intervention_success_rate: interventionSuccessRate,
        active_hours: activeHours,
        questions_answered: questionsAnswered,
        last_active: student.updatedAt
      };
    });

    // Calculate Cohort Cohort Summary Statistics
    const computeCohortStats = (cohortName) => {
      // Exclude students who are inactive (answered 0 questions OR active for less than 0.3 hours)
      const activeDataset = dataset.filter(s => s.questions_answered > 0 && s.active_hours >= 0.3);
      const cohortCohort = activeDataset.filter(s => s.cohort === cohortName);
      const validGains = cohortCohort.filter(s => s.learning_gain !== null);
      
      const avgGain = validGains.length > 0
        ? Math.round((validGains.reduce((acc, s) => acc + s.learning_gain, 0) / validGains.length) * 10) / 10
        : 0;

      const preScores = cohortCohort.filter(s => s.pre_score !== null);
      const avgPre = preScores.length > 0
        ? Math.round(preScores.reduce((acc, s) => acc + s.pre_score, 0) / preScores.length)
        : 0;

      const postScores = cohortCohort.filter(s => s.post_score !== null);
      const avgPost = postScores.length > 0
        ? Math.round(postScores.reduce((acc, s) => acc + s.post_score, 0) / postScores.length)
        : 0;

      const totalScaffolds = cohortCohort.reduce((acc, s) => acc + s.scaffold_count, 0);

      const validSuccessRates = cohortCohort.filter(s => s.post_intervention_success_rate !== null);
      const avgSuccessRate = validSuccessRates.length > 0
        ? Math.round(validSuccessRates.reduce((acc, s) => acc + s.post_intervention_success_rate, 0) / validSuccessRates.length)
        : 0;

      return {
        name: cohortName === 'A' ? 'Cohort A (Supervised/In-Class)' : (cohortName === 'B' ? 'Cohort B (Remote)' : 'Unassigned'),
        size: cohortCohort.length,
        avg_pre: avgPre,
        avg_post: avgPost,
        avg_gain: avgGain,
        total_ai_scaffolds: totalScaffolds,
        avg_ai_success_rate: avgSuccessRate
      };
    };

    const cohortSummary = {
      A: computeCohortStats('A'),
      B: computeCohortStats('B'),
      unassigned: computeCohortStats('')
    };

    return NextResponse.json({
      students: dataset,
      cohort_summary: cohortSummary
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const cookieStore = await cookies();
    const sessionUser = req.headers.get('x-user-id') || cookieStore.get('session_user')?.value;
    if (!sessionUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const instructor = await User.findOne({ username: sessionUser });
    if (!instructor || instructor.role !== 'instructor') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { username, cohort } = await req.json();
    if (!username) return NextResponse.json({ error: 'Missing username' }, { status: 400 });

    const student = await User.findOne({ username });
    if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 });

    // Enforce cohort values to A, B, or empty string
    if (cohort !== 'A' && cohort !== 'B' && cohort !== '') {
      return NextResponse.json({ error: 'Invalid cohort. Allowed values: A, B, or empty' }, { status: 400 });
    }

    student.cohort = cohort;
    await student.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
