import type { Metadata } from "next";
import RebuildPreview from "@/components/rebuild/RebuildPreview";

export const metadata: Metadata = {
  title: "Rebuild design preview",
  robots: { index: false, follow: false },
};

export default function RebuildPreviewPage() {
  return <RebuildPreview />;
}
