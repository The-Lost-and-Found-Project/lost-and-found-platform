export type Devotion = {
  day: number;
  title: string;
  verseRef: string;
  teaser: string;
  scripture: string;
  teachingPoint: string;
  story: string;
  application: string;
  reflectionQuestions: string[];
  prayer: string;
};

// The Lost and Found Project's "7-Day Devotional Journey" — originally built
// as a custom embed on the Hostinger marketing site. Moved in-app so it can
// live behind sign-in alongside the rest of the community content, with the
// same look and feel as the other member pages instead of the marketing
// site's separate black/gold styling.
export const devotions: Devotion[] = [
  {
    day: 1,
    title: "God Sees You",
    verseRef: "Genesis 16:13",
    teaser:
      "When life makes you feel invisible, God sees your pain, your story, and your future.",
    scripture:
      "Thereafter, Hagar used another name to refer to the Lord, who had spoken to her. She said, “You are the God who sees me.”",
    teachingPoint:
      "Hagar was alone, wounded, and running from a painful situation. Yet in the wilderness, God met her personally. He did not overlook her. Genesis 16:13 teaches us that God is El Roi, the God who sees. This means God sees with compassion, knowledge, and care.",
    story:
      "Think about someone who shows up for everyone else but feels forgotten when they are hurting. They smile, keep working, help family, and answer texts, but inside they feel unseen. Hagar’s story speaks directly to that place. God saw her in the wilderness, not after everything was fixed.",
    application:
      "Today, pause before trying to prove your worth to anyone. Bring God the part of your life that feels hidden, ignored, or dismissed. Ask Him to help you trust His care even when people do not understand your pain.",
    reflectionQuestions: [
      "Where do you feel unseen right now?",
      "How does it change your perspective to know God sees with compassion?",
      "What burden do you need to honestly bring before Him today?",
    ],
    prayer:
      "Lord, thank You for being the God who sees me. Help me stop believing I am forgotten. Meet me in the wilderness places of my life and lead me with Your grace. Amen.",
  },
  {
    day: 2,
    title: "You Are Not Too Far Gone",
    verseRef: "Luke 15:20",
    teaser:
      "The Father’s heart is not cold toward the returning child; He runs with compassion.",
    scripture:
      "So he returned home to his father. And while he was still a long way off, his father saw him coming. Filled with love and compassion, he ran to his son, embraced him, and kissed him.",
    teachingPoint:
      "The prodigal son wasted his inheritance and hit the lowest point of his life. He planned to return as a servant, but his father welcomed him as a son. Luke 15:20 reveals the heart of God toward repentance. God is not reluctant to receive the broken.",
    story:
      "Many people assume they have messed up too badly to come back to God. They think, “I should have known better,” or “God must be tired of me.” But Jesus showed that the Father’s heart is full of mercy. The son came home rehearsing shame, but the father answered with embrace.",
    application:
      "Identify one area where shame has kept you distant from God. Instead of hiding, return. Confess honestly. Receive grace humbly. Let the Father define you by relationship, not failure.",
    reflectionQuestions: [
      "What mistake or season has made you feel far from God?",
      "Do you picture God as waiting with anger or compassion?",
      "What would returning to the Father look like today?",
    ],
    prayer:
      "Father, thank You that I am not too far gone for Your mercy. Help me stop running from You. Teach me to receive forgiveness and walk as Your child. Amen.",
  },
  {
    day: 3,
    title: "Strength for Today",
    verseRef: "Isaiah 40:31",
    teaser: "God gives strength that does not depend on perfect circumstances.",
    scripture:
      "But those who trust in the Lord will find new strength. They will soar high on wings like eagles.",
    teachingPoint:
      "Isaiah 40 speaks to weary people who needed to remember the greatness of God. The promise is not that life will never be tiring. The promise is that those who wait on the Lord will be renewed. God gives strength for walking, running, standing, and enduring.",
    story:
      "Some days you do not need a dramatic breakthrough; you need enough strength to get through today faithfully. Maybe you are carrying family pressure, work stress, spiritual discouragement, or emotional exhaustion. God does not shame the weary. He renews them.",
    application:
      "Ask God for strength for today, not the whole year at once. Choose one faithful step: pray, apologize, rest, read Scripture, make the call, or keep going without quitting.",
    reflectionQuestions: [
      "Where are you weary?",
      "What would it look like to wait on the Lord instead of forcing control?",
      "What is one faithful step you can take today?",
    ],
    prayer:
      "Lord, I need Your strength. Renew my heart, steady my mind, and help me walk faithfully today. Teach me to trust You when I feel weak. Amen.",
  },
  {
    day: 4,
    title: "Peace in the Storm",
    verseRef: "Mark 4:39",
    teaser: "Jesus has authority over storms around us and storms within us.",
    scripture:
      "When Jesus woke up, he rebuked the wind and said to the waves, “Silence! Be still!” Suddenly the wind stopped, and there was a great calm.",
    teachingPoint:
      "The disciples panicked because the storm looked stronger than their safety. But Jesus was in the boat. His command revealed His authority over creation and His care for His followers. Peace is not the absence of trouble; peace is the presence and authority of Christ.",
    story:
      "Anxiety can feel like waves hitting from every side: bills, marriage tension, family problems, health concerns, or decisions you cannot control. The storm may be real, but it is not greater than Jesus. He may calm the storm around you, or He may first calm the storm within you.",
    application:
      "Name the storm you are facing. Speak honestly to Jesus about your fear. Then remind your heart: Jesus is present, Jesus is powerful, and Jesus is not panicked.",
    reflectionQuestions: [
      "What storm are you facing right now?",
      "Where have you assumed Jesus is absent because life is hard?",
      "What truth about Jesus do you need to speak over your fear?",
    ],
    prayer:
      "Jesus, speak peace over my storm. Help me trust Your presence and authority. Calm what needs to be calmed around me and within me. Amen.",
  },
  {
    day: 5,
    title: "Grace for the Broken",
    verseRef: "Psalm 34:18",
    teaser: "God does not despise brokenness; He draws near to it.",
    scripture:
      "The Lord is close to the brokenhearted; he rescues those whose spirits are crushed.",
    teachingPoint:
      "Psalm 34:18 gives comfort to people whose hearts are shattered. God is not distant from grief, disappointment, trauma, regret, or loss. He is close to the brokenhearted. His nearness does not always remove pain instantly, but it means pain is never carried alone.",
    story:
      "There are seasons where people say, “Be strong,” but you do not feel strong. You feel crushed. Scripture does not command you to pretend. It invites you to bring your broken heart to the God who comes close.",
    application:
      "Let God meet you honestly today. Do not minimize the pain, and do not let pain define your future. Ask God to rescue your crushed spirit and restore hope one step at a time.",
    reflectionQuestions: [
      "What part of your heart feels broken?",
      "Do you tend to hide pain from God or bring it to Him?",
      "What would receiving God’s nearness look like today?",
    ],
    prayer:
      "Lord, come close to my broken heart. Rescue what feels crushed in me. Help me trust that Your grace is present even here. Amen.",
  },
  {
    day: 6,
    title: "Renewed Mind",
    verseRef: "Romans 12:2",
    teaser: "Lasting transformation begins as God renews the way we think.",
    scripture:
      "Don’t copy the behavior and customs of this world, but let God transform you into a new person by changing the way you think.",
    teachingPoint:
      "Romans 12:2 teaches that transformation is not surface-level behavior change. God changes us by renewing our minds. Old patterns often begin with old thoughts: fear, shame, pride, bitterness, lust, control, or unbelief. Scripture replaces lies with truth.",
    story:
      "A person can leave a bad environment but still carry the same mindset. They may be physically free but mentally trapped by old labels. God’s Word teaches us to challenge the thoughts that do not agree with His truth.",
    application:
      "Write down one thought that has been controlling you. Then write a Scripture-based truth beside it. Practice replacing the lie with God’s truth throughout the day.",
    reflectionQuestions: [
      "What thought pattern needs to be renewed?",
      "What lie have you been agreeing with?",
      "What truth from Scripture will you choose today?",
    ],
    prayer:
      "God, renew my mind. Show me the thoughts that are shaping me in unhealthy ways. Replace lies with Your truth and transform me from the inside out. Amen.",
  },
  {
    day: 7,
    title: "Walking in Hope",
    verseRef: "Romans 15:13",
    teaser:
      "Biblical hope is not wishful thinking; it is confidence in the God who never fails.",
    scripture:
      "I pray that God, the source of hope, will fill you completely with joy and peace because you trust in him.",
    teachingPoint:
      "Romans 15:13 calls God the source of hope. That means hope does not begin with circumstances improving. Hope begins with God Himself. As we trust Him, He fills us with joy and peace through the power of the Holy Spirit.",
    story:
      "Hope can feel hard when you have been disappointed repeatedly. Maybe you prayed and things still hurt. Maybe you tried again and failed. But biblical hope does not deny pain. It declares that pain does not get the final word because God is still faithful.",
    application:
      "Ask God to refill your hope. Choose one area where you will stop declaring defeat and start trusting God’s faithfulness. Take one practical step that agrees with hope.",
    reflectionQuestions: [
      "Where have you lost hope?",
      "What does it mean that God is the source of hope?",
      "What practical step can you take today that agrees with faith?",
    ],
    prayer:
      "God of hope, fill me with joy and peace as I trust in You. Strengthen me by Your Spirit and help me walk forward with confidence in Your faithfulness. Amen.",
  },
];
