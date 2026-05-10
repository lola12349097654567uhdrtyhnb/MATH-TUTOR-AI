import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  const response = NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'));
  response.headers.append('Set-Cookie', `session_user=; Path=/; HttpOnly; Secure; SameSite=Lax; Expires=Thu, 01 Jan 1970 00:00:00 GMT`);
  return response;
}
