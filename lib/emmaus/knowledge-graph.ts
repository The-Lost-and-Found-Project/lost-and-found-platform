export type KnowledgeNodeType =
  | "verse"
  | "passage"
  | "chapter"
  | "book"
  | "concept"
  | "doctrine"
  | "person"
  | "place"
  | "event"
  | "theme"
  | "covenant"
  | "prophecy"
  | "word"
  | "trail";

export type Testament = "old" | "new" | "both";
export type ReviewStatus = "draft" | "reviewed" | "approved";
export type EdgeConfidence = "explicit" | "strong" | "inferred";

export type KnowledgeSource = {
  kind: "scripture" | "lexicon" | "commentary" | "internal_review";
  citation: string;
  note?: string;
};

export type KnowledgeNode = {
  id: string;
  type: KnowledgeNodeType;
  label: string;
  description: string;
  reference?: string;
  href?: string;
  tags?: string[];
  testament?: Testament;
  book?: string;
  chapter?: number;
  canonicalOrder?: number;
  status?: ReviewStatus;
  sources?: KnowledgeSource[];
};

export type KnowledgeEdge = {
  id?: string;
  from: string;
  to: string;
  relationship: string;
  explanation: string;
  confidence?: EdgeConfidence;
  status?: ReviewStatus;
  reciprocalLabel?: string;
  sources?: KnowledgeSource[];
  reviewNote?: string;
};

const scriptureSource = (citation: string): KnowledgeSource => ({ kind: "scripture", citation });

