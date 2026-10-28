import { SignIn, SignUp } from "@clerk/nextjs";

type AuthPageMode = "sign-in" | "sign-up";

type AuthPageLayoutProps = {
  mode: AuthPageMode;
};

const copy: Record<AuthPageMode, { title: string; description: string }> = {
  "sign-in": {
    title: "Sign in",
    description: "Access your dashboard and manage the properties you represent.",
  },
  "sign-up": {
    title: "Create your account",
    description: "Catalog listings and manage every property from one dashboard.",
  },
};

export function AuthPageLayout({ mode }: AuthPageLayoutProps) {
  const content = copy[mode];

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
      <div className="flex w-full max-w-md flex-col gap-6">
        <div className="flex flex-col gap-1 text-center">
          <h1 className="text-3xl font-bold text-text-primary">{content.title}</h1>
          <p className="text-sm leading-6 text-text-secondary">{content.description}</p>
        </div>

        {mode === "sign-in" ? (
          <SignIn fallbackRedirectUrl="/dashboard" path="/sign-in" routing="path" signUpUrl="/sign-up" />
        ) : (
          <SignUp fallbackRedirectUrl="/dashboard" path="/sign-up" routing="path" signInUrl="/sign-in" />
        )}
      </div>
    </div>
  );
}
