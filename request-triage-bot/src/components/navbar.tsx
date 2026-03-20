import Link from "next/link";

export function Navbar() {
  return (
    <nav className="border-b bg-white dark:bg-zinc-950">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold tracking-tight">
          🎯 Request Triage Bot
        </Link>
        <div className="flex gap-6 text-sm font-medium">
          <Link href="/submit" className="hover:text-primary transition-colors">
            Submit Request
          </Link>
          <Link
            href="/dashboard"
            className="hover:text-primary transition-colors"
          >
            Dashboard
          </Link>
          <Link href="/search" className="hover:text-primary transition-colors">
            Search
          </Link>
        </div>
      </div>
    </nav>
  );
}
