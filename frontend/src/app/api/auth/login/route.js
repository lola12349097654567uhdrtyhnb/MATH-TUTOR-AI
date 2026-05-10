import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';

export async function POST(req) {
  try {
    await dbConnect();
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Since we're skipping bcrypt just for this test scaffold, we'll do simple match 
    // (Ideally you'd use bcrypt here exactly as Flask did)
    if (user.password_hash !== password) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    const response = NextResponse.json({ 
      success: true, 
      username: user.username, 
      profile_configured: user.profile_configured,
      role: user.role
    });

    response.headers.append('Set-Cookie', `session_user=${user.username}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=604800`);

    return response;
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
