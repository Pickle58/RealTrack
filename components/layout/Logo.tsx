export function Logo() {
  return (
    <span className="flex min-w-0 items-center gap-2">
      <svg
        aria-hidden="true"
        className="h-7 w-7 shrink-0"
        fill="none"
        viewBox="0 0 32 32"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          className="stroke-accent"
          d="M5.9 17.5 16 7.2l10.1 10.3"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={3.4}
        />
        <path
          className="stroke-text-primary"
          d="M9.2 16.1v5.3a2.9 2.9 0 0 0 2.9 2.9h7.8a2.9 2.9 0 0 0 2.9-2.9v-5.3"
          strokeLinecap="round"
          strokeWidth={2.8}
        />
      </svg>
      <span className="truncate text-base font-semibold tracking-tight text-text-primary">
        Real<span className="text-accent">Track</span>
      </span>
    </span>
  );
}
