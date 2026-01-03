import { SignIn as ClerkSignIn } from '@clerk/clerk-react';

export function SignIn() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-bg-primary">
      <ClerkSignIn
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
        afterSignInUrl="/dashboard"
        appearance={{
          elements: {
            rootBox: 'mx-auto',
            card: 'bg-bg-card border border-gray-700',
            headerTitle: 'text-white',
            headerSubtitle: 'text-gray-400',
            socialButtonsBlockButton: 'bg-bg-secondary border-gray-700 text-white hover:bg-gray-700',
            formFieldLabel: 'text-gray-300',
            formFieldInput: 'bg-bg-secondary border-gray-700 text-white',
            footerActionLink: 'text-primary hover:text-primary/80',
            formButtonPrimary: 'bg-primary hover:bg-primary/90',
          },
        }}
      />
    </div>
  );
}
