import type { Metadata } from "next";
import RebuildPreview from "@/components/rebuild/RebuildPreview";
import { requireAppCapability } from "@/lib/role-access";

export const metadata: Metadata = {
  title: "Rebuild design preview",
  robots: { index: false, follow: false },
};

export default async function RebuildPreviewPage() {
  await requireAppCapability("admin_center", "/rebuild-preview");
  return <RebuildPreview />;
}
