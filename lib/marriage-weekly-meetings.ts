/** A shared preparation guide for the couple's weekly pastoral meeting. */
export const marriageWeeklyMeetings: Record<number, {heading:string; preparation:string[]; agenda:string[]}> = {
  7: {
    heading: 'Week 1 — Listening and communication',
    preparation: [
      'Together choose one conversation that went better this week and name what helped.',
      'Agree on one communication difficulty you both feel comfortable discussing.',
      'Choose one listening habit to practice next week.',
    ],
    agenda: ['Open in prayer and read James 1:19–20.', 'Discuss progress without comparing private journal answers.', 'Practice a gentle opening and agree on a next step.'],
  },
  14: {
    heading: 'Week 2 — Family and ministry priorities',
    preparation: [
      'Review your family calendar and identify one protected time together.',
      'Decide which ministry responsibilities can be delayed or delegated.',
      'Bring one practical newborn or blended-family support need to discuss.',
    ],
    agenda: ['Read Philippians 2:3–4 and discuss practical care.', 'Review boundaries and support needs without assigning blame.', 'Agree on one family-protecting action for the coming week.'],
  },
  21: {
    heading: 'Week 3 — Trust and next steps',
    preparation: [
      'Each person names one personal behavior they are working to change.',
      'Together choose a sustainable daily habit and weekly check-in.',
      'Decide whether an optional thirty-day follow-up or qualified outside support would help.',
    ],
    agenda: ['Read Colossians 3:12–17 and give thanks for specific growth.', 'Distinguish repentance and consistent change from instant restored trust.', 'Agree on a voluntary thirty-day plan and follow-up date.'],
  },
};
export const marriageMeetingPrivacy = 'Bring only what both spouses freely agree to discuss. Individual journal entries and trauma histories are not required. If either person reports fear, threats, or coercion, stop joint exercises and arrange appropriate private support.';
