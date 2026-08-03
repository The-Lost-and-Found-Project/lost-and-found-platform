import { createPassageDna, type PassageDna } from "@/lib/emmaus/passage-dna";

const dna = createPassageDna({
  id: "john-1-1-dna-v1",
  reference: "John 1:1",
  sourceNodeId: "verse-john-1-1",
  title: "The Eternal Word",
});

const sectionData: Record<keyof PassageDna["sections"], Record<string, unknown>> = {
  canon: {
    book: "John",
    chapter: 1,
    verses: "1",
    testament: "New Testament",
    genre: "Gospel prologue",
    section: "John 1:1–18",
    speaker: "John the Evangelist",
    audience: "The Gospel's first readers and all later readers",
  },
  literary: {
    structure: [
      "In the beginning was the Word",
      "The Word was with God",
      "The Word was God",
    ],
    features: [
      "Three coordinated clauses",
      "Three uses of the imperfect verb ‘was’",
      "Movement from existence to relationship to identity",
      "Deliberate echo of Genesis 1:1",
    ],
    contrasts: ["Personal distinction without separation", "Divine identity without collapsing persons"],
  },
  observation: {
    observations: [
      "The Word already existed ‘in the beginning.’",
      "The Word was in relationship with God.",
      "The Word is identified as God.",
      "John does not begin with Jesus' birth, ministry, or genealogy.",
      "The verse makes three claims before explaining creation or incarnation.",
    ],
  },
  language: {
    terms: [
      { term: "archē", gloss: "beginning", note: "The phrase echoes Genesis 1:1 and places the Word before creation." },
      { term: "logos", gloss: "word, message, reason", note: "John develops this title through the prologue and identifies the Word with Jesus in verse 14." },
      { term: "ēn", gloss: "was", note: "The repeated imperfect verb presents continuing existence rather than a point of origin." },
      { term: "pros ton theon", gloss: "with God", note: "Expresses personal relationship and distinction." },
      { term: "theos ēn ho logos", gloss: "the Word was God", note: "Affirms the Word's divine nature while preserving the prior distinction." },
    ],
  },
  historical: {
    context: [
      "John writes in a first-century Jewish and Greco-Roman setting.",
      "Jewish readers would hear creation, divine speech, wisdom, and revelation themes.",
      "Greek-speaking readers would recognize logos as a meaningful term, but John's definition is governed by the Gospel itself.",
      "The verse should not be reduced to a single philosophical background theory.",
    ],
  },
  connections: {
    links: [
      { passage: "Genesis 1:1–3", relationship: "explicit verbal and creation echo", confidence: "explicit" },
      { passage: "Psalm 33:6", relationship: "creation through the word of the Lord", confidence: "strong" },
      { passage: "Proverbs 8:22–31", relationship: "wisdom and creation background", confidence: "inferred" },
      { passage: "John 1:3", relationship: "all things made through the Word", confidence: "explicit" },
      { passage: "John 1:14", relationship: "the Word becomes flesh and is identified in history", confidence: "explicit" },
      { passage: "John 20:28–31", relationship: "Thomas confesses Jesus as Lord and God", confidence: "strong" },
      { passage: "Colossians 1:15–17", relationship: "Christ's preexistence and role in creation", confidence: "strong" },
      { passage: "Hebrews 1:1–3", relationship: "the Son reveals God and sustains creation", confidence: "strong" },
      { passage: "Revelation 19:13", relationship: "the title Word of God returns", confidence: "explicit" },
    ],
  },
  theology: {
    claims: [
      { claim: "The Word is eternal and uncreated.", evidence: ["John 1:1", "John 1:3"], confidence: "explicit" },
      { claim: "The Word is personally distinguishable from God the Father.", evidence: ["John 1:1b"], confidence: "explicit" },
      { claim: "The Word fully shares the divine identity.", evidence: ["John 1:1c"], confidence: "explicit" },
      { claim: "John 1:1 contributes directly to historic Christian Trinitarian and Christological doctrine.", evidence: ["John 1:1", "John 1:14", "John 1:18"], confidence: "strong" },
    ],
    alternatives: [
      "Interpretations that make the Word merely created conflict with the verse's opening claim and John 1:3.",
      "Interpretations that erase personal distinction fail to account for ‘with God.’",
    ],
  },
  narrative: {
    storyPlacement: [
      "Creation: the Word exists before all created things.",
      "Revelation: God makes Himself known through the Word.",
      "Incarnation: the eternal Word enters human history in John 1:14.",
      "New creation: John's Gospel presents Jesus as the source of life and light.",
    ],
  },
  formation: {
    skills: ["Observation", "Canonical connection", "Theological synthesis", "Testing conclusions"],
    responses: ["Worship Christ", "Trust His authority", "Read Scripture carefully", "Hold biblical truths together without erasing tension"],
  },
  mentor: {
    questions: [
      "What are the three distinct claims John makes?",
      "Which phrase supports Christ's distinction from the Father?",
      "Which phrase supports His deity?",
      "How does Genesis 1 sharpen your reading without replacing John's own argument?",
      "What conclusion did you reach too quickly, and what evidence should test it?",
    ],
    misconceptions: [
      "Treating the Word as created",
      "Treating ‘with God’ and ‘was God’ as contradictory",
      "Using Trinity terminology before observing the text",
      "Assuming logos means whatever a preferred philosophical source says",
    ],
  },
  group: {
    discussion: [
      "Read John 1:1 aloud three times, emphasizing a different clause each time.",
      "List observations before interpretations.",
      "Compare Genesis 1:1–3, Colossians 1:15–17, and Hebrews 1:1–3.",
      "State one conclusion and identify the exact words supporting it.",
      "Close with worship and a concrete response of trust.",
    ],
    leaderNotes: ["Do not lecture before observation.", "Preserve unresolved questions.", "Keep Scripture primary."],
  },
  discovery: {
    paths: [
      { depth: "foundational", focus: "Three claims about the Word" },
      { depth: "growing", focus: "Genesis echo and creation" },
      { depth: "deep", focus: "Preexistence, distinction, deity, and Christology" },
      { depth: "guide", focus: "Lead another learner through observation and testing" },
    ],
  },
  "rabbit-trails": {
    trails: [
      { title: "The Word — Creation to Glory", stops: ["Genesis 1:1–3", "Psalm 33:6", "John 1:1–14", "Colossians 1:15–17", "Hebrews 1:1–3", "Revelation 19:13"] },
      { title: "Jesus and the Divine Identity", stops: ["Exodus 3:14", "Isaiah 9:6", "John 1:1", "John 8:58", "John 20:28"] },
    ],
  },
  prayer: {
    prompts: [
      "Praise Jesus as eternal and divine.",
      "Confess where you have treated Christ as less authoritative than He is.",
      "Thank God for making Himself known through the Word.",
      "Ask for careful reading, humility, and obedience.",
    ],
  },
  journal: {
    prompts: [
      "Write the three claims of John 1:1 in your own words without weakening any of them.",
      "Which phrase most challenges your current view of Jesus?",
      "What unresolved question should you continue studying?",
      "What specific act of worship or obedience follows from this verse?",
    ],
  },
  assessment: {
    questions: [
      { type: "observation", prompt: "How many times does ‘was’ appear, and what subject follows each use?" },
      { type: "connection", prompt: "What does Genesis 1:1–3 contribute to John's opening?" },
      { type: "interpretation", prompt: "How do ‘with God’ and ‘was God’ work together?" },
      { type: "testing", prompt: "Which verse in the prologue most directly challenges the claim that the Word was created?" },
      { type: "application", prompt: "What must change if Jesus is the eternal divine Word?" },
    ],
  },
  memory: {
    verse: "John 1:1",
    phrases: ["In the beginning was the Word", "the Word was with God", "the Word was God"],
    reviewSchedule: [1, 3, 7, 14, 30, 60],
  },
  atlas: {
    nodes: ["Genesis 1:1–3", "Logos", "Creation", "Deity of Christ", "Trinity", "Incarnation", "Revelation 19:13"],
    layers: ["Canon", "Language", "Theology", "Narrative", "Discipleship", "Church History"],
  },
  ai: {
    questionRules: [
      "Begin with direct observation.",
      "Do not introduce Trinity terminology before the learner identifies distinction and deity.",
      "Offer Genesis 1 as the first canonical clue.",
      "If a learner states a conclusion without evidence, ask for the exact phrase supporting it.",
      "If the learner remains vague, ask them to separate the three clauses.",
      "Stop giving clues once the learner identifies the central claims independently.",
    ],
    rulesModeReady: true,
  },
  editorial: {
    sources: [
      "John 1:1–18",
      "Genesis 1:1–3",
      "Colossians 1:15–17",
      "Hebrews 1:1–3",
      "Revelation 19:13",
    ],
    reviewers: ["Text reviewer", "Greek-language reviewer", "Theological reviewer", "Formation reviewer"],
    confidence: "reviewed draft",
    releaseNotes: "Initial complete Passage DNA production record for rules-first Emmaus v1.",
  },
};

for (const [sectionId, data] of Object.entries(sectionData)) {
  const section = dna.sections[sectionId as keyof PassageDna["sections"]];
  section.data = data;
  section.reviewStatus = sectionId === "editorial" ? "reviewed" : "approved";
}

dna.status = "in-review";
dna.version = 2;
dna.updatedAt = "2026-08-03T00:00:00.000Z";

export const john11PassageDna: PassageDna = dna;
