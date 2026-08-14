"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { resolveCurrentUserContext } from "@/lib/supabase/userContext";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError || !data.user) {
      setError("Incorrect email or password.");
      setLoading(false);
      return;
    }

    const context = await resolveCurrentUserContext();

    if (!context.user || !context.role) {
      setError("Failed to load user profile. Please try again.");
      setLoading(false);
      return;
    }

    // Ensure proper role-based redirection
    const targetRoute = context.role === "admin" ? "/admin/dashboard" : "/worker/dashboard";
    router.push(targetRoute);
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">Welcome back</CardTitle>
          <CardDescription>Sign in to your workplace safety account.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-3">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {error && <p className="text-corrosive text-sm">{error}</p>}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? <Loader2 className="animate-spin" size={16} /> : "Sign in"}
            </Button>

            <p className="text-center text-sm text-steel pt-1">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="text-hazard hover:underline">
                Sign up
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
