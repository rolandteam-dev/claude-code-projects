import Link from "next/link";
import { getAuthContext } from "@/lib/auth";
import { Container } from "@/components/ui";
import { Nav } from "@/components/Nav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await getAuthContext();

  if (!ctx) {
    return (
      <main className="grid min-h-dvh place-items-center p-6">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-semibold">No session</h1>
          <p className="mt-2 text-sm text-ink-muted">
            Configure Clerk, or set <code className="font-mono">DEV_AUTH_EMAIL</code>{" "}
            in <code className="font-mono">.env.local</code> to a seeded user and
            run <code className="font-mono">npm run db:seed</code>.
          </p>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-dvh">
      {ctx.isDevBypass ? (
        <div className="bg-risk-warn-soft px-4 py-1.5 text-center text-xs font-medium text-risk-warn">
          Local dev session as {ctx.user.email} — auth bypass active, not a real
          login
        </div>
      ) : null}

      <header className="border-b border-border bg-surface">
        <Container className="flex h-16 items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <Link href="/deals" className="flex items-baseline gap-2">
              <span className="text-lg font-semibold tracking-tight">
                DealDesk
              </span>
              <span className="text-xs text-ink-subtle">Phase 0</span>
            </Link>
            <Nav />
          </div>
          <div className="text-right">
            <div className="text-sm font-medium">{ctx.team.name}</div>
            <div className="text-xs text-ink-subtle">
              {ctx.user.name ?? ctx.user.email} · {ctx.role}
            </div>
          </div>
        </Container>
      </header>

      <main className="py-8">{children}</main>
    </div>
  );
}
