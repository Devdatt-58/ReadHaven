import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import CreatePostClient from './CreatePostClient';

export default async function CreatePostPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/login?notice=login-required');
  }

  return <CreatePostClient user={session.user} />;
}
