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
      { label: "Open Emmaus", description: "Launch the dedicated L&F Bible study platform and dig deeper into Scripture.", href: "https://emmaus.lostandfoundproject.org", icon: "▤", external: true },
      { label: "Study Resources", description: "Use available teaching and discipleship resources.", href: "/resources", icon: "▦" },
      { label: "Gatherings", description: "See the shared schedule for upcoming study gatherings.", href: "/events", icon: "◫" },
      { label: "Prayer", description: "Carry one another beyond the study table.", href: "/prayer", icon: "♡" },
    ],
    rhythms: ["Read the text", "Observe before assuming", "Ask the right questions", "Discuss honestly", "Apply specifically", "Follow up with one another"],
    resourceTopics: ["Bible study", "Biblical manhood", "Marriage and family", "Integrity", "Work and purpose", "Brotherhood"],
  },
];

export function getMinistryPortal(slug: string) { return ministryPortals.find((ministry) => ministry.slug === slug); }
