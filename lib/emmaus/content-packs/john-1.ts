import type { DialogueDepth, DialogueMove } from "@/lib/emmaus/socratic-dialogue";
import type { DiscipleshipSkillId } from "@/lib/emmaus/discipleship-graph";

export type EmmausContentPack = {
  id: string;
  title: string;
  book: string;
  chapter: number;
  status: "draft" | "reviewed" | "approved";
  description: string;
  discoveries: EmmausDiscoveryContent[];
  rabbitTrails: EmmausRabbitTrailContent[];
  mentorGuide: EmmausMentorGuide;
  groupGuide: EmmausGroupGuide;
};

export type EmmausDiscoveryContent = {
  id: string;
  title: string;
  passage: string;
  sourceNodeId: string;
  subtitle: string;
  estimatedMinutes: number;
  defaultDepth: DialogueDepth;
  skillFocus: DiscipleshipSkillId[];
  objectives: string[];
  dialogueMoves: DialogueMove[];
  openingQuestion: string;
  probingQuestions: string[];
  clues: string[];
  graphConnectionIds: string[];
  applicationPrompt: string;
  journalPrompt: string;
  openingPrayer: string;
  closingPrayer: string;
};

export type EmmausRabbitTrailContent = {
  id: string;
  title: string;
  startingPassage: string;
  theme: string;
  stops: Array<{ passage: string; question: string; purpose: string }>;
};

export type EmmausMentorGuide = {
  watchFor: string[];
  conversationPrompts: string[];
  prayerPrompts: string[];
};

export type EmmausGroupGuide = {
  sessionMinutes: number;
  flow: Array<{ segment: string; minutes: number; instructions: string }>;
  discussionQuestions: string[];
  leaderGuardrails: string[];
};

