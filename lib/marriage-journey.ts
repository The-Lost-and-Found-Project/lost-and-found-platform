export const marriageSessions = [
["Listening Is an Act of Love","James 1:19-20; Proverbs 18:13","Listen before responding. Hearing your spouse is an act of love, not a concession in an argument.","What makes you feel truly heard?","Take turns speaking for five minutes while the listener reflects back what was heard."],
["Why Do We React So Strongly?","Proverbs 4:23; Psalm 139:23-24","Strong reactions sometimes reflect past experiences. Invite God to search your heart without blaming your spouse for your response.","What situations make you defensive, and what helps you feel grounded?","Name a trigger without requiring disclosure of painful details."],
["Speaking Truth Without Causing Harm","Ephesians 4:15,25-32","Truth and love belong together. Honest words can be clear without becoming cruel.","How does your tone change when you feel misunderstood?","Replace accusations with: When this happens, I feel... and I need..."],
["When Conflict Becomes a Battle","Proverbs 15:1; Romans 12:18","Conflict is not a contest to win. Seek peace without ignoring important issues or personal safety.","How can you recognize when a conversation needs a pause?","Agree on a 20-minute break and a specific time to return."],
["Intentions and Impact","Philippians 2:3-4; 1 Corinthians 13:4-7","Good intentions do not erase painful consequences. Christlike humility listens to how our choices affect others.","When have good intentions still left someone feeling alone?","Acknowledge one impact without adding an excuse."],
["Understanding Your Spouse's Needs","Romans 12:10; 1 Peter 3:7","Love pays attention to the actual person in front of us rather than assuming what they need.","What emotional, practical, and spiritual support is most important right now?","Each partner names two needs; choose one practical response."],
["Our Communication Covenant","Colossians 3:12-15; Ephesians 4:29","Healthy communication grows through repeated habits of patience, truthfulness, and repair.","What words or behaviors should never be part of your disagreements?","Write three shared commitments, including no threats or weaponizing Scripture."],
["Becoming One Flesh","Genesis 2:18-25; Matthew 19:4-6","Marriage is a covenant of shared life and mutual faithfulness, not the loss of individual dignity.","Where do you still operate as separate teams?","Name one decision to make together this week."],
["God's Calling and Family Responsibilities","Ephesians 5:25-33; Mark 7:9-13","Serving God never gives us permission to use ministry as an excuse for neglecting those entrusted to our care.","When does outside service crowd out your family?","Review ministry commitments and agree on protected family time."],
["Leadership That Looks Like Jesus","Mark 10:42-45; John 13:1-17","Jesus rejected domineering leadership and modeled humble service. Scripture must never be used to justify coercion.","What does sacrificial service look like in your home?","Each partner chooses one act of practical service."],
["Expectations We Never Discussed","Philippians 2:3-4; Proverbs 20:5","Unspoken expectations can become silent resentments. Bring them into the light with kindness.","What have you assumed about chores, finances, parenting, or time?","Discuss one expectation without demanding instant agreement."],
["Recovery and Healthy Boundaries","Galatians 6:2-5; Luke 5:15-16","Compassionate ministry requires wise limits. No one person can meet every need, and rest is not unfaithfulness.","Which ministry requests need a backup plan?","Identify a backup contact and clear limits for non-emergency requests."],
["Becoming a Family","Deuteronomy 6:4-9; Ephesians 6:4","Children need consistency, care, and security. A blended family grows through patience rather than forced closeness.","How can every child experience belonging?","Plan one predictable family routine."],
["Protecting Our Marriage in a New Season","Ecclesiastes 3:1-8; Philippians 2:4","A new baby changes capacity. Faithfulness in this season may look like rest, meals, shared care, and fewer outside commitments.","What support will be needed after the baby arrives?","Make a newborn support plan for sleep, meals, visitors, and ministry boundaries."],
["Your Past and Your Future","Psalm 34:18; Romans 12:2","God is near to the brokenhearted. Healing can involve time, safe relationships, and skilled professional support.","What old pattern would you like to respond to differently?","Choose one grounding practice; do not pressure one another to recount trauma."],
["Forgiveness and Rebuilding Trust","Ephesians 4:31-32; Luke 17:3-4","Forgiveness and restored trust are not identical. Repentance includes changed behavior, and reconciliation cannot be coerced.","What specific action would help rebuild reliability?","Offer a specific apology and name a measurable change."],
["When Ministry Becomes Our Identity","Luke 10:38-42; John 15:4-5","Your worth rests in Christ, not in how urgently others need you. Abiding comes before doing.","When does being needed feel like being valuable?","Choose one ministry request to delegate or decline."],
["Creating Emotional Safety","Romans 12:9-10; Colossians 3:12-14","Safety includes being able to disagree without intimidation, retaliation, or shame. Joint exercises should stop if anyone feels unsafe.","What helps you speak honestly without fear?","Agree on two boundaries for respectful disagreement."],
["Praying as Husband and Wife","Philippians 4:6-7; 1 Peter 3:7","Prayer is an invitation to bring needs before God, never a tool for correcting or embarrassing a spouse.","What would you like prayer for this week?","Offer brief prayers of thanks, confession, and request without preaching at each other."],
["Weathering Difficult Seasons","Matthew 7:24-27; Ecclesiastes 4:9-12","Jesus calls us to build on obedience to his words. Lasting habits matter when life is exhausting.","Which practice would make your marriage more resilient?","Choose daily, weekly, and monthly connection rhythms."],
["Choosing Each Other, Choosing Christ","Joshua 24:15; Colossians 3:12-17","A marriage centered on Christ is strengthened through ongoing repentance, patience, service, and love.","What has changed, and what still needs support?","Write one personal commitment and one shared 30-day goal."],
].map(([title,scripture,teaching,discussion,practice], index) => ({title,scripture,teaching,discussion,practice,week: Math.floor(index/7)+1}));


// The milestone review is intentionally self-directed. No mentor can access
// these responses until separate enrollment and explicit sharing exist.
export const marriageMilestones: Record<number, { title: string; questions: string[]; practice: string }> = {
  7: {
    title: "Communication review",
    questions: [
      "When did I listen well this week, and when did I interrupt or withdraw?",
      "What helps us disagree without fear, contempt, or pressure?",
      "Which one communication habit will I practice for the next seven days?",
    ],
    practice: "Create a brief communication covenant. Each spouse may pause or decline a conversation that feels unsafe.",
  },
  14: {
    title: "Family and ministry review",
    questions: [
      "Did our family receive the time and attention we promised?",
      "What responsibilities or ministry requests need clearer boundaries?",
      "What practical support will help us welcome the new baby and care for every child?",
    ],
    practice: "Agree on protected family time, a backup ministry contact, and a realistic newborn support plan.",
  },
  21: {
    title: "Thirty-day covenant review",
    questions: [
      "Where have I seen God change my responses and priorities?",
      "Where do we still need wise support or professional help?",
      "What two small habits will we revisit together in thirty days?",
    ],
    practice: "Schedule a thirty-day follow-up. Choose one daily connection practice and one weekly planning conversation.",
  },
};