export const knowledgeNodes: KnowledgeNode[] = [
  { id: "book-genesis", type: "book", label: "Genesis", description: "The book of beginnings: creation, fall, covenant, and the patriarchs.", testament: "old", canonicalOrder: 1, status: "approved", tags: ["Torah", "Creation", "Covenant"] },
  { id: "book-john", type: "book", label: "John", description: "A Gospel written so readers may believe Jesus is the Christ, the Son of God.", testament: "new", canonicalOrder: 43, status: "approved", tags: ["Gospel", "Jesus", "Signs"] },
  { id: "chapter-genesis-1", type: "chapter", label: "Genesis 1", description: "God creates by His word, orders creation, and makes humanity in His image.", reference: "Genesis 1", testament: "old", book: "Genesis", chapter: 1, status: "approved", tags: ["Creation", "Image of God", "Light"] },
  { id: "chapter-john-1", type: "chapter", label: "John 1", description: "The eternal Word becomes flesh and is revealed as Jesus Christ.", reference: "John 1", testament: "new", book: "John", chapter: 1, status: "approved", tags: ["Logos", "Incarnation", "Witness"] },
  { id: "verse-john-1-1", type: "verse", label: "John 1:1", reference: "John 1:1", description: "John introduces the eternal Word as distinct from God and fully divine.", testament: "new", book: "John", chapter: 1, status: "approved", sources: [scriptureSource("John 1:1")], tags: ["John", "Christology", "Creation"] },
  { id: "verse-john-1-3", type: "passage", label: "John 1:1–3", reference: "John 1:1–3", description: "The Word exists eternally and all created things came into being through Him.", testament: "new", book: "John", chapter: 1, status: "approved", sources: [scriptureSource("John 1:1–3")], tags: ["Creation", "Logos", "Jesus"] },
  { id: "verse-john-1-14", type: "verse", label: "John 1:14", reference: "John 1:14", description: "The eternal Word becomes flesh and dwells among humanity.", testament: "new", book: "John", chapter: 1, status: "approved", sources: [scriptureSource("John 1:14")], tags: ["Incarnation", "Glory", "Grace"] },
  { id: "verse-genesis-1-1", type: "passage", label: "Genesis 1:1–3", reference: "Genesis 1:1–3", description: "God creates through speech and calls light into darkness.", testament: "old", book: "Genesis", chapter: 1, status: "approved", sources: [scriptureSource("Genesis 1:1–3")], tags: ["Creation", "Light", "Beginning"] },
  { id: "verse-colossians-1-15", type: "passage", label: "Colossians 1:15–17", reference: "Colossians 1:15–17", description: "Christ is the image of the invisible God and the agent and sustainer of creation.", testament: "new", book: "Colossians", chapter: 1, status: "approved", sources: [scriptureSource("Colossians 1:15–17")], tags: ["Christology", "Creation", "Image"] },
  { id: "verse-hebrews-1-1", type: "passage", label: "Hebrews 1:1–3", reference: "Hebrews 1:1–3", description: "God speaks through the Son, through whom He made the world and revealed His glory.", testament: "new", book: "Hebrews", chapter: 1, status: "approved", sources: [scriptureSource("Hebrews 1:1–3")], tags: ["Revelation", "Son", "Creation"] },
  { id: "verse-revelation-19-13", type: "passage", label: "Revelation 19:13–16", reference: "Revelation 19:13–16", description: "The victorious Christ is called the Word of God and King of kings.", testament: "new", book: "Revelation", chapter: 19, status: "reviewed", sources: [scriptureSource("Revelation 19:13–16")], tags: ["Word of God", "King", "Judgment"] },
  { id: "concept-logos", type: "word", label: "Logos — The Word", description: "A Greek term used by John to identify Jesus as God's eternal self-expression and revealer.", href: "/emmaus/trails/logos", testament: "new", status: "reviewed", sources: [scriptureSource("John 1:1, 14")], tags: ["Greek", "Revelation", "Jesus"] },
  { id: "word-arche", type: "word", label: "Archē — Beginning", description: "A Greek term for beginning, origin, or first principle; used in John 1:1.", testament: "new", status: "draft", sources: [scriptureSource("John 1:1")], tags: ["Greek", "Beginning", "Eternity"] },
  { id: "concept-creation", type: "theme", label: "Creation", description: "God brings all things into being; the New Testament identifies Christ as active in creation.", testament: "both", status: "approved", sources: [scriptureSource("Genesis 1:1–3; John 1:1–3; Colossians 1:15–17")], tags: ["Genesis", "John", "Colossians"] },
  { id: "concept-light", type: "theme", label: "Light", description: "A theme connecting creation, revelation, holiness, witness, and Christ's victory over darkness.", testament: "both", status: "reviewed", sources: [scriptureSource("Genesis 1:3; John 1:4–9")], tags: ["Genesis", "John", "Revelation"] },
  { id: "concept-life", type: "theme", label: "Life", description: "John presents life as residing in Christ and becoming light for humanity.", testament: "new", status: "reviewed", sources: [scriptureSource("John 1:4; 11:25; 14:6")], tags: ["John", "Resurrection", "Eternal Life"] },
  { id: "concept-trinity", type: "doctrine", label: "Trinity", description: "The one God eternally exists as Father, Son, and Holy Spirit; John 1 contributes distinction and deity regarding the Word.", testament: "both", status: "reviewed", sources: [scriptureSource("Matthew 28:19; John 1:1; 14:16–17")], tags: ["Father", "Son", "Holy Spirit"] },
  { id: "concept-incarnation", type: "doctrine", label: "Incarnation", description: "The eternal Son truly became human without ceasing to be divine.", testament: "new", status: "reviewed", sources: [scriptureSource("John 1:14; Philippians 2:6–8")], tags: ["Jesus", "Humanity", "Deity"] },
  { id: "person-jesus", type: "person", label: "Jesus Christ", description: "The eternal Son, Creator, revealer of God, incarnate Word, crucified and risen Lord.", testament: "both", status: "approved", sources: [scriptureSource("John 1:1–18")], tags: ["Messiah", "Son of God", "Word"] },
  { id: "person-john-baptist", type: "person", label: "John the Baptist", description: "The prophetic witness sent to testify concerning the Light and prepare the way for Jesus.", testament: "new", status: "reviewed", sources: [scriptureSource("John 1:6–8, 19–34")], tags: ["Witness", "Prophet", "Baptism"] },
  { id: "event-creation", type: "event", label: "Creation of the world", description: "God creates and orders the heavens and earth by His command.", testament: "old", status: "approved", sources: [scriptureSource("Genesis 1:1–2:3")], tags: ["Beginning", "God", "Humanity"] },
  { id: "event-incarnation", type: "event", label: "The Word becomes flesh", description: "The eternal Son enters human history as Jesus Christ.", testament: "new", status: "reviewed", sources: [scriptureSource("John 1:14; Luke 1:26–38")], tags: ["Incarnation", "Jesus", "Glory"] },
  { id: "covenant-new", type: "covenant", label: "New Covenant", description: "God promises forgiveness, transformed hearts, and covenant relationship fulfilled through Christ.", testament: "both", status: "draft", sources: [scriptureSource("Jeremiah 31:31–34; Luke 22:20; Hebrews 8")], tags: ["Forgiveness", "Heart", "Jesus"] },
  { id: "prophecy-messenger", type: "prophecy", label: "The messenger prepares the way", description: "Isaiah and Malachi anticipate a messenger who prepares the Lord's way; the Gospels identify John the Baptist in this role.", testament: "both", status: "reviewed", sources: [scriptureSource("Isaiah 40:3; Malachi 3:1; John 1:23")], tags: ["John the Baptist", "Fulfillment", "Messiah"] },
  { id: "trail-logos", type: "trail", label: "Rabbit Trail: The Word", description: "A guided trail through creation, revelation, incarnation, and glory.", href: "/emmaus/trails/logos", testament: "both", status: "approved", tags: ["Rabbit Trail", "John 1"] },
];

