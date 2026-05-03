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
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Mark all as read when fetched
    if (user.notifications?.length > 0) {
      let updated = false;
      user.notifications.forEach(n => {
        if (!n.read) { n.read = true; updated = true; }
      });
      if (updated) {
        user.markModified('notifications');
        await user.save();
      }
    }

    return NextResponse.json({ notifications: user.notifications || [] });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
