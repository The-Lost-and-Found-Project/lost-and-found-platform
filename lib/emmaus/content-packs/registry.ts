import type { EmmausContentPack } from "@/lib/emmaus/content-packs/john-1";
import { john1ContentPack } from "@/lib/emmaus/content-packs/john-1";
import { genesisOneOneToFiveContentPack } from "@/lib/emmaus/content-packs/genesis-1-1-5";

export const emmausContentPacks: EmmausContentPack[] = [
  genesisOneOneToFiveContentPack,
  john1ContentPack,
];

export function getEmmausContentPack(id: string) {
