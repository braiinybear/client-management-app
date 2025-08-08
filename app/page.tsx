import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import prisma from '../lib/prisma';

export default async function HomePage() {
  const { userId } = await auth();

  if (!userId) {
    return redirect('/sign-up');
  }

  const user = await currentUser();
  if (!user) {
    return <div>Loading...</div>;
  }

  const uEmail = user.emailAddresses[0]?.emailAddress;
  const uName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();

  if (!uEmail) {
    return <div>Error: User email not found.</div>;
  }

  // Safely upsert user to avoid duplicates and sync name
  const dbUser = await prisma.user.upsert({
    where: { email: uEmail },
    update: { name: uName },
    create: {
      email: uEmail,
      name: uName,
      clerkId: user.id,
    },
    select: { id: true, email: true, role: true },
  });

  // Redirect based on role
  if (dbUser.role === 'ADMIN') return redirect('/admin');
  if (dbUser.role === 'EMPLOYEE') return redirect('/employee');
  return redirect('/unauthorized');
}