export const john1ContentPack: EmmausContentPack = {
  id: "john-1-content-pack-v1",
  title: "John 1 — The Word Came Near",
  book: "John",
  chapter: 1,
  status: "reviewed",
  description: "A passage-first content pack covering the eternal Word, creation, incarnation, witness, identity, and response in John 1.",
  discoveries: [
    {
      id: "john-1-1-eternal-word",
      title: "The Eternal Word",
      passage: "John 1:1",
      sourceNodeId: "verse-john-1-1",
      subtitle: "Discover what John claims about the Word before creation begins.",
      estimatedMinutes: 45,
      defaultDepth: "deep",
      skillFocus: ["observe", "connect", "probe", "test", "theology"],
      objectives: [
        "Identify John's three explicit claims about the Word.",
        "Distinguish personal relationship from divine identity.",
        "Connect John's opening with Genesis without flattening either passage.",
        "Form a text-supported conclusion about Christ's identity.",
      ],
      dialogueMoves: ["observe", "clarify", "connect", "probe", "test", "reflect", "apply", "summarize"],
      openingQuestion: "What does John say about when the Word existed, whom the Word was with, and who the Word was?",
      probingQuestions: [
        "Why does John repeat the word ‘was’ three times?",
        "What error would result from emphasizing ‘with God’ but ignoring ‘was God’—or the reverse?",
        "How does Genesis 1:1–3 sharpen your reading of John's opening words?",
      ],
      clues: [
        "Separate the time statement, relationship statement, and identity statement.",
        "Do not resolve the tension by deleting either distinction or deity.",
      ],
      graphConnectionIds: ["john1-echoes-genesis", "john1-names-logos", "john1-reveals-trinity"],
      applicationPrompt: "Where have you treated Jesus as less authoritative, present, or trustworthy than this verse requires?",
      journalPrompt: "Write one concise conclusion about the Word, cite the phrase that supports it, and preserve one question you still have.",
      openingPrayer: "Father, slow me down before Your Word. Help me see what John actually says, resist easy assumptions, and know Christ more faithfully. Amen.",
      closingPrayer: "Father, deepen my trust in Jesus as the eternal and fully divine Word. Let this truth shape my worship, confidence, and obedience. Amen.",
    },
    {
      id: "john-1-3-through-him",
      title: "Through Him All Things",
      passage: "John 1:2–5",
      sourceNodeId: "verse-john-1-3",
      subtitle: "Trace creation, life, and light through the person of Christ.",
      estimatedMinutes: 40,
      defaultDepth: "growing",
      skillFocus: ["connect", "context", "reflect", "apply"],
      objectives: [
        "Observe the relationship between the Word and creation.",
        "Trace John's movement from creation to life to light.",
        "Compare John 1 with Colossians 1 and Hebrews 1.",
      ],
      dialogueMoves: ["observe", "connect", "probe", "reflect", "apply", "summarize"],
      openingQuestion: "What does John say came into being through the Word, and what does he say was in Him?",
      probingQuestions: [
        "How does the phrase ‘without him was not any thing made’ strengthen the claim?",
        "Why might John connect life with light?",
        "What do Colossians 1:15–17 and Hebrews 1:1–3 add?",
      ],
      clues: ["Follow the sequence: creation → life → light.", "Notice the universal language: all things, not anything."],
      graphConnectionIds: ["creation-developed-colossians", "creation-developed-hebrews", "light-joined-life"],
      applicationPrompt: "What area of your life are you trying to sustain apart from the One through whom all things hold together?",
      journalPrompt: "Describe how John's movement from creation to life to light changes your view of Jesus.",
      openingPrayer: "Creator God, open my eyes to see the glory of Christ in creation, life, and light. Amen.",
      closingPrayer: "Lord Jesus, teach me to receive life from You and walk in Your light. Amen.",
    },
    {
      id: "john-1-14-word-became-flesh",
      title: "The Word Became Flesh",
      passage: "John 1:14–18",
      sourceNodeId: "verse-john-1-14",
      subtitle: "Explore the incarnation, glory, grace, and revelation of God in Jesus.",
      estimatedMinutes: 50,
      defaultDepth: "deep",
      skillFocus: ["observe", "theology", "reflect", "apply"],
      objectives: [
        "Identify what changed and what did not when the Word became flesh.",
        "Examine the meaning of dwelling among us.",
        "Connect glory, grace, truth, and revelation in the passage.",
      ],
      dialogueMoves: ["observe", "clarify", "connect", "probe", "test", "reflect", "apply", "summarize"],
      openingQuestion: "What does John claim happened to the Word, and what did people behold as a result?",
      probingQuestions: [
        "Does ‘became flesh’ mean the Word stopped being divine? What in the passage prevents that conclusion?",
        "What does the language of dwelling suggest about God's presence?",
        "How does verse 18 explain Jesus' role in making God known?",
      ],
      clues: ["Read ‘became flesh’ together with verse 1.", "Watch the movement from presence to glory to revelation."],
      graphConnectionIds: ["john14-incarnation", "incarnation-event", "incarnation-jesus"],
      applicationPrompt: "How should God's willingness to come near reshape the way you approach Him and others?",
      journalPrompt: "Write about one way the incarnation corrects a distant or abstract view of God.",
      openingPrayer: "God who came near, help me behold the glory of Christ with humility and wonder. Amen.",
      closingPrayer: "Jesus, full of grace and truth, make the Father known in my life and form Your character in me. Amen.",
    },
  ],
  rabbitTrails: [
    {
      id: "logos-creation-to-glory",
      title: "The Word — From Creation to Glory",
      startingPassage: "John 1:1",
      theme: "Logos",
      stops: [
        { passage: "Genesis 1:1–3", question: "What connection does John expect you to hear?", purpose: "Creation echo" },
        { passage: "Psalm 33:6", question: "How is creation connected to God's word?", purpose: "Divine speech" },
        { passage: "Hebrews 1:1–3", question: "How does the Son reveal and sustain?", purpose: "Revelation and creation" },
        { passage: "Colossians 1:15–17", question: "What does ‘through Him and for Him’ add?", purpose: "Christ-centered creation" },
        { passage: "John 1:14", question: "How does the eternal Word enter human history?", purpose: "Incarnation" },
        { passage: "Revelation 19:13–16", question: "How does the title return at the climax of Scripture?", purpose: "Glory and kingship" },
      ],
    },
  ],
  mentorGuide: {
    watchFor: [
      "Learner collapses ‘with God’ and ‘was God’ into the same idea.",
      "Learner rushes to Trinity terminology without first observing the text.",
      "Learner collects cross-references without explaining their relevance.",
      "Learner applies quickly but avoids unresolved theological questions.",
    ],
    conversationPrompts: [
      "Which phrase in John 1 is doing the most work in your conclusion?",
      "What conclusion did you revise after comparing another passage?",
      "What question are you still carrying, and what would faithful patience look like?",
    ],
    prayerPrompts: [
      "Pray for deeper trust in Christ's identity and authority.",
      "Pray that knowledge becomes worship and obedience.",
    ],
  },
  groupGuide: {
    sessionMinutes: 75,
    flow: [
      { segment: "Opening prayer and reading", minutes: 10, instructions: "Read John 1:1–18 aloud twice in different voices." },
      { segment: "Individual observation", minutes: 10, instructions: "Members mark repeated words, claims, and questions without consulting notes." },
      { segment: "Group discovery", minutes: 20, instructions: "Work through observation and connection questions before teaching commentary." },
      { segment: "Rabbit Trail", minutes: 15, instructions: "Compare Genesis 1:1–3, Hebrews 1:1–3, and Colossians 1:15–17." },
      { segment: "Reflection and application", minutes: 15, instructions: "Move from Christ's identity to worship, trust, and obedience." },
      { segment: "Closing prayer", minutes: 5, instructions: "Pray directly from the truths the group discovered." },
    ],
    discussionQuestions: [
      "What did you notice that you had previously read past?",
      "Which connection most strengthened your understanding of Jesus?",
      "Where did the group need to slow down and test a conclusion?",
      "What specific response does this passage call for this week?",
    ],
    leaderGuardrails: [
      "Do not lecture before the group has observed the text.",
      "Do not force consensus on questions the passage does not fully resolve.",
      "Keep Scripture primary and label theological synthesis clearly.",
    ],
  },
};

export function getJohn1Discovery(id: string) {
  return john1ContentPack.discoveries.find((discovery) => discovery.id === id) ?? null;
}
