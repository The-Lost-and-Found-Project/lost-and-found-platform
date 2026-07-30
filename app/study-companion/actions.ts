"use server";

import { revalidatePath } from "next/cache";
import { requireStudyCompanionOwner } from "@/lib/study-companion/access";

export async function updateCompanionFeaturePreference(
  featureKey: string,
  enabled: boolean
) {
  if (
    !/^[a-z][a-z0-9_]*$/.test(featureKey) ||
    typeof enabled !== "boolean"
  ) {
    throw new Error("Invalid Study Companion feature.");
  }

  const { supabase, user, role } = await requireStudyCompanionOwner();

  const { data: entitlement, error: entitlementError } = await supabase
    .from("companion_role_features")
    .select("allowed")
    .eq("role", role)
    .eq("feature_key", featureKey)
    .maybeSingle();

  if (entitlementError || !entitlement?.allowed) {
    throw new Error("This Study Companion feature is not available.");
  }

  const { error } = await supabase
    .from("companion_user_preferences")
    .upsert(
      {
        user_id: user.id,
        feature_key: featureKey,
        enabled,
      },
      { onConflict: "user_id,feature_key" }
    );

  if (error) {
    throw new Error("Unable to save this Study Companion preference.");
  }

  revalidatePath("/study-companion");
}
