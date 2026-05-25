import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import mongoose from 'mongoose';

export async function GET(req) {
  try {
    await dbConnect();
    const db = mongoose.connection.db;

    // Find all users who have post_assessment.completed = true in the users collection
    const usersCompleted = await db.collection('users').find({
      role: 'student',
      'post_assessment.completed': true
    }).project({ username: 1, 'post_assessment.score': 1 }).toArray();

    // Find all unique usernames in the activities collection who have answered a post-assessment question
    const uniqueUsernamesWithPostActivities = await db.collection('activities').distinct('username', {
      'details.is_assessment': true,
      'details.assessment_type': 'post'
    });

    // Cross-reference: find any user who has post-assessment activities but post_assessment.completed is not true in the users collection
    const discrepantUsers = [];
    for (const username of uniqueUsernamesWithPostActivities) {
      const user = await db.collection('users').findOne({ username });
      if (!user) {
        discrepantUsers.push({ username, reason: 'User record completely missing' });
      } else if (!user.post_assessment || !user.post_assessment.completed) {
        const count = await db.collection('activities').countDocuments({
          username,
          'details.is_assessment': true,
          'details.assessment_type': 'post'
        });
        discrepantUsers.push({
          username,
          reason: 'User record says not completed, but has activities',
          activitiesCount: count,
          userPreCompleted: !!(user.pre_assessment && user.pre_assessment.completed)
        });
      }
    }

    // Find all student users who are active (pre-assessment completed)
    const activeStudents = await db.collection('users').find({
      role: 'student',
      'pre_assessment.completed': true
    }).project({ username: 1, 'post_assessment.completed': 1 }).toArray();

    return NextResponse.json({
      success: true,
      postAssessmentCompletedCount: usersCompleted.length,
      postAssessmentCompletedUsers: usersCompleted.map(u => u.username),
      uniqueUsernamesWithPostActivitiesCount: uniqueUsernamesWithPostActivities.length,
      uniqueUsernamesWithPostActivities,
      discrepancyCount: discrepantUsers.length,
      discrepancies: discrepantUsers,
      totalActiveStudents: activeStudents.length,
      activeStudentsList: activeStudents.map(s => ({
        username: s.username,
        postCompleted: !!(s.post_assessment && s.post_assessment.completed)
      }))
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
