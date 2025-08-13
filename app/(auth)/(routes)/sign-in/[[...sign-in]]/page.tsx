'use client';

import { SignIn } from '@clerk/nextjs';
import { shadesOfPurple } from '@clerk/themes';

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md">
        <SignIn
          appearance={{
            baseTheme: shadesOfPurple,
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
                'bg-blue-600 hover:bg-blue-500 text-white text-base font-medium',
            },
          }}
          signUpUrl="/sign-up"
          fallbackRedirectUrl="/"  // Used if no redirect_url query param exists
          forceRedirectUrl="/"
          fallback="Loading..."
        />
      </div>
    </div>
  );
}
