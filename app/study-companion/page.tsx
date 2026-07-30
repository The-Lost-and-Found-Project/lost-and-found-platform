import StudyCompanionDashboard from "@/components/StudyCompanionDashboard";
import { getStudyCompanionFeatures } from "@/lib/study-companion/access";

export const dynamic = "force-dynamic";

export default async function StudyCompanionPage() {
  const features = await getStudyCompanionFeatures();

  return <StudyCompanionDashboard initialFeatures={features} />;
}
