/**
 * Scripture-first men's Bible study pilot. Public-to-participants prompts only.
 * No copyrighted verse text, private answers, or facilitator notes in this module.
 */
export type DiscoveryCard={id:string;phase:string;question:string;detail:string;minutes:number;passage?:string};
export const JAMES_DISCOVERY_CARDS:readonly DiscoveryCard[]=[
 {id:"remember",phase:"Reconnect",question:"What stayed with you from James 1:1–4?",detail:"One honest observation is enough.",minutes:6},
 {id:"read",phase:"Read Scripture",question:"James 1:5–8",detail:"Listen once. Read again. Mark what stands out.",minutes:6,passage:"James 1:5–8"},
 {id:"observe",phase:"Discover Quietly",question:"What does James actually say?",detail:"Find a command, a truth about God, and a difficult phrase.",minutes:5},
 {id:"pairs",phase:"Explore in Pairs",question:"What question do you most want to investigate?",detail:"Compare your discoveries. Choose one real question.",minutes:10},
 {id:"group",phase:"Investigate Together",question:"Where do you see that in the passage?",detail:"Listen to the questions. Follow the verses. Invite another view.",minutes:16},
 {id:"clarify",phase:"Clarify",question:"What have we discovered about God and ourselves?",detail:"Test our conclusions against James 1:5–8.",minutes:8},
 {id:"respond",phase:"Respond",question:"Where do you need wisdom this week?",detail:"Choose one faithful next step. Sharing is optional.",minutes:6},
 {id:"preview",phase:"Prepare",question:"Read James 1:9–12 for next time.",detail:"What determines a man's worth when circumstances change?",minutes:3}
];
export const DISCOVERY_PILOT_ID="james-002-discovery-v1";
