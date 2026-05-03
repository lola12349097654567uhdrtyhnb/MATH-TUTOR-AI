import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';

export async function GET() {
  try {
    const sessionUser = (await cookies()).get('session_user')?.value;
    if (!sessionUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const user = await User.findOne({ username: sessionUser });
    if (!user || user.role !== 'instructor') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const allStudents = await User.find({ $or: [{role: 'student'}, {role: { $exists: false }}] });
    
    let fractionsCount = 0;
    let algebraCount = 0;
    let exponentsCount = 0;
    let geometryCount = 0;
    let atRisk = [];

    allStudents.forEach(stu => {
      // Very loose check to see if they've stepped into the topic
      if (stu.seen_questions_fractions?.length > 0) fractionsCount++;
      if (stu.seen_questions_algebra?.length > 0) algebraCount++;
      if (stu.seen_questions_exponents?.length > 0) exponentsCount++;
      if (stu.seen_questions_geometry?.length > 0) geometryCount++;

      const fracBelief = stu.brain_state_fractions?.belief || 0;
      const algBelief = stu.brain_state_algebra?.belief || 0;
      const expBelief = stu.brain_state_exponents?.belief || 0;
      const geoBelief = stu.brain_state_geometry?.belief || 0;

      if (stu.seen_questions_fractions?.length > 2 && fracBelief < 0.4) {
        atRisk.push({ username: stu.username, topic: 'Fractions', belief: fracBelief.toFixed(2) });
      }
      if (stu.seen_questions_algebra?.length > 2 && algBelief < 0.4) {
        atRisk.push({ username: stu.username, topic: 'Algebra', belief: algBelief.toFixed(2) });
      }
      if (stu.seen_questions_exponents?.length > 2 && expBelief < 0.4) {
        atRisk.push({ username: stu.username, topic: 'Exponents', belief: expBelief.toFixed(2) });
      }
      if (stu.seen_questions_geometry?.length > 2 && geoBelief < 0.4) {
        atRisk.push({ username: stu.username, topic: 'Geometry', belief: geoBelief.toFixed(2) });
      }
    });

    return NextResponse.json({
      total_students: allStudents.length,
      fractions_active: fractionsCount,
      algebra_active: algebraCount,
      exponents_active: exponentsCount,
      geometry_active: geometryCount,
      at_risk: atRisk
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
