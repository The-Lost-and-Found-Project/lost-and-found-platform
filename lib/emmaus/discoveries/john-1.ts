export type DiscoveryStep = "Read" | "Observe" | "Wonder" | "Explore" | "Reflect" | "Pray";

export type DiscoveryPrompt = {
  title: string;
  prompt: string;
  placeholder: string;
};

export type DiscoveryThread = {
  id: string;
  title: string;
  reference: string;
  text: string;
  question: string;
};

export type DiscoveryDefinition = {
  key: string;
  title: string;
  subtitle: string;
  translation: string;
  verses: ReadonlyArray<readonly [number, string]>;
  prompts: {
    observe: DiscoveryPrompt;
    wonder: DiscoveryPrompt;
    reflect: DiscoveryPrompt;
    pray: DiscoveryPrompt;
  };
  threads: DiscoveryThread[];
};

export const johnOneDiscovery: DiscoveryDefinition = {
  key: "john-1",
  title: "John 1:1–18",
  subtitle: "The Word, the Light, and the God who came near.",
  translation: "KJV · Public domain",
  verses: [
    [1, "In the beginning was the Word, and the Word was with God, and the Word was God."],
    [2, "The same was in the beginning with God."],
    [3, "All things were made by him; and without him was not any thing made that was made."],
    [4, "In him was life; and the life was the light of men."],
    [5, "And the light shineth in darkness; and the darkness comprehended it not."],
    [6, "There was a man sent from God, whose name was John."],
    [7, "The same came for a witness, to bear witness of the Light, that all men through him might believe."],
    [8, "He was not that Light, but was sent to bear witness of that Light."],
    [9, "That was the true Light, which lighteth every man that cometh into the world."],
    [10, "He was in the world, and the world was made by him, and the world knew him not."],
    [11, "He came unto his own, and his own received him not."],
    [12, "But as many as received him, to them gave he power to become the sons of God, even to them that believe on his name:"],
    [13, "Which were born, not of blood, nor of the will of the flesh, nor of the will of man, but of God."],
    [14, "And the Word was made flesh, and dwelt among us, and we beheld his glory, the glory as of the only begotten of the Father, full of grace and truth."],
    [15, "John bare witness of him, and cried, saying, This was he of whom I spake, He that cometh after me is preferred before me: for he was before me."],
    [16, "And of his fulness have all we received, and grace for grace."],
    [17, "For the law was given by Moses, but grace and truth came by Jesus Christ."],
    [18, "No man hath seen God at any time; the only begotten Son, which is in the bosom of the Father, he hath declared him."],
  ],
  prompts: {
    observe: {
      title: "What do you actually see?",
      prompt: "Which repeated words, contrasts, claims, or images stand out before you consult any explanation?",
      placeholder: "I notice that John repeats...",
    },
    wonder: {
      title: "Let the text create questions",
      prompt: "Why does John begin with ‘In the beginning,’ and why does he call Jesus ‘the Word’ before naming Him?",
      placeholder: "I wonder whether John wants readers to connect this with...",
    },
    reflect: {
      title: "Name the discovery",
      prompt: "What have you discovered about Jesus in this passage that deserves more attention in your life?",
      placeholder: "Today I saw that Jesus...",
    },
    pray: {
      title: "Turn discovery into prayer",
      prompt: "Praise God for who Jesus is, confess where darkness remains, and ask for grace to walk in His light.",
      placeholder: "Jesus, thank You that...",
    },
  },
  threads: [
    {
      id: "thread-001",
      title: "John 1:1 ⇄ Genesis 1:1",
      reference: "Genesis 1:1",
      text: "In the beginning God created the heaven and the earth.",
      question: "What does John add by placing ‘the Word’ in the beginning with God?",
    },
  ],
};
