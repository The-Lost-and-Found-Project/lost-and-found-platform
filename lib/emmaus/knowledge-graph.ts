export type KnowledgeNodeType =
  | "verse"
  | "concept"
  | "person"
  | "theme"
  | "book"
  | "word"
  | "trail";

export type KnowledgeNode = {
  id: string;
  type: KnowledgeNodeType;
  label: string;
  description: string;
  reference?: string;
  href?: string;
  tags?: string[];
};

export type KnowledgeEdge = {
  from: string;
  to: string;
  relationship: string;
  explanation: string;
};

export const knowledgeNodes: KnowledgeNode[] = [
  {
    id: "verse-john-1-1",
    type: "verse",
    label: "John 1:1",
    reference: "John 1:1",
    description: "John introduces the eternal Word as distinct from God and fully divine.",
    tags: ["John", "Christology", "Creation"],
  },
  {
    id: "concept-logos",
    type: "word",
    label: "Logos — The Word",
    description: "A title emphasizing revelation, divine self-expression, and the identity of Christ.",
    href: "/emmaus/trails/logos",
    tags: ["Greek", "Revelation", "Jesus"],
  },
  {
    id: "concept-creation",
    type: "theme",
    label: "Creation",
    description: "God creates through His word; John identifies the Word as active in creation.",
    tags: ["Genesis", "John", "Colossians"],
  },
  {
    id: "concept-light",
    type: "theme",
    label: "Light",
    description: "A biblical theme connecting creation, revelation, holiness, and Christ's victory over darkness.",
    tags: ["Genesis", "John", "Revelation"],
  },
  {
    id: "concept-life",
    type: "theme",
    label: "Life",
    description: "John presents life as residing in Christ and becoming light for humanity.",
    tags: ["John", "Resurrection", "Eternal Life"],
  },
  {
    id: "concept-trinity",
    type: "concept",
    label: "Trinity",
    description: "John 1:1 holds together distinction and deity: the Word was with God and was God.",
    tags: ["Father", "Son", "Holy Spirit"],
  },
  {
    id: "person-jesus",
    type: "person",
    label: "Jesus Christ",
    description: "The eternal Son, Creator, revealer of God, incarnate Word, and reigning King.",
    tags: ["Messiah", "Son of God", "Word"],
  },
  {
    id: "verse-genesis-1-1",
    type: "verse",
    label: "Genesis 1:1–3",
    reference: "Genesis 1:1–3",
    description: "God creates through speech and calls light into darkness.",
    tags: ["Creation", "Light", "Beginning"],
  },
  {
    id: "verse-colossians-1-15",
    type: "verse",
    label: "Colossians 1:15–17",
    reference: "Colossians 1:15–17",
    description: "Christ is the image of the invisible God and the agent and sustainer of creation.",
    tags: ["Christology", "Creation", "Image"],
  },
  {
    id: "verse-hebrews-1-1",
    type: "verse",
    label: "Hebrews 1:1–3",
    reference: "Hebrews 1:1–3",
    description: "God speaks through the Son, through whom He made the world and revealed His glory.",
    tags: ["Revelation", "Son", "Creation"],
  },
  {
    id: "trail-logos",
    type: "trail",
    label: "Rabbit Trail: The Word",
    description: "A guided trail through creation, revelation, incarnation, and glory.",
    href: "/emmaus/trails/logos",
    tags: ["Rabbit Trail", "John 1"],
  },
];

export const knowledgeEdges: KnowledgeEdge[] = [
  { from: "verse-john-1-1", to: "concept-logos", relationship: "names", explanation: "John identifies Christ with the title Logos, the Word." },
  { from: "verse-john-1-1", to: "concept-creation", relationship: "echoes", explanation: "The opening deliberately recalls Genesis 1 and places the Word before creation." },
  { from: "verse-john-1-1", to: "concept-trinity", relationship: "reveals", explanation: "The Word is both with God and fully God." },
  { from: "concept-logos", to: "person-jesus", relationship: "identifies", explanation: "John 1:14 and 1:18 identify the Word as the incarnate Son." },
  { from: "concept-logos", to: "trail-logos", relationship: "opens", explanation: "The Logos concept launches a deeper guided exploration." },
  { from: "concept-creation", to: "verse-genesis-1-1", relationship: "begins in", explanation: "Genesis introduces creation through God's speech." },
  { from: "concept-creation", to: "verse-colossians-1-15", relationship: "developed in", explanation: "Paul describes all things as created through and for Christ." },
  { from: "concept-creation", to: "verse-hebrews-1-1", relationship: "developed in", explanation: "Hebrews links the Son with God's speech and creation." },
  { from: "verse-genesis-1-1", to: "concept-light", relationship: "introduces", explanation: "Light is the first created reality explicitly called forth by God." },
  { from: "concept-light", to: "concept-life", relationship: "joined in John", explanation: "John connects life in the Word with light for humanity." },
  { from: "concept-life", to: "person-jesus", relationship: "resides in", explanation: "John presents life as intrinsic to Christ." },
  { from: "concept-trinity", to: "person-jesus", relationship: "clarifies identity", explanation: "The Son is personally distinct and fully divine." },
];

export function getKnowledgeNode(id: string) {
  return knowledgeNodes.find((node) => node.id === id) ?? null;
}

export function getConnectedKnowledge(id: string) {
  return knowledgeEdges.flatMap((edge) => {
    if (edge.from === id) {
      const node = getKnowledgeNode(edge.to);
      return node ? [{ node, edge, direction: "outgoing" as const }] : [];
    }
    if (edge.to === id) {
      const node = getKnowledgeNode(edge.from);
      return node ? [{ node, edge, direction: "incoming" as const }] : [];
    }
    return [];
  });
}

export function searchKnowledge(query: string) {
  const needle = query.trim().toLowerCase();
  if (!needle) return knowledgeNodes;
  return knowledgeNodes.filter((node) =>
    [node.label, node.description, node.reference, ...(node.tags ?? [])]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(needle))
  );
}
