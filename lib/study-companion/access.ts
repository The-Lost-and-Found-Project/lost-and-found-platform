import "server-only";

import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const COMPANION_ROLES = ["owner", "admin", "beta", "public"] as const;

export type CompanionRole = (typeof COMPANION_ROLES)[number];

export type CompanionFeature = {
  featureKey: string;
  title: string;
  description: string;
  enabled: boolean;
};

type CompanionMembership = {
  role: CompanionRole;
  is_active: boolean;
};

export async function requireStudyCompanionOwner() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/study-companion");
  }

  const { data: membership, error } = await supabase
    .from("companion_memberships")
    .select("role, is_active")
    .eq("user_id", user.id)
    .maybeSingle<CompanionMembership>();

  if (error) {
    throw new Error("Unable to verify Study Companion access.");
  }

  if (!membership?.is_active || membership.role !== "owner") {
    notFound();
  }

  return { supabase, user, role: membership.role };
}

export async function getStudyCompanionFeatures(): Promise<
  CompanionFeature[]
> {
  const { supabase, user, role } = await requireStudyCompanionOwner();

  const [
    { data: features, error: featuresError },
    { data: entitlements, error: entitlementsError },
    { data: preferences, error: preferencesError },
  ] = await Promise.all([
    supabase
      .from("companion_features")
      .select("feature_key, title, description, sort_order")
      .eq("is_active", true)
      .order("sort_order"),
    supabase
      .from("companion_role_features")
      .select("feature_key, allowed, default_enabled")
      .eq("role", role),
    supabase
      .from("companion_user_preferences")
      .select("feature_key, enabled")
      .eq("user_id", user.id),
  ]);

  if (featuresError || entitlementsError || preferencesError) {
    throw new Error("Unable to load Study Companion preferences.");
  }

  const entitlementByFeature = new Map(
    (entitlements ?? []).map((item) => [item.feature_key, item])
  );
  const preferenceByFeature = new Map(
    (preferences ?? []).map((item) => [item.feature_key, item.enabled])
  );

  return (features ?? [])
    .filter((feature) => entitlementByFeature.get(feature.feature_key)?.allowed)
    .map((feature) => {
      const entitlement = entitlementByFeature.get(feature.feature_key);
      return {
        featureKey: feature.feature_key,
        title: feature.title,
        description: feature.description,
        enabled:
          preferenceByFeature.get(feature.feature_key) ??
          entitlement?.default_enabled ??
          false,
      };
    });
}
