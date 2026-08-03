export type RabbitTrailStep = {
  label: string;
  eyebrow: string;
  title: string;
  reference: string;
  text: string;
  clue: string;
  question: string;
  body?: string;
};

export type RabbitTrail = {
  slug: string;
  title: string;
  subtitle: string;
  sourceReference: string;
  returnHref: string;
  growthAreas: string[];
  steps: RabbitTrailStep[];
};

export const rabbitTrails: Record<string, RabbitTrail> = {
  logos: {
    slug: "logos",
    title: "The Word — Logos",
    subtitle: "Follow the title through creation, revelation, incarnation, and glory.",
    sourceReference: "John 1:1",
    returnHref: "/emmaus/discovery/demo?returnFrom=logos",
    growthAreas: ["Observation", "Biblical Connections", "Christology"],
    steps: [
      {
        label: "Start",
        eyebrow: "Rabbit Trail",
        title: "Why does John call Jesus ‘the Word’?",
        body: "Read each passage before opening the clue. The goal is to return to John 1:1 with sharper observations.",
        reference: "John 1:1",
        text: "In the beginning was the Word, and the Word was with God, and the Word was God.",
        clue: "A word makes what is unseen or unspoken known. John chose this title before naming Jesus.",
        question: "Write two reasons ‘the Word’ could be an appropriate title for Jesus.",
      },
      {
        label: "Creation",
        eyebrow: "Connection 1",
        title: "God creates through speech",
        reference: "Genesis 1:1–3",
        text: "In the beginning God created the heaven and the earth... And God said, Let there be light: and there was light.",
        clue: "Genesis presents divine speech as active and effective. God speaks, and reality responds.",
        question: "How does Genesis 1 help you understand John’s claim that all things were made through the Word?",
      },
      {
        label: "Revelation",
        eyebrow: "Connection 2",
        title: "God has spoken through His Son",
        reference: "Hebrews 1:1–3",
        text: "God... hath in these last days spoken unto us by his Son... by whom also he made the worlds; who being the brightness of his glory, and the express image of his person...",
        clue: "Hebrews joins two ideas: the Son reveals God and the Son participated in creation.",
        question: "What does this passage add to the idea that Jesus is God’s Word rather than merely a messenger carrying words?",
      },
      {
        label: "Image",
        eyebrow: "Connection 3",
        title: "The invisible God made known",
        reference: "Colossians 1:15–17",
        text: "Who is the image of the invisible God... For by him were all things created... and by him all things consist.",
        clue: "An image makes something visible. Paul connects Christ’s revelation of God with His authority over creation.",
        question: "How are ‘Word’ and ‘image’ similar ways of describing what Jesus reveals about God?",
      },
      {
        label: "Incarnation",
        eyebrow: "Connection 4",
        title: "The Word became flesh",
        reference: "John 1:14, 18",
        text: "And the Word was made flesh, and dwelt among us... No man hath seen God at any time; the only begotten Son... he hath declared him.",
        clue: "John identifies the Word through incarnation: the eternal revealer entered human history and made God known.",
        question: "Why is the incarnation essential to John’s use of ‘the Word’? What could humanity know because the Word became flesh?",
      },
      {
        label: "Glory",
        eyebrow: "Connection 5",
        title: "The title returns at the end",
        reference: "Revelation 19:13, 16",
        text: "And he was clothed with a vesture dipped in blood: and his name is called The Word of God... KING OF KINGS, AND LORD OF LORDS.",
        clue: "The title is not limited to Jesus’ earthly ministry. Revelation uses it for the victorious, reigning Christ.",
        question: "How does Revelation expand your understanding of the Word from revelation and creation to judgment and kingship?",
      },
      {
        label: "Return",
        eyebrow: "Return to the Discovery",
        title: "Read John 1:1 again",
        reference: "John 1:1",
        text: "In the beginning was the Word, and the Word was with God, and the Word was God.",
        clue: "A strong Rabbit Trail returns you to the original passage with better questions and clearer observations.",
        question: "What do you now see in John 1:1 that you did not see before following this trail?",
      },
    ],
  },
};

export function getRabbitTrail(slug: string) {
  return rabbitTrails[slug] ?? null;
}
