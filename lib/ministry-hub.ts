export type MinistryPortal = {
  slug: string;
  title: string;
  eyebrow: string;
  description: string;
  purpose: string;
  scripture: string;
  icon: string;
  status: "active" | "building";
  modules: string[];
};

export const ministryPortals: MinistryPortal[] = [
  {
    slug: "hearth",
    title: "The Hearth",
    eyebrow: "Gather & Belong",
    description: "A place for connection, encouragement, hospitality, and life together in Christ.",
    purpose: "Helping people move from isolation toward genuine Christian community, shared life, and practical care.",
    scripture: "Romans 12:10–13",
    icon: "🔥",
    status: "building",
    modules: ["Overview", "Gatherings", "Resources", "Announcements", "Community"],
  },
  {
    slug: "foundry",
    title: "The Foundry",
    eyebrow: "Form & Serve",
    description: "A place for spiritual formation, equipping, service, and becoming useful in the work God has prepared.",
    purpose: "Helping people develop durable faith through discipleship, practice, service, and purposeful growth.",
    scripture: "Ephesians 2:10",
    icon: "⚒",
    status: "building",
    modules: ["Overview", "Pathways", "Resources", "Serve", "Announcements"],
  },
  {
    slug: "mens-study",
    title: "Men's Study",
    eyebrow: "Study & Walk",
    description: "Scripture-centered study where men can learn, discuss, apply, and walk out God's Word together.",
    purpose: "Creating a clear path from reading Scripture to understanding it, discussing it honestly, and living it faithfully.",
    scripture: "Proverbs 27:17",
    icon: "▰",
    status: "building",
    modules: ["Overview", "Current Study", "Schedule", "Resources", "Discussion"],
  },
];

export function getMinistryPortal(slug: string) {
  return ministryPortals.find((ministry) => ministry.slug === slug);
}
