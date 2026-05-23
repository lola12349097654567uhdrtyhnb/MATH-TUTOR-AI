import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';

export async function POST(req) {
  try {
    const cookieStore = await cookies();
    const sessionUser = req.headers.get('x-user-id') || cookieStore.get('session_user')?.value;
    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      satisfaction,
      q_math_clear,
      q_dark_mode,
      q_navigation,
      q_bugs,
      q_adaptation,
      q_hints,
      q_improvement,
      q_best_topic,
      q_ai_walkthrough,
      q_ai_tone,
      q_ai_length,
      q_ai_confused,
      q_timer_paused,
      q_untimed,
      q_confidence,
      q_teach_me,
      q_study_plan
    } = body;

    if (satisfaction === undefined) {
      return NextResponse.json({ error: 'Satisfaction rating is required' }, { status: 400 });
    }

    await dbConnect();
    const user = await User.findOne({ username: sessionUser });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Auto-map 1-5 scales to Yes/No for backward-compatibility with existing instructor statistics
    const q1_ai_helpful = Number(q_ai_walkthrough) >= 3 ? 'Yes' : 'No';
    const q2_difficulty_appropriate = Number(q_adaptation) >= 3 ? 'Yes' : 'No';
    const q3_recommend = Number(q_confidence) >= 3 ? 'Yes' : 'No';
    
    // Compile open-ended answers into feedback_text for general dashboard feeds
    const feedback_parts = [];
    if (q_best_topic) feedback_parts.push(`🌟 Taught Best: ${q_best_topic}`);
    if (q_ai_confused) feedback_parts.push(`❓ AI Confusion: ${q_ai_confused}`);
    if (q_bugs) feedback_parts.push(`⚙️ Technical Bugs/Lag: ${q_bugs}`);
    const feedback_text = feedback_parts.join('\n\n');

    await User.updateOne(
      { username: sessionUser },
      {
        $set: {
          evaluation_questionnaire: {
            submitted_at: new Date(),
            satisfaction: Number(satisfaction),
            q1_ai_helpful,
            q2_difficulty_appropriate,
            q3_recommend,
            feedback_text,
            
            // Detailed ratings for 7-8 grade questionnaire sections
            q_math_clear: Number(q_math_clear || 5),
            q_dark_mode: Number(q_dark_mode || 5),
            q_navigation: Number(q_navigation || 5),
            q_bugs: String(q_bugs || ''),
            
            q_adaptation: Number(q_adaptation || 5),
            q_hints: Number(q_hints || 5),
            q_improvement: Number(q_improvement || 5),
            q_best_topic: String(q_best_topic || ''),
            
            q_ai_walkthrough: Number(q_ai_walkthrough || 5),
            q_ai_tone: Number(q_ai_tone || 5),
            q_ai_length: Number(q_ai_length || 5),
            q_ai_confused: String(q_ai_confused || ''),
            
            q_timer_paused: Number(q_timer_paused || 5),
            q_untimed: Number(q_untimed || 5),
            q_confidence: Number(q_confidence || 5),
            
            q_teach_me: Number(q_teach_me || 5),
            q_study_plan: Number(q_study_plan || 5)
          }
        }
      }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
