import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';
import Activity from '@/lib/models/Activity';

export async function GET(req) {
  try {
    const sessionUser = (await cookies()).get('session_user')?.value;
    if (!sessionUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const user = await User.findOne({ username: sessionUser });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Find the latest activity timestamp for each topic
    const lastFractions = await Activity.findOne({ username: sessionUser, topic: 'fractions' }).sort({ createdAt: -1 });
    const lastAlgebra = await Activity.findOne({ username: sessionUser, topic: 'algebra' }).sort({ createdAt: -1 });
    const lastExponents = await Activity.findOne({ username: sessionUser, topic: 'exponents' }).sort({ createdAt: -1 });
    const lastGeometry = await Activity.findOne({ username: sessionUser, topic: 'geometry' }).sort({ createdAt: -1 });

    const formatActivityDate = (activity) => {
      if (!activity) return 'Never practiced';
      return new Date(activity.createdAt).toLocaleString(undefined, { 
        year: 'numeric', month: 'short', day: 'numeric', 
        hour: '2-digit', minute:'2-digit' 
      });
    };

    return NextResponse.json({
      topics: {
        fractions: {
          lastVisited: formatActivityDate(lastFractions),
          questionsSeen: user.seen_questions_fractions?.length || 0,
          diagnosticCompleted: user.diagnostic_completed_fractions || false,
          topicGraduated: user.topic_graduated_fractions || false
        },
        algebra: {
          lastVisited: formatActivityDate(lastAlgebra),
          questionsSeen: user.seen_questions_algebra?.length || 0,
          diagnosticCompleted: user.diagnostic_completed_algebra || false,
          topicGraduated: user.topic_graduated_algebra || false
        },
        exponents: {
          lastVisited: formatActivityDate(lastExponents),
          questionsSeen: user.seen_questions_exponents?.length || 0,
          diagnosticCompleted: user.diagnostic_completed_exponents || false,
          topicGraduated: user.topic_graduated_exponents || false
        },
        geometry: {
          lastVisited: formatActivityDate(lastGeometry),
          questionsSeen: user.seen_questions_geometry?.length || 0,
          diagnosticCompleted: user.diagnostic_completed_geometry || false,
          topicGraduated: user.topic_graduated_geometry || false
        }
      }
    });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
