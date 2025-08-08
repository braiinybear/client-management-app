// app/dashboard/layout.tsx

import { auth, currentUser } from '@clerk/nextjs/server';
import { getRoleFromSession } from '@/lib/session';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    return redirect('/sign-in');
  }

  // Get role from session or fetch from DB
  let role = await getRoleFromSession();
      if(role === 'ADMIN') {
      return redirect('/admin');
    }
     else if (role === 'EMPLOYEE') {
        return redirect('/employee');
        }
    else if (role === 'MEMBER') {
    return redirect('/unauthorized');
    }

  if (!role) {
    const user = await currentUser();
    const email = user?.emailAddresses[0]?.emailAddress;

    if (!email) return redirect('/unauthorized');

    const dbUser = await prisma.user.findUnique({
      where: { email },
      select: { role: true },
    });

    if (!dbUser) return redirect('/unauthorized');

    role = dbUser.role;
  }

  return (
    <div className="min-h-screen grid grid-cols-[250px_1fr]">
      <aside className="bg-gray-100 p-4">
        <h2 className="font-bold text-lg mb-4">Dashboard</h2>
        <nav>
          <ul className="space-y-2 text-sm text-gray-700">
            {role === 'ADMIN' && (
              <>
                <li><a href="/dashboard/admin">Admin Home</a></li>
                <li><a href="/dashboard/admin/clients">All Clients</a></li>
                <li><a href="/dashboard/admin/employees">Manage Employees</a></li>
              </>
            )}

            {role === 'EMPLOYEE' && (
              <>
                <li><a href="/dashboard/employee">My Dashboard</a></li>
                <li><a href="/dashboard/employee/clients">My Clients</a></li>
                <li><a href="/dashboard/employee/add-client">Add Client</a></li>
              </>
            )}
          </ul>
        </nav>
      </aside>

      <main className="p-6">{children}</main>
    </div>
  );
}
