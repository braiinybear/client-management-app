// lib/session.ts

import { cookies } from 'next/headers'; // Use this to access cookies in the server context
import { NextResponse } from 'next/server';

// Set the user's role in the session (store it in cookies)
export const setSessionRole = (role: string) => {
  const response = NextResponse.next();

  // Setting the role cookie
  response.cookies.set('role', role, {
    path: '/',
    httpOnly: true,  // Prevent access to the cookie via JavaScript
    maxAge: 60 * 60 * 24 * 30, // Cookie expires in 30 days
  });

  return response;
};

// Get the role from the session (cookie)
export const getRoleFromSession = async () => {
  const cookieStore = await cookies(); // We need to await the Promise to access the cookies
  const role = cookieStore.get('role');
  return role ? role.value : null;
};