export const knowledgeEdges: KnowledgeEdge[] = [
  { id: "john1-in-book", from: "verse-john-1-1", to: "book-john", relationship: "belongs to", reciprocalLabel: "contains", explanation: "John 1:1 belongs to the Gospel of John.", confidence: "explicit", status: "approved", sources: [scriptureSource("John 1:1")] },
  { id: "john1-in-chapter", from: "verse-john-1-1", to: "chapter-john-1", relationship: "belongs to", reciprocalLabel: "contains", explanation: "John 1:1 opens John chapter 1.", confidence: "explicit", status: "approved", sources: [scriptureSource("John 1:1")] },
  { id: "genesis1-in-book", from: "chapter-genesis-1", to: "book-genesis", relationship: "belongs to", reciprocalLabel: "contains", explanation: "Genesis 1 is the opening chapter of Genesis.", confidence: "explicit", status: "approved" },
  { id: "john1-names-logos", from: "verse-john-1-1", to: "concept-logos", relationship: "names", explanation: "John uses Logos, translated Word, as a title for the one later identified as Jesus Christ.", confidence: "explicit", status: "approved", sources: [scriptureSource("John 1:1, 14–18")] },
  { id: "john1-echoes-genesis", from: "verse-john-1-1", to: "verse-genesis-1-1", relationship: "echoes", explanation: "John's opening words deliberately recall Genesis and frame the Word in relation to creation.", confidence: "strong", status: "reviewed", sources: [scriptureSource("Genesis 1:1; John 1:1")] },
  { id: "john1-reveals-trinity", from: "verse-john-1-1", to: "concept-trinity", relationship: "contributes to", explanation: "The Word is distinguished from God and identified as God, contributing to Trinitarian doctrine.", confidence: "strong", status: "reviewed", sources: [scriptureSource("John 1:1")], reviewNote: "Do not claim John 1:1 alone fully defines the doctrine." },
  { id: "logos-identifies-jesus", from: "concept-logos", to: "person-jesus", relationship: "identifies", explanation: "John 1:14–18 identifies the eternal Word as the incarnate Son revealed in Jesus Christ.", confidence: "explicit", status: "approved", sources: [scriptureSource("John 1:14–18")] },
  { id: "logos-opens-trail", from: "concept-logos", to: "trail-logos", relationship: "opens", explanation: "The Logos concept launches a guided Emmaus Rabbit Trail.", confidence: "explicit", status: "approved" },
  { id: "creation-begins-genesis", from: "concept-creation", to: "verse-genesis-1-1", relationship: "introduced in", explanation: "Genesis 1 introduces God's creation of the heavens and earth through divine speech.", confidence: "explicit", status: "approved", sources: [scriptureSource("Genesis 1:1–3")] },
  { id: "creation-developed-colossians", from: "concept-creation", to: "verse-colossians-1-15", relationship: "developed in", explanation: "Colossians describes all things as created through and for Christ.", confidence: "explicit", status: "approved", sources: [scriptureSource("Colossians 1:15–17")] },
  { id: "creation-developed-hebrews", from: "concept-creation", to: "verse-hebrews-1-1", relationship: "developed in", explanation: "Hebrews links the Son with God's speech and the making of the world.", confidence: "explicit", status: "approved", sources: [scriptureSource("Hebrews 1:1–3")] },
  { id: "creation-event", from: "concept-creation", to: "event-creation", relationship: "expressed in", explanation: "The theme of creation is grounded in the biblical creation account.", confidence: "explicit", status: "approved" },
  { id: "genesis-introduces-light", from: "verse-genesis-1-1", to: "concept-light", relationship: "introduces", explanation: "Light is the first created reality explicitly called forth by God.", confidence: "explicit", status: "approved", sources: [scriptureSource("Genesis 1:3")] },
  { id: "light-joined-life", from: "concept-light", to: "concept-life", relationship: "joined with", explanation: "John connects life in the Word with light for humanity.", confidence: "explicit", status: "approved", sources: [scriptureSource("John 1:4")] },
  { id: "life-in-jesus", from: "concept-life", to: "person-jesus", relationship: "resides in", explanation: "John presents life as intrinsic to Christ.", confidence: "explicit", status: "approved", sources: [scriptureSource("John 1:4; 5:26")] },
  { id: "trinity-clarifies-jesus", from: "concept-trinity", to: "person-jesus", relationship: "clarifies identity", explanation: "The Son is personally distinct from the Father and fully divine.", confidence: "strong", status: "reviewed" },
  { id: "john14-incarnation", from: "verse-john-1-14", to: "concept-incarnation", relationship: "teaches", explanation: "John 1:14 explicitly states that the Word became flesh.", confidence: "explicit", status: "approved", sources: [scriptureSource("John 1:14")] },
  { id: "incarnation-event", from: "concept-incarnation", to: "event-incarnation", relationship: "expressed in", explanation: "The doctrine of incarnation refers to the historical coming of the Son in human flesh.", confidence: "explicit", status: "reviewed" },
  { id: "incarnation-jesus", from: "event-incarnation", to: "person-jesus", relationship: "centers on", explanation: "Jesus Christ is the incarnate Word.", confidence: "explicit", status: "approved", sources: [scriptureSource("John 1:14") ] },
  { id: "john-baptist-fulfills", from: "person-john-baptist", to: "prophecy-messenger", relationship: "fulfills", explanation: "John identifies himself as the voice preparing the Lord's way.", confidence: "explicit", status: "reviewed", sources: [scriptureSource("John 1:23; Isaiah 40:3")] },
  { id: "revelation-word-title", from: "verse-revelation-19-13", to: "concept-logos", relationship: "reuses title", explanation: "Revelation again calls the victorious Christ the Word of God.", confidence: "explicit", status: "reviewed", sources: [scriptureSource("Revelation 19:13")] },
  { id: "john1-arche", from: "verse-john-1-1", to: "word-arche", relationship: "contains word", explanation: "John begins with the Greek phrase en archē, in the beginning.", confidence: "explicit", status: "draft", sources: [scriptureSource("John 1:1")] },
];

