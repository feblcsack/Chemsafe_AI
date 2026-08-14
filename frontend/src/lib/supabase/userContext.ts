import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

export type ResolvedUserContext = {
  user: User;
  role: "admin" | "worker" | null;
  orgId: string | null;
  profile: {
    id: string;
    role: "admin" | "worker";
    org_id: string | null;
    name: string | null;
    email: string | null;
  } | null;
};

function getPreferredRole(user: User): "admin" | "worker" {
  const metadataRole = user.user_metadata?.role ?? user.app_metadata?.role;
  return metadataRole === "admin" ? "admin" : "worker";
}

function resolveRoleFromProfile(user: User, profileRole: "admin" | "worker") {
  // Always respect the profile role from database first
  if (profileRole) {
    return profileRole;
  }
  
  // Fallback to metadata role if profile doesn't exist yet
  const metadataRole = getPreferredRole(user);
  return metadataRole;
}

function getPreferredName(user: User): string | null {
  const metadataName = user.user_metadata?.name ?? user.user_metadata?.full_name;
  if (typeof metadataName === "string" && metadataName.trim()) {
    return metadataName.trim();
  }

  if (user.email) {
    return user.email.split("@")[0];
  }

  return null;
}

export async function resolveCurrentUserContext() {
  const supabase = createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { user: null, role: null, orgId: null, profile: null, authError };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, org_id, name, email")
    .eq("id", user.id)
    .maybeSingle();

  if (profile) {
    const role = resolveRoleFromProfile(user, profile.role);
    let orgId = profile.org_id ?? null;

    if (role === "admin" && !orgId) {
      const { data: org } = await supabase
        .from("organizations")
        .select("id")
        .eq("admin_id", user.id)
        .maybeSingle();

      if (org?.id) {
        orgId = org.id;
      } else {
        const { data: createdOrg } = await supabase
          .from("organizations")
          .insert({ name: `${profile.name || getPreferredName(user) || "Admin"}'s Organization`, admin_id: user.id })
          .select("id")
          .maybeSingle();

        orgId = createdOrg?.id ?? null;
      }

      if (orgId) {
        await supabase.from("profiles").update({ org_id: orgId }).eq("id", user.id);
      }
    }

    return {
      user,
      role,
      orgId,
      profile: { ...profile, role, org_id: orgId },
      authError: null,
    };
  }

  const role = getPreferredRole(user);
  const name = getPreferredName(user);
  const email = user.email ?? null;

  let orgId: string | null = null;

  if (role === "admin") {
    const { data: org } = await supabase
      .from("organizations")
      .select("id")
      .eq("admin_id", user.id)
      .maybeSingle();

    if (org?.id) {
      orgId = org.id;
    } else {
      const { data: createdOrg } = await supabase
        .from("organizations")
        .insert({ name: `${name || "Admin"}'s Organization`, admin_id: user.id })
        .select("id")
        .maybeSingle();

      orgId = createdOrg?.id ?? null;
    }
  }

  const { data: recoveredProfile } = await supabase
    .from("profiles")
    .upsert(
      {
        id: user.id,
        role,
        org_id: orgId,
        name,
        email,
      },
      { onConflict: "id" }
    )
    .select("id, role, org_id, name, email")
    .maybeSingle();

  return {
    user,
    role: recoveredProfile?.role ?? role,
    orgId: recoveredProfile?.org_id ?? orgId,
    profile: recoveredProfile ?? null,
    authError: null,
  };
}