'use client';

import { SignUp } from '@clerk/nextjs';
import { shadesOfPurple } from '@clerk/themes';
import { useTheme } from 'next-themes';

export default function SignUpPage() {
  const { resolvedTheme } = useTheme();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold mb-8 text-center">
          Create Your Account
        </h1>
        <SignUp
          appearance={{
            baseTheme:
              resolvedTheme === 'shadesOfPurple' ? shadesOfPurple : undefined,
            layout: {
              showOptionalFields: false,
              socialButtonsPlacement: 'bottom',
              socialButtonsVariant: 'iconButton',
              helpPageUrl: '/help',
              privacyPageUrl: '/privacy',
              termsPageUrl: '/terms',
            },
            elements: {
              formButtonPrimary:
                'bg-blue-600 hover:bg-blue-500 text-white font-medium',
            },
          }}
          signInUrl="/sign-in"
          fallbackRedirectUrl="/"
          forceRedirectUrl="/"
          fallback="Loading..."
        />
      </div>
    </div>
  );
}
