"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { resolveCurrentUserContext } from "@/lib/supabase/userContext";
import { Button } from "@/components/ui/button";
import { LogOut, Shield, Users, Activity, Settings } from "lucide-react";

interface NavigationProps {
  currentPath: string;
}

export default function Navigation({ currentPath }: NavigationProps) {
  const [userRole, setUserRole] = useState<"admin" | "worker" | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    loadUserData();
  }, []);

  async function loadUserData() {
    const context = await resolveCurrentUserContext();
    if (context.user && context.role) {
      setUserRole(context.role);
      setUserName(context.profile?.name || context.user.email?.split("@")[0] || "User");
    }
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (!userRole) return null;

  const adminLinks = [
    { href: "/admin/dashboard", label: "Dashboard", icon: Activity },
    { href: "/admin/zones/new", label: "New Zone", icon: Shield },
  ];

  const workerLinks = [
    { href: "/worker/dashboard", label: "Dashboard", icon: Activity },
  ];

  const links = userRole === "admin" ? adminLinks : workerLinks;

  return (
    <nav className="bg-ink/80 backdrop-blur-sm border-b border-white/10 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="font-display font-bold text-lg text-hazard">
              ChemSafe
            </Link>
            
            <div className="flex items-center gap-4">
              {links.map(link => {
                const Icon = link.icon;
                const isActive = currentPath === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-hazard/20 text-hazard"
                        : "text-steel hover:text-paper hover:bg-white/5"
                    }`}
                  >
                    <Icon size={16} />
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium">{userName}</p>
              <p className="text-xs text-steel capitalize">{userRole}</p>
            </div>
            
            <Button onClick={handleLogout} variant="outline" size="sm">
              <LogOut size={14} />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}