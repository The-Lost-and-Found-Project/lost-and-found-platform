export type MinistryAction = { label: string; description: string; href: string; icon: string; external?: boolean };
export type MinistryPortal = {
  slug: string; title: string; eyebrow: string; description: string; purpose: string; scripture: string; icon: string;
  status: "active" | "building"; welcome: string; actions: MinistryAction[]; rhythms: string[]; resourceTopics: string[];
  experienceTitle: string; experienceDescription: string; accent: "warm" | "steel" | "ink"; primaryLabel: string;
};

export const ministryPortals: MinistryPortal[] = [
  {
    slug: "hearth", title: "The Hearth", eyebrow: "Gather & Belong", icon: "🔥", status: "active", accent: "warm", primaryLabel: "Come to the table",
    description: "A place for connection, encouragement, hospitality, and life together in Christ.",
    purpose: "Helping people move from isolation toward genuine Christian community, shared life, and practical care.", scripture: "Romans 12:10–13",
    welcome: "The Hearth is the relational front porch of L&F: a place to be known, encourage others, show hospitality, and build the kind of community that continues between scheduled gatherings.",
    experienceTitle: "Belong before you have it all figured out.", experienceDescription: "The Hearth emphasizes presence, hospitality, encouragement, and noticing people. Start with a gathering, a conversation, a praise, or a prayer need.",
    actions: [
      { label: "Find a Gathering", description: "See gatherings and shared events across L&F.", href: "/events", icon: "◫" },
      { label: "Community", description: "Connect through the existing L&F community space.", href: "/community", icon: "◇" },
      { label: "Share a Praise", description: "Celebrate what God is doing in everyday life.", href: "/praise", icon: "✦" },
      { label: "Ask for Prayer", description: "Let the community help carry a real need.", href: "/prayer/new", icon: "♡" },
    ],
    rhythms: ["Gather regularly", "Practice hospitality", "Notice who may be isolated", "Encourage one another", "Carry needs in prayer"],
    resourceTopics: ["Biblical community", "Hospitality", "Encouragement", "Healthy relationships", "Caring for one another"],
  },
  {
    slug: "cooking-with-christ", title: "Cooking with Christ", eyebrow: "Serve & Gather", icon: "♨", status: "active", accent: "warm", primaryLabel: "Pull up a chair",
    description: "Food, fellowship, practical service, and intentional opportunities to share the love and hope of Christ around the table.",
    purpose: "Using the simple act of preparing and sharing food to serve people well, build genuine relationships, create Christian community, and make room for conversations about Jesus.", scripture: "1 Peter 4:9–10",
    welcome: "Cooking with Christ begins with something ordinary: a meal. Preparing food together creates room to serve, talk, laugh, listen, welcome people, and demonstrate the kind of hospitality Scripture calls believers to practice.",
    experienceTitle: "More than a meal. A table with purpose.", experienceDescription: "The food matters because people matter. Cooking with Christ brings practical service and Christian hospitality together so a shared table can become a place of belonging, encouragement, prayer, and Gospel-centered relationship.",
    actions: [
      { label: "Serve With Us", description: "Explore ways to help prepare, serve, welcome, clean up, or support a gathering.", href: "/volunteer", icon: "✦" },
      { label: "Find a Gathering", description: "See L&F gatherings and opportunities to come to the table.", href: "/events", icon: "◫" },
      { label: "Ask for Prayer", description: "Let L&F help carry what is happening beyond the table.", href: "/prayer", icon: "♡" },
      { label: "Support the Work", description: "Help L&F provide meals, ingredients, supplies, and opportunities to serve more people.", href: "/give", icon: "◇" },
    ],
    rhythms: ["Prepare with care", "Welcome without pretense", "Share the table", "Listen before speaking", "Serve practical needs", "Make room for Christ-centered conversation"],
    resourceTopics: ["Biblical hospitality", "Serving others", "Food and fellowship", "Christian community", "Evangelism through relationship"],
  },
  {
    slug: "foundry", title: "The Foundry", eyebrow: "Form & Serve", icon: "⚒", status: "active", accent: "steel", primaryLabel: "Enter the work",
    description: "A place for spiritual formation, equipping, service, and becoming useful in the work God has prepared.",
    purpose: "Helping people develop durable faith through discipleship, practice, service, and purposeful growth.", scripture: "Ephesians 2:10",
    welcome: "The Foundry is about formation with purpose. We do not grow merely to know more; we grow so Christ increasingly shapes how we live, work, serve, lead, and respond to people.",
    experienceTitle: "Formation should produce faithful action.", experienceDescription: "The Foundry emphasizes practice. Learn something true, apply it, serve someone, invite accountability, then return and refine.",
    actions: [
      { label: "Take a Next Step", description: "Use the discipleship pathway to identify an area for growth.", href: "/pathway", icon: "→" },
      { label: "Find Resources", description: "Explore practical resources already available in L&F.", href: "/resources", icon: "▦" },
      { label: "Serve", description: "Explore ways to put faith into practice through service.", href: "/volunteer", icon: "✦" },
      { label: "Pray Before You Go", description: "Keep service rooted in dependence on God.", href: "/prayer", icon: "♡" },
    ],
    rhythms: ["Learn truth", "Practice what you learn", "Invite accountability", "Serve someone", "Reflect and refine"],
    resourceTopics: ["Spiritual disciplines", "Calling and purpose", "Serving well", "Leadership", "Faith at work and home"],
  },
  {
    slug: "mens-study", title: "Men's Study", eyebrow: "Study & Walk", icon: "▰", status: "active", accent: "ink", primaryLabel: "Open the Word",
    description: "Scripture-centered study where men can learn, discuss, apply, and walk out God's Word together.",
    purpose: "Creating a clear path from reading Scripture to understanding it, discussing it honestly, and living it faithfully.", scripture: "Proverbs 27:17",
    welcome: "Men's Study is designed around Scripture, honest conversation, and application. The goal is not to collect answers but to become men who understand God's Word and increasingly live what it says.",
    experienceTitle: "Read carefully. Speak honestly. Walk it out.", experienceDescription: "Men's Study is intentionally study-first. Emmaus provides the deeper Scripture tools; this portal supplies the group context, gatherings, resources, prayer, and accountability around that study.",
    actions: [
      { label: "Open Emmaus", description: "Launch Emmaus using your L&F account and dig deeper into Scripture.", href: "/auth/emmaus?next=/study", icon: "▤" },
      { label: "Study Resources", description: "Use available teaching and discipleship resources.", href: "/resources", icon: "▦" },
      { label: "Gatherings", description: "See the shared schedule for upcoming study gatherings.", href: "/events", icon: "◫" },
      { label: "Prayer", description: "Carry one another beyond the study table.", href: "/prayer", icon: "♡" },
    ],
    rhythms: ["Read the text", "Observe before assuming", "Ask the right questions", "Discuss honestly", "Apply specifically", "Follow up with one another"],
    resourceTopics: ["Bible study", "Biblical manhood", "Marriage and family", "Integrity", "Work and purpose", "Brotherhood"],
  },
];

export function getMinistryPortal(slug: string) { return ministryPortals.find((ministry) => ministry.slug === slug); }
