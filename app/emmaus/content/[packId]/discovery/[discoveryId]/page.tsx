import { notFound } from "next/navigation";
import InteractiveDiscoveryPlayer from "@/components/emmaus/InteractiveDiscoveryPlayer";
import { getEmmausContentPack } from "@/lib/emmaus/content-packs/registry";

export default async function EmmausInteractiveDiscoveryPage({
  params,
}: {
  params: Promise<{ packId: string; discoveryId: string }>;
}) {
  const { packId, discoveryId } = await params;
  const pack = getEmmausContentPack(packId);
  if (!pack) notFound();

  const discovery = pack.discoveries.find((item) => item.id === discoveryId);
  if (!discovery) notFound();

  return (
    <InteractiveDiscoveryPlayer
      packId={pack.id}
      packTitle={pack.title}
      discovery={discovery}
    />
  );
}
