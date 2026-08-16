import { createFileRoute, Link } from "@tanstack/react-router";
import { GROK_PROVIDERS, authEnabled, signIn } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  return (
    <main className="grid min-h-dvh place-items-center bg-bg px-6 text-fg pt-safe">
      <div className="w-full max-w-sm">
        <Link to="/" className="text-4xl font-bold tracking-tight">
          Harbor
        </Link>
        <p className="mt-2 text-sm text-muted">
          Optional. Your inbox works without an account.
        </p>
        <div className="mt-8 flex flex-col gap-2">
          {authEnabled ? (
            GROK_PROVIDERS.map((p) => (
              <Button
                key={p.providerId}
                variant="secondary"
                className="w-full"
                onClick={() => void signIn(p.providerId, { callbackURL: "/" })}
              >
                Continue with {p.label}
              </Button>
            ))
          ) : (
            <p className="text-sm text-muted">Sign-in is disabled.</p>
          )}
        </div>
        <Button asChild variant="ghost" className="mt-6 w-full">
          <Link to="/">Back to Today</Link>
        </Button>
      </div>
    </main>
  );
}
