"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"admin" | "worker">("worker");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, role },
      },
    });

    if (authError || !data.user) {
      setError(authError?.message || "Sign up failed.");
      setLoading(false);
      return;
    }

    // NOTE: for the admin role, this creates a brand-new organization —
    // simplified for the MVP; a "join an existing org" flow can be added later.
    let orgId: string | null = null;
    if (role === "admin") {
      const { data: org } = await supabase
        .from("organizations")
        .insert({ name: `${name}'s Organization`, admin_id: data.user.id })
        .select()
        .single();
      orgId = org?.id ?? null;
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .upsert({ 
        id: data.user.id, 
        role, 
        name, 
        email, 
        org_id: orgId 
      }, { 
        onConflict: "id",
        ignoreDuplicates: false 
      });

    if (profileError) {
      setError(profileError.message || "Failed to create profile.");
      setLoading(false);
      return;
    }

    // Verify the profile was created correctly before redirecting
    const { data: verifyProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    const finalRole = verifyProfile?.role || role;
    router.push(finalRole === "admin" ? "/admin/dashboard" : "/worker/dashboard");
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">Create an account</CardTitle>
          <CardDescription>Join as a worker or set up your organization.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-3">
            <div className="flex gap-2 p-1 rounded-lg bg-white/[0.03] border border-white/10">
              <button
                type="button"
                onClick={() => setRole("worker")}
                className={cn(
                  "flex-1 py-2 rounded-md font-display text-sm font-semibold transition-colors",
                  role === "worker" ? "bg-hazard text-ink" : "text-steel hover:text-paper"
                )}
              >
                Worker
              </button>
              <button
                type="button"
                onClick={() => setRole("admin")}
                className={cn(
                  "flex-1 py-2 rounded-md font-display text-sm font-semibold transition-colors",
                  role === "admin" ? "bg-hazard text-ink" : "text-steel hover:text-paper"
                )}
              >
                Admin
              </button>
            </div>

            <Input
              type="text"
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
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
              minLength={6}
            />

            {error && <p className="text-corrosive text-sm">{error}</p>}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? <Loader2 className="animate-spin" size={16} /> : "Create account"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
