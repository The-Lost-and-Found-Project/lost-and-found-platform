import {
  johnOneDiscovery,
  type DiscoveryDefinition,
} from "@/lib/emmaus/discoveries/john-1";

const discoveryRegistry: Record<string, DiscoveryDefinition> = {
  [johnOneDiscovery.key]: johnOneDiscovery,
};

export function getDiscovery(key: string): DiscoveryDefinition | null {
  return discoveryRegistry[key] ?? null;
}

export function listDiscoveries(): DiscoveryDefinition[] {
  return Object.values(discoveryRegistry);
}

export function hasDiscovery(key: string): boolean {
  return key in discoveryRegistry;
}
