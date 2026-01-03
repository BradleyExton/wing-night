import { SignUp as ClerkSignUp } from '@clerk/clerk-react';

export function SignUp() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-bg-primary">
      <ClerkSignUp
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        afterSignUpUrl="/dashboard"
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
