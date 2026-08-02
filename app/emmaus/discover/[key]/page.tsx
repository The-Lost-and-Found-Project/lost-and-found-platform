import { notFound } from "next/navigation";
import JohnOneDiscovery from "@/components/emmaus/JohnOneDiscovery";
import { getDiscovery } from "@/lib/emmaus/discoveries/registry";

type DiscoveryPageProps = {
  params: Promise<{ key: string }>;
};

export default async function DiscoveryPage({ params }: DiscoveryPageProps) {
  const { key } = await params;
  const discovery = getDiscovery(key);

  if (!discovery) {
    notFound();
  }

  // John 1 is the first registered Discovery. The registry-backed route is
  // now stable; additional definitions can be mapped to the shared engine as
  // they are added without creating another public route structure.
  return <JohnOneDiscovery />;
}
