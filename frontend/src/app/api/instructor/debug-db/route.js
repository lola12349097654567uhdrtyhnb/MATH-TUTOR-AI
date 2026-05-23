import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import mongoose from 'mongoose';

export async function GET(req) {
  try {
    await dbConnect();
    const db = mongoose.connection.db;
    
    // Find all users who have submitted the evaluation questionnaire
    const surveySubmissions = await db.collection('users').find({
      evaluation_questionnaire: { $exists: true, $ne: null }
    }).project({ username: 1, role: 1, evaluation_questionnaire: 1 }).toArray();

    // Find all student users who completed the post-assessment
    const postAssessmentCompleters = await db.collection('users').find({
      role: 'student',
      'post_assessment.completed': true
    }).project({ username: 1, email: 1, evaluation_questionnaire: 1 }).toArray();

    // Filter those who did the post-test but forgot the survey
    const forgotSurvey = postAssessmentCompleters.filter(s => !s.evaluation_questionnaire);

    return NextResponse.json({
      success: true,
      surveySubmissionsCount: surveySubmissions.length,
      surveySubmissions: surveySubmissions.map(s => ({
        username: s.username,
        role: s.role,
        submitted_at: s.evaluation_questionnaire.submitted_at || null,
        satisfaction: s.evaluation_questionnaire.satisfaction
      })),
      postAssessmentCompletersCount: postAssessmentCompleters.length,
      forgotSurveyCount: forgotSurvey.length,
      forgotSurvey: forgotSurvey.map(s => ({
        username: s.username,
        email: s.email || 'No email'
      }))
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
