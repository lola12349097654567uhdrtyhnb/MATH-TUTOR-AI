import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export default async function Home() {
  const cookieStore = await cookies();
  const sessionUser = cookieStore.get('session_user');
  
  if (sessionUser) {
    redirect('/dashboard');
  } else {
    redirect('/login');
  }
}
