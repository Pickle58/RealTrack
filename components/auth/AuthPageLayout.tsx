import Link from "next/link";
import { LockKeyhole } from "lucide-react";
import { Card } from "@/components/ui/card";

type AuthPageMode = "sign-in" | "sign-up";

type AuthPageLayoutProps = {
  mode: AuthPageMode;
};

const copy: Record<
  AuthPageMode,
  {
    title: string;
    description: string;
    placeholderTitle: string;
    placeholderBody: string;
    switchPrompt: string;
    switchLabel: string;
    switchHref: string;
  }
> = {
  "sign-in": {
    title: "Sign in",
    description: "Access your dashboard and manage the properties you represent.",
    placeholderTitle: "Sign-in form placeholder",
    placeholderBody: "Clerk's sign-in component renders here once authentication is wired up.",
    switchPrompt: "Need an account?",
    switchLabel: "Sign up",
    switchHref: "/sign-up",
  },
  "sign-up": {
    title: "Create your account",
    description: "Catalog listings and manage every property from one dashboard.",
    placeholderTitle: "Sign-up form placeholder",
    placeholderBody: "Clerk's sign-up component renders here once authentication is wired up.",
    switchPrompt: "Already have an account?",
    switchLabel: "Sign in",
    switchHref: "/sign-in",
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

        <Card className="items-center gap-2 border-dashed px-6 py-10 text-center">
          <div className="flex size-10 items-center justify-center rounded-full bg-accent-light">
            <LockKeyhole aria-hidden className="size-5 text-accent" />
          </div>
          <p className="text-sm font-medium text-text-primary">{content.placeholderTitle}</p>
          <p className="max-w-xs text-xs leading-5 text-text-muted">{content.placeholderBody}</p>
        </Card>

        <p className="text-center text-sm text-text-secondary">
          {content.switchPrompt}{" "}
          <Link className="font-medium text-accent hover:text-accent-dark" href={content.switchHref}>
            {content.switchLabel}
          </Link>
        </p>
      </div>
    </div>
  );
}
