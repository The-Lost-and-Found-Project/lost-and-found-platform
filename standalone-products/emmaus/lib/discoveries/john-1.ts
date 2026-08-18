export type DiscoveryStep = {
  id: string;
  label: string;
  prompt: string;
  kind: "read" | "response" | "prayer" | "summary";
};

export const johnOneDiscovery = {
  packId: "john-1-content-pack-v1",
  discoveryId: "john-1-1-eternal-word",
  title: "The Eternal Word",
  passage: "John 1:1",
  subtitle: "Discover what John claims about the Word before creation begins.",
  translation: "KJV · Public domain",
  scripture: "In the beginning was the Word, and the Word was with God, and the Word was God.",
  steps: [
    {
      id: "read",
      label: "Read",
      kind: "read" as const,
      prompt: "Read John 1:1 slowly. Notice what John says about when the Word existed, whom the Word was with, and who the Word was.",
    },
    {
      id: "observe",
      label: "Observe",
      kind: "response" as const,
      prompt: "What three explicit claims does John make about the Word? Stay with the text before explaining it.",
    },
    {
      id: "wonder",
      label: "Wonder",
      kind: "response" as const,
      prompt: "Why might John repeat the word ‘was’ three times? What question does that raise for you?",
    },
    {
      id: "connect",
      label: "Connect",
      kind: "response" as const,
      prompt: "Compare John 1:1 with Genesis 1:1. What connection does John seem to invite without flattening either passage?",
    },
    {
      id: "apply",
      label: "Apply",
      kind: "response" as const,
      prompt: "Where have you treated Jesus as less authoritative, present, or trustworthy than this verse requires?",
    },
    {
      id: "pray",
      label: "Pray",
      kind: "prayer" as const,
      prompt: "Father, deepen my trust in Jesus as the eternal and fully divine Word. Let this truth shape my worship, confidence, and obedience. Amen.",
    },
  ] satisfies DiscoveryStep[],
};
