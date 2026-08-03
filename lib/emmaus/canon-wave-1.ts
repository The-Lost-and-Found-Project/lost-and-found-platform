export type CanonWavePathway =
  | "Identity of God"
  | "Identity of Jesus"
  | "Creation"
  | "Covenant"
  | "Kingdom"
  | "Temple"
  | "Sacrifice"
  | "Prayer"
  | "Wisdom"
  | "Discipleship"
  | "Holy Spirit"
  | "Church"
  | "Mission"
  | "Hope";

export type CanonWavePassage = {
  id: string;
  reference: string;
  title: string;
  pathway: CanonWavePathway;
  secondaryPathways: CanonWavePathway[];
  priority: "critical" | "high" | "normal";
  wave: 1 | 2 | 3;
  testament: "old" | "new";
  dnaStatus: "not-started" | "draft" | "review" | "approved";
  completeness: number;
  workstreams: Array<"Text" | "Language" | "Context" | "Connections" | "Formation" | "Editorial">;
};

const P = (reference: string, title: string, pathway: CanonWavePathway, secondaryPathways: CanonWavePathway[], priority: CanonWavePassage["priority"], wave: CanonWavePassage["wave"], testament: CanonWavePassage["testament"]): CanonWavePassage => ({
  id: reference.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
  reference,
  title,
  pathway,
  secondaryPathways,
  priority,
  wave,
  testament,
  dnaStatus: "not-started",
  completeness: 0,
  workstreams: ["Text", "Connections", "Formation", "Editorial"],
});

