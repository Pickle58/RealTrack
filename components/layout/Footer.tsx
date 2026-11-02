export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-2 px-4 py-6 text-xs text-text-muted md:flex-row md:items-center md:justify-between md:px-6">
        <p>© {year} PILKINGTON ENTERPRISES</p>
        <p>Listings are published by the agents who manage them.</p>
      </div>
    </footer>
  );
}
