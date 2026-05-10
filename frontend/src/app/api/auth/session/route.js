import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const cookieStore = await cookies();
    const sessionUser = req.headers.get('x-user-id') || cookieStore.get('session_user')?.value;
    if (!sessionUser) return NextResponse.json({ role: null, username: null });

    await dbConnect();
    const user = await User.findOne({ username: sessionUser });
    if (!user) return NextResponse.json({ role: null, username: null });

    return NextResponse.json({ role: user.role, username: user.username });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