export const canonWave1Passages: CanonWavePassage[] = [
  P("Genesis 1:1–3", "In the Beginning", "Creation", ["Identity of God", "Identity of Jesus", "Holy Spirit"], "critical", 1, "old"),
  P("Genesis 1:26–28", "Made in God's Image", "Creation", ["Identity of God", "Discipleship", "Mission"], "critical", 1, "old"),
  P("Genesis 2:1–3", "God Rested", "Creation", ["Wisdom", "Discipleship"], "high", 2, "old"),
  P("Genesis 2:15–25", "Work, Covenant, and Marriage", "Creation", ["Covenant", "Discipleship"], "high", 2, "old"),
  P("Genesis 3:1–19", "The Fall", "Creation", ["Sacrifice", "Hope"], "critical", 1, "old"),
  P("Genesis 3:15", "The First Promise", "Hope", ["Identity of Jesus", "Sacrifice"], "critical", 1, "old"),
  P("Genesis 6:5–9", "Noah Found Grace", "Covenant", ["Identity of God", "Hope"], "high", 2, "old"),
  P("Genesis 9:8–17", "The Covenant with Noah", "Covenant", ["Creation", "Hope"], "critical", 1, "old"),
  P("Genesis 12:1–3", "Blessing to the Nations", "Mission", ["Covenant", "Kingdom"], "critical", 1, "old"),
  P("Genesis 15:1–6", "Abram Believed God", "Covenant", ["Hope", "Discipleship"], "critical", 1, "old"),
  P("Genesis 22:1–18", "The Lord Will Provide", "Sacrifice", ["Covenant", "Identity of Jesus"], "critical", 1, "old"),
  P("Exodus 3:1–15", "I AM", "Identity of God", ["Mission", "Covenant"], "critical", 1, "old"),
  P("Exodus 12:1–14", "The Passover", "Sacrifice", ["Covenant", "Identity of Jesus"], "critical", 1, "old"),
  P("Exodus 14:10–31", "The Red Sea", "Hope", ["Identity of God", "Mission"], "high", 2, "old"),
  P("Exodus 19:3–6", "A Kingdom of Priests", "Kingdom", ["Mission", "Covenant"], "critical", 1, "old"),
  P("Exodus 20:1–17", "The Ten Commandments", "Covenant", ["Discipleship", "Identity of God"], "critical", 1, "old"),
  P("Exodus 25:1–9", "Make Me a Sanctuary", "Temple", ["Covenant", "Identity of God"], "critical", 1, "old"),
  P("Exodus 34:5–7", "The Name and Character of God", "Identity of God", ["Covenant", "Hope"], "critical", 1, "old"),
  P("Leviticus 16:1–34", "The Day of Atonement", "Sacrifice", ["Temple", "Identity of Jesus"], "critical", 1, "old"),
  P("Leviticus 19:1–18", "Be Holy", "Discipleship", ["Identity of God", "Covenant"], "high", 2, "old"),
  P("Deuteronomy 6:4–9", "Love the Lord", "Discipleship", ["Identity of God", "Covenant"], "critical", 1, "old"),
  P("Deuteronomy 18:15–19", "A Prophet Like Moses", "Identity of Jesus", ["Mission", "Hope"], "high", 2, "old"),
  P("Joshua 1:1–9", "Be Strong and Courageous", "Discipleship", ["Mission", "Hope"], "high", 2, "old"),
  P("1 Samuel 8:4–22", "Israel Demands a King", "Kingdom", ["Covenant", "Discipleship"], "high", 2, "old"),
  P("2 Samuel 7:8–16", "The Davidic Covenant", "Covenant", ["Kingdom", "Identity of Jesus"], "critical", 1, "old"),
  P("1 Kings 8:22–30", "Solomon's Temple Prayer", "Temple", ["Prayer", "Covenant"], "high", 2, "old"),
  P("Psalm 1", "The Way of the Righteous", "Wisdom", ["Discipleship", "Hope"], "critical", 1, "old"),
  P("Psalm 2", "The Lord's Anointed King", "Kingdom", ["Identity of Jesus", "Hope"], "critical", 1, "old"),
  P("Psalm 22", "The Suffering Righteous One", "Sacrifice", ["Identity of Jesus", "Hope"], "critical", 1, "old"),
  P("Psalm 23", "The Lord Is My Shepherd", "Identity of God", ["Prayer", "Hope"], "critical", 1, "old"),
  P("Psalm 27", "Wait for the Lord", "Prayer", ["Hope", "Discipleship"], "critical", 1, "old"),
  P("Psalm 51", "Create in Me a Clean Heart", "Prayer", ["Sacrifice", "Discipleship"], "critical", 1, "old"),
  P("Psalm 103:1–14", "The Compassion of God", "Identity of God", ["Prayer", "Hope"], "high", 2, "old"),
  P("Psalm 110", "Priest and King", "Identity of Jesus", ["Kingdom", "Sacrifice"], "critical", 1, "old"),
  P("Proverbs 1:1–7", "The Beginning of Wisdom", "Wisdom", ["Discipleship", "Identity of God"], "critical", 1, "old"),
  P("Proverbs 3:1–12", "Trust in the Lord", "Wisdom", ["Discipleship", "Prayer"], "high", 2, "old"),
  P("Ecclesiastes 12:9–14", "Fear God", "Wisdom", ["Discipleship", "Hope"], "high", 2, "old"),
  P("Isaiah 6:1–8", "Holy, Holy, Holy", "Identity of God", ["Mission", "Temple"], "critical", 1, "old"),
  P("Isaiah 9:1–7", "A Child Is Born", "Identity of Jesus", ["Kingdom", "Hope"], "critical", 1, "old"),
  P("Isaiah 40:1–11", "Prepare the Way", "Hope", ["Identity of God", "Mission"], "critical", 1, "old"),
  P("Isaiah 53", "The Suffering Servant", "Sacrifice", ["Identity of Jesus", "Hope"], "critical", 1, "old"),
  P("Jeremiah 31:31–34", "The New Covenant", "Covenant", ["Hope", "Identity of Jesus"], "critical", 1, "old"),
  P("Ezekiel 36:22–28", "A New Heart and Spirit", "Holy Spirit", ["Covenant", "Hope"], "critical", 1, "old"),
  P("Ezekiel 37:1–14", "The Valley of Dry Bones", "Hope", ["Holy Spirit", "Mission"], "high", 2, "old"),
  P("Daniel 7:9–14", "The Son of Man Receives the Kingdom", "Kingdom", ["Identity of Jesus", "Hope"], "critical", 1, "old"),
  P("Micah 6:6–8", "What the Lord Requires", "Discipleship", ["Identity of God", "Mission"], "high", 2, "old"),
  P("Matthew 5:1–16", "Blessed and Sent", "Discipleship", ["Kingdom", "Mission"], "critical", 1, "new"),
  P("Matthew 6:5–15", "When You Pray", "Prayer", ["Discipleship", "Kingdom"], "critical", 1, "new"),
  P("Matthew 16:13–20", "Who Do You Say I Am?", "Identity of Jesus", ["Church", "Kingdom"], "critical", 1, "new"),
  P("Matthew 22:34–40", "The Greatest Commandments", "Discipleship", ["Identity of God", "Mission"], "critical", 1, "new"),
  P("Matthew 28:16–20", "The Great Commission", "Mission", ["Identity of God", "Discipleship"], "critical", 1, "new"),
  P("Mark 1:14–20", "The Kingdom Is Near", "Kingdom", ["Discipleship", "Mission"], "critical", 1, "new"),
  P("Mark 8:27–38", "Take Up Your Cross", "Discipleship", ["Identity of Jesus", "Sacrifice"], "critical", 1, "new"),
  P("Luke 4:16–21", "Good News to the Poor", "Mission", ["Kingdom", "Holy Spirit"], "critical", 1, "new"),
  P("Luke 15:11–32", "The Lost Son", "Identity of God", ["Hope", "Mission"], "critical", 1, "new"),
  P("Luke 22:14–20", "The New Covenant Meal", "Covenant", ["Sacrifice", "Identity of Jesus"], "critical", 1, "new"),
  P("John 1:1–18", "The Word Became Flesh", "Identity of Jesus", ["Creation", "Temple", "Mission"], "critical", 1, "new"),
  P("John 3:1–21", "Born Again", "Holy Spirit", ["Hope", "Identity of Jesus"], "critical", 1, "new"),
  P("John 4:19–26", "Worship in Spirit and Truth", "Prayer", ["Holy Spirit", "Identity of Jesus"], "high", 2, "new"),
  P("John 10:1–18", "The Good Shepherd", "Identity of Jesus", ["Hope", "Discipleship"], "critical", 1, "new"),
  P("John 11:17–44", "The Resurrection and the Life", "Hope", ["Identity of Jesus", "Prayer"], "critical", 1, "new"),
  P("John 13:1–17", "Jesus Washes the Disciples' Feet", "Discipleship", ["Identity of Jesus", "Church"], "critical", 1, "new"),
  P("John 14:1–17", "The Way, Truth, Life, and Helper", "Identity of Jesus", ["Holy Spirit", "Hope"], "critical", 1, "new"),
  P("John 15:1–17", "Abide in Me", "Discipleship", ["Church", "Mission"], "critical", 1, "new"),
  P("John 17:1–26", "Jesus Prays for His People", "Prayer", ["Church", "Mission"], "critical", 1, "new"),
  P("John 20:24–31", "Believe and Have Life", "Hope", ["Identity of Jesus", "Mission"], "critical", 1, "new"),
  P("Acts 1:1–11", "You Will Be My Witnesses", "Mission", ["Holy Spirit", "Hope"], "critical", 1, "new"),
  P("Acts 2:1–47", "Pentecost and the New Community", "Holy Spirit", ["Church", "Mission"], "critical", 1, "new"),
  P("Acts 4:23–31", "The Church Prays for Boldness", "Prayer", ["Mission", "Holy Spirit"], "high", 2, "new"),
  P("Romans 3:21–26", "Justified by Grace", "Sacrifice", ["Covenant", "Hope"], "critical", 1, "new"),
  P("Romans 5:1–11", "Peace with God", "Hope", ["Sacrifice", "Identity of God"], "critical", 1, "new"),
  P("Romans 8:1–17", "No Condemnation and Life in the Spirit", "Holy Spirit", ["Hope", "Discipleship"], "critical", 1, "new"),
  P("Romans 8:18–39", "Nothing Can Separate Us", "Hope", ["Creation", "Identity of God"], "critical", 1, "new"),
  P("Romans 12:1–21", "A Living Sacrifice", "Discipleship", ["Church", "Mission"], "critical", 1, "new"),
  P("1 Corinthians 11:17–34", "The Lord's Supper", "Church", ["Covenant", "Sacrifice"], "high", 2, "new"),
  P("1 Corinthians 12:4–27", "One Body, Many Members", "Church", ["Holy Spirit", "Discipleship"], "critical", 1, "new"),
  P("1 Corinthians 13", "The Way of Love", "Discipleship", ["Church", "Mission"], "critical", 1, "new"),
  P("1 Corinthians 15:1–28", "Christ Raised", "Hope", ["Identity of Jesus", "Kingdom"], "critical", 1, "new"),
  P("2 Corinthians 5:14–21", "A New Creation and Ministry of Reconciliation", "Mission", ["Creation", "Church"], "critical", 1, "new"),
  P("Galatians 3:23–4:7", "From Slavery to Sonship", "Covenant", ["Identity of Jesus", "Hope"], "critical", 1, "new"),
  P("Galatians 5:13–26", "Walk by the Spirit", "Holy Spirit", ["Discipleship", "Church"], "critical", 1, "new"),
  P("Ephesians 2:1–22", "Saved by Grace, Built Together", "Church", ["Hope", "Temple"], "critical", 1, "new"),
  P("Ephesians 4:1–16", "Unity and Maturity", "Church", ["Discipleship", "Mission"], "high", 2, "new"),
  P("Philippians 2:1–11", "The Mind of Christ", "Identity of Jesus", ["Discipleship", "Sacrifice"], "critical", 1, "new"),
  P("Colossians 1:15–23", "Christ Supreme", "Identity of Jesus", ["Creation", "Church"], "critical", 1, "new"),
  P("1 Thessalonians 4:13–18", "The Hope of Resurrection", "Hope", ["Church", "Identity of Jesus"], "high", 2, "new"),
  P("2 Timothy 3:14–17", "God-Breathed Scripture", "Discipleship", ["Mission", "Wisdom"], "critical", 1, "new"),
  P("Hebrews 1:1–4", "God Has Spoken by His Son", "Identity of Jesus", ["Creation", "Hope"], "critical", 1, "new"),
  P("Hebrews 4:14–16", "Our Great High Priest", "Sacrifice", ["Prayer", "Identity of Jesus"], "critical", 1, "new"),
  P("Hebrews 8:1–13", "Mediator of a Better Covenant", "Covenant", ["Temple", "Identity of Jesus"], "critical", 1, "new"),
  P("Hebrews 10:19–25", "Draw Near and Hold Fast", "Church", ["Sacrifice", "Hope"], "high", 2, "new"),
  P("Hebrews 11", "By Faith", "Hope", ["Discipleship", "Covenant"], "critical", 1, "new"),
  P("James 1:2–27", "Doers of the Word", "Wisdom", ["Discipleship", "Hope"], "critical", 1, "new"),
  P("1 Peter 2:4–12", "A Holy Priesthood", "Church", ["Temple", "Mission"], "critical", 1, "new"),
  P("1 Peter 3:8–18", "Hope in Suffering", "Hope", ["Discipleship", "Mission"], "high", 2, "new"),
  P("1 John 1:5–2:2", "Walk in the Light", "Discipleship", ["Identity of God", "Sacrifice"], "critical", 1, "new"),
  P("1 John 4:7–21", "God Is Love", "Identity of God", ["Church", "Discipleship"], "critical", 1, "new"),
  P("Revelation 5", "The Lamb Is Worthy", "Identity of Jesus", ["Sacrifice", "Kingdom"], "critical", 1, "new"),
  P("Revelation 7:9–17", "Every Nation Before the Throne", "Mission", ["Hope", "Kingdom"], "high", 2, "new"),
  P("Revelation 19:11–16", "King of Kings", "Kingdom", ["Identity of Jesus", "Hope"], "critical", 1, "new"),
  P("Revelation 21:1–5", "All Things New", "Hope", ["Creation", "Kingdom"], "critical", 1, "new"),
  P("Revelation 21:22–22:5", "God Dwells with His People", "Temple", ["Hope", "Creation"], "critical", 1, "new"),
];

export function getCanonWaveSummary(passages: CanonWavePassage[] = canonWave1Passages) {
  const pathwayCounts = passages.reduce<Record<string, number>>((counts, passage) => {
    counts[passage.pathway] = (counts[passage.pathway] ?? 0) + 1;
    return counts;
  }, {});
  return {
    total: passages.length,
    oldTestament: passages.filter((passage) => passage.testament === "old").length,
    newTestament: passages.filter((passage) => passage.testament === "new").length,
    critical: passages.filter((passage) => passage.priority === "critical").length,
    waveOne: passages.filter((passage) => passage.wave === 1).length,
    pathwayCounts,
  };
}

export function getNextCanonAssignments(limit = 12) {
  return [...canonWave1Passages]
    .filter((passage) => passage.dnaStatus !== "approved")
    .sort((a, b) => {
      const priority = { critical: 3, high: 2, normal: 1 };
      return priority[b.priority] - priority[a.priority] || a.wave - b.wave || a.completeness - b.completeness;
    })
    .slice(0, limit);
}