export function getKnowledgeNode(id: string) {
  return knowledgeNodes.find((node) => node.id === id) ?? null;
}

export function getConnectedKnowledge(id: string, options?: { approvedOnly?: boolean }) {
  return knowledgeEdges.flatMap((edge) => {
    if (options?.approvedOnly && edge.status !== "approved") return [];
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

export function searchKnowledge(query: string, options?: { type?: KnowledgeNodeType; status?: ReviewStatus; testament?: Testament }) {
  const needle = query.trim().toLowerCase();
  return knowledgeNodes.filter((node) => {
    if (options?.type && node.type !== options.type) return false;
    if (options?.status && node.status !== options.status) return false;
    if (options?.testament && node.testament !== options.testament && node.testament !== "both") return false;
    if (!needle) return true;
    return [node.label, node.description, node.reference, node.book, ...(node.tags ?? [])]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(needle));
  });
}

export function getGraphStats() {
  const byType = knowledgeNodes.reduce<Record<string, number>>((counts, node) => {
    counts[node.type] = (counts[node.type] ?? 0) + 1;
    return counts;
  }, {});
  const byStatus = knowledgeEdges.reduce<Record<string, number>>((counts, edge) => {
    const status = edge.status ?? "draft";
    counts[status] = (counts[status] ?? 0) + 1;
    return counts;
  }, {});
  return { nodes: knowledgeNodes.length, edges: knowledgeEdges.length, byType, byStatus };
}

export function validateKnowledgeGraph() {
  const nodeIds = new Set(knowledgeNodes.map((node) => node.id));
  const duplicateNodeIds = knowledgeNodes.filter((node, index, list) => list.findIndex((item) => item.id === node.id) !== index).map((node) => node.id);
  const orphanEdges = knowledgeEdges.filter((edge) => !nodeIds.has(edge.from) || !nodeIds.has(edge.to));
  const unsourcedApprovedEdges = knowledgeEdges.filter((edge) => edge.status === "approved" && (!edge.sources || edge.sources.length === 0) && edge.relationship !== "belongs to" && edge.relationship !== "opens");
  return { duplicateNodeIds, orphanEdges, unsourcedApprovedEdges, valid: duplicateNodeIds.length === 0 && orphanEdges.length === 0 && unsourcedApprovedEdges.length === 0 };
}
