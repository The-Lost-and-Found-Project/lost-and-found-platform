export type EmmausSurfaceId = "learn" | "mentor" | "groups" | "church" | "builder" | "scholar" | "api";

export type EmmausRole = "learner" | "mentor" | "group_leader" | "church_admin" | "builder" | "scholar" | "developer" | "admin";

export type EmmausSurface = {
  id: EmmausSurfaceId;
  name: string;
  tagline: string;
  description: string;
  href: string;
  icon: string;
  roles: EmmausRole[];
  status: "live" | "foundation" | "planned";
  capabilities: string[];
  coreSystems: string[];
};

export const emmausCoreSystems = [
  "Biblical Knowledge Graph",
  "Biblical Reasoning Engine",
  "Question Router",
  "Socratic Dialogue Engine",
  "Discipleship Graph",
  "Memory System",
  "Journey Orchestrator",
  "Content Lifecycle",
] as const;

export const emmausSurfaces: EmmausSurface[] = [
  {
    id: "learn",
    name: "Emmaus Learn",
    tagline: "Walk with Christ through His Word.",
    description: "The individual learner experience for Discoveries, Verse Workspaces, Rabbit Trails, assessment, memory, and adaptive next steps.",
    href: "/emmaus/walk",
    icon: "📖",
    roles: ["learner", "mentor", "group_leader", "church_admin", "builder", "scholar", "developer", "admin"],
    status: "live",
    capabilities: ["Adaptive Discoveries", "Verse Workspace", "Rabbit Trails", "Journey and Timeline", "Learning Profile"],
    coreSystems: ["Biblical Knowledge Graph", "Socratic Dialogue Engine", "Discipleship Graph", "Memory System", "Journey Orchestrator"],
  },
  {
    id: "mentor",
    name: "Emmaus Mentor",
    tagline: "Shepherd the journey, not the score.",
    description: "A mentoring workspace for unresolved questions, growth invitations, prayer connections, and conversation-first interventions.",
    href: "/emmaus/mentor",
    icon: "🤝",
    roles: ["mentor", "group_leader", "church_admin", "admin"],
    status: "live",
    capabilities: ["Learner overview", "Mentor plans", "Suggested questions", "Prayer context", "Conversation overrides"],
    coreSystems: ["Discipleship Graph", "Memory System", "Journey Orchestrator"],
  },
  {
    id: "groups",
    name: "Emmaus Groups",
    tagline: "Discover Scripture together.",
    description: "A shared study environment for small groups, classes, and cohorts using the same Discovery content with leader-guided discussion.",
    href: "/emmaus/groups",
    icon: "👥",
    roles: ["group_leader", "church_admin", "admin"],
    status: "foundation",
    capabilities: ["Cohort studies", "Leader prompts", "Shared questions", "Group prayer", "Participation insights"],
    coreSystems: ["Socratic Dialogue Engine", "Content Lifecycle", "Journey Orchestrator"],
  },
  {
    id: "church",
    name: "Emmaus Church",
    tagline: "A discipleship framework for the whole church.",
    description: "Church-wide administration for pathways, mentors, groups, approved curriculum, and ministry-level discipleship insights.",
    href: "/emmaus/church",
    icon: "⛪",
    roles: ["church_admin", "admin"],
    status: "foundation",
    capabilities: ["Church pathways", "Mentor oversight", "Group administration", "Curriculum approvals", "Privacy-aware reporting"],
    coreSystems: ["Content Lifecycle", "Discipleship Graph", "Journey Orchestrator"],
  },
  {
    id: "builder",
    name: "Emmaus Builder",
    tagline: "Author guided discovery without writing code.",
    description: "Founder and curriculum-author tools for research, composition, graph curation, adaptive dialogue, review, preview, and publishing.",
    href: "/emmaus/admin/composer",
    icon: "🛠️",
    roles: ["builder", "church_admin", "admin"],
    status: "live",
    capabilities: ["Canon Engine", "Curriculum Studio", "Discovery Composer", "Graph Library", "Editorial lifecycle"],
    coreSystems: ["Biblical Knowledge Graph", "Biblical Reasoning Engine", "Content Lifecycle"],
  },
  {
    id: "scholar",
    name: "Emmaus Scholar",
    tagline: "Expand the graph with reviewed, sourced contributions.",
    description: "A contributor environment for proposing nodes, relationships, lexical insights, historical context, and theological review notes.",
    href: "/emmaus/scholar",
    icon: "🎓",
    roles: ["scholar", "builder", "admin"],
    status: "foundation",
    capabilities: ["Contribution proposals", "Source attribution", "Peer review", "Confidence ratings", "Versioned graph changes"],
    coreSystems: ["Biblical Knowledge Graph", "Content Lifecycle"],
  },
  {
    id: "api",
    name: "Emmaus API",
    tagline: "Trusted access to the Emmaus Core.",
    description: "A future integration surface for approved organizations to query graph relationships, reasoning paths, and published Discovery content.",
    href: "/emmaus/api",
    icon: "🔌",
    roles: ["developer", "admin"],
    status: "planned",
    capabilities: ["Graph queries", "Published Discoveries", "Reasoning paths", "Scoped organization access", "Audit logging"],
    coreSystems: ["Biblical Knowledge Graph", "Biblical Reasoning Engine", "Content Lifecycle"],
  },
];

export function getSurfacesForRole(role: EmmausRole) {
  return emmausSurfaces.filter((surface) => surface.roles.includes(role));
}

export function getEmmausSurface(id: EmmausSurfaceId) {
  return emmausSurfaces.find((surface) => surface.id === id) ?? null;
}
