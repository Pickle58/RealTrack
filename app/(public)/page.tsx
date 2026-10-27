import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <section className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold text-text-primary">Track listings. Browse what is active.</h1>
      <p className="max-w-2xl text-sm leading-6 text-text-secondary">
        The landing page is replaced by the browsing UI in the next feature. Until then the design
        tokens and primitives can be checked on the style guide.
      </p>
      <div>
        <Button asChild variant="secondary">
          <Link href="/style-guide">Open the style guide</Link>
        </Button>
      </div>
    </section>
  );
}
