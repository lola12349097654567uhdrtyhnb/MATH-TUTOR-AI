import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import mongoose from 'mongoose';

export async function GET(req) {
  try {
    await dbConnect();
    const db = mongoose.connection.db;
    
    // Get all collection names
    const collections = await db.listCollections().toArray();
    const colNames = collections.map(c => c.name);

    // Get count of users
    const usersCount = await db.collection('users').countDocuments();
    const activitiesCount = await db.collection('activities').countDocuments();

    // Find saja.sawy in the raw collection
    const saja = await db.collection('users').findOne({ username: 'saja.sawy' });

    // Get all activities for saja.sawy
    const sajaActivities = await db.collection('activities').find({ username: 'saja.sawy' }).toArray();

    // Find a few other students to see
    const otherStudents = await db.collection('users').find({ role: 'student' }).limit(5).toArray();

    return NextResponse.json({
      success: true,
      collections: colNames,
      usersCount,
      activitiesCount,
      sajaActivitiesCount: sajaActivities.length,
      sajaActivities,
      saja: saja || null,
      otherStudents: otherStudents.map(s => ({ username: s.username, role: s.role }))
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
