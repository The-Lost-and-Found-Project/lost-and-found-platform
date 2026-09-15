-- First approved L&F Bible Study Standard package.
-- Source: ToHaveAndToHold_BibleStudy.pptx; live teaching remains the authoritative facilitator asset.

do $$
declare
  v_study_id uuid;
begin
  insert into public.bible_studies (
    slug,title,subtitle,ministry_eligibility,primary_scripture_refs,supporting_scripture_refs,
    estimated_live_minutes,discussion_prompts,reflection_prompts,variants,scheduling_metadata,status
  ) values (
    'to-have-and-to-hold',
    'To Have and To Hold',
    'Maintaining What God Has Given Us',
    array['general','hearth','foundry']::text[],
    array['1 Thessalonians 5:21','Hebrews 10:23','Mark 10:9','Proverbs 4:23']::text[],
    array['Ecclesiastes 4:9-12','Philippians 4:1','2 Timothy 1:14','Philippians 2:3-4','Galatians 6:9','Matthew 6:24','Joshua 24:15']::text[],
    60,
    '["Where do you see upgrade culture showing up in places it does not belong?","Which of the foundation passages presses on you most right now, and why?","What does holding on look like practically when worse arrives without warning?","Which kind of poverty—attitude, understanding, effort, or spirit—can creep into relationships unnoticed?","Where do you need slow repair instead of reaching for replacement?","What other has begun to compete with your primary commitments to God, spouse, or family?"]'::jsonb,
    '["What has God entrusted to you that needs faithful maintenance rather than novelty?","Where have you confused difficulty with brokenness?","What small act of repair can you practice this week?","What competing voice or priority needs to be put back in its proper place?"]'::jsonb,
    '{"hearth":{"application":"Emphasize covenant faithfulness, home, family, friendship, and relational repair."},"foundry":{"application":"Emphasize steadfast discipleship, responsibility, spiritual discipline, and faithful repair."}}'::jsonb,
    '{"live_target_minutes":60,"live_range_minutes":[55,65],"follow_up_days":14,"anchor":"session_completion","presentation_source":"ToHaveAndToHold_BibleStudy.pptx"}'::jsonb,
    'approved'
  )
  on conflict (slug) do update set
    title=excluded.title,subtitle=excluded.subtitle,ministry_eligibility=excluded.ministry_eligibility,
    primary_scripture_refs=excluded.primary_scripture_refs,supporting_scripture_refs=excluded.supporting_scripture_refs,
    estimated_live_minutes=excluded.estimated_live_minutes,discussion_prompts=excluded.discussion_prompts,
    reflection_prompts=excluded.reflection_prompts,variants=excluded.variants,scheduling_metadata=excluded.scheduling_metadata,status='approved'
  returning id into v_study_id;

  delete from public.bible_study_journey_days where study_id=v_study_id;

  insert into public.bible_study_journey_days
    (study_id,day_number,release_offset_days,kind,title,scripture_refs,teaching,story,reflection_prompt,prayer,challenge,estimated_minutes,sort_order)
  values
  (v_study_id,1,1,'dig_deeper','Hold On to What Is Good',array['1 Thessalonians 5:21','Hebrews 10:23'],
   'Scripture repeatedly uses active verbs for faithfulness: hold on, stand firm, guard. The Christian life is not merely receiving something good from God; it includes learning to keep, cherish, and steward what He has entrusted to us. Holding is not passive possession. It is faithful attention over time.',null,
   'What good gift, relationship, calling, or spiritual practice has God entrusted to you that needs renewed attention?',null,null,5,1),
  (v_study_id,2,2,'live_it','Repair Before Replace',array['Galatians 6:9'],null,null,null,null,
   'Identify one small thing you have been tempted to abandon because it is difficult. Before deciding it is broken, make one faithful act of repair today: a conversation, apology, prayer, boundary, appointment, or practical step.',3,2),
  (v_study_id,3,3,'scripture_focus','Guard What Shapes the Heart',array['Proverbs 4:23','2 Timothy 1:14'],
   'Biblical guarding is active stewardship. We protect what shapes our loves, loyalties, and decisions because neglect can slowly move us away from what is good.',null,
   'What has been getting more access to your heart than it should?',null,null,3,3),
  (v_study_id,4,4,'reflect','Have or Hold?',array['Hebrews 10:23'],null,null,
   'It is easy to celebrate acquiring something and overlook the slower work of maintaining it.',
   'Where in your life have you been more interested in having than holding? What would faithful maintenance look like there?',null,null,3,4),
  (v_study_id,5,5,'real_life','The Washing Machine',array['Galatians 6:9'],
   'The opening story describes a nearly fifty-year-old washing machine that did not need replacing; it needed a minor repair. The point is not that everything must be preserved at any cost. It is that difficulty and brokenness are not always the same thing.',
   'A grandmother refuses the instinct to replace an old appliance simply because it needs attention. Her perspective exposes how quickly an upgrade culture can train us to discard what patient repair could restore.',
   'Where might you be calling something broken when it may actually need wise repair?',null,null,4,5),
  (v_study_id,6,6,'prayer','Pray for Faithful Hands',array['Philippians 4:1'],null,null,null,
   'Father, teach me to stand firm in You. Give me wisdom to know what should be repaired, courage to do the work, humility to ask for help, and discernment to recognize when faithfulness requires a healthy boundary. Keep my heart anchored in Christ. Amen.',null,3,6),
  (v_study_id,7,7,'sabbath_reset','Receive, Do Not Perform',array['Psalm 127:1'],
   'Faithful maintenance is not frantic control. God remains the builder and keeper. Today is a reset: receive His care instead of turning discipleship into another performance metric.',null,
   'What can you entrust to God today instead of trying to force an outcome?',null,'Rest from catch-up. Read the verse, pray briefly, and receive the day as a gift.',2,7),
  (v_study_id,8,8,'go_deeper','When Worse Arrives',array['Ecclesiastes 4:9-12','Hebrews 10:23'],
   'The language “for better or for worse” assumes seasons of pressure will come. Scripture does not promise that faithfulness prevents hardship; it calls us to endure with God and with wise community. Holding on can include prayer, asking for help, counseling, repentance, practical care, and refusing isolation.',null,
   'When hardship arrives, what is your usual instinct: isolate, control, escape, numb, or reach for God and trustworthy people?',null,null,5,8),
  (v_study_id,9,9,'live_it','Practice One Small Faithful Act',array['Philippians 2:3-4'],null,null,null,null,
   'Choose one relationship today and practice a concrete act of faithful attention: listen without fixing, ask a real question, express gratitude, keep a promise, or serve without needing recognition.',3,9),
  (v_study_id,10,10,'scripture_focus','Do Not Grow Weary',array['Galatians 6:9'],
   'Repair often feels unimpressive because it is repetitive. Paul connects perseverance in doing good with a harvest that arrives in the proper time. Faithfulness keeps showing up without demanding immediate results.',null,
   'Where are you most tempted to quit because progress feels slow?',null,null,3,10),
  (v_study_id,11,11,'reflect','Name the Poverty',array['Philippians 2:3-4'],
   'The live study broadens “for richer or poorer” beyond finances: poor attitude, poor understanding, poor work ethic, and poor spirit can quietly impoverish relationships and discipleship.',null,
   'Which form of poverty is most likely to creep into your life unnoticed? What would one step toward spiritual or relational wealth look like?',null,null,3,11),
  (v_study_id,12,12,'real_life','Rehabilitation Takes Repetition',array['Galatians 6:9'],
   'Healing after surgery is rarely completed in the operating room. Rehabilitation happens through repeated exercises, help from others, patience, and time. Relational and spiritual repair often works the same way.',
   'Think about physical rehabilitation: the important exercises can be small, repetitive, and uncomfortable. Their value comes through faithful repetition rather than dramatic intensity.',
   'What repeated practice—not dramatic promise—would support healing or growth in your current season?',null,null,4,12),
  (v_study_id,13,13,'prepare','Forsake the Competitor',array['Matthew 6:24','Joshua 24:15'],
   '“Forsaking all others” reaches beyond romantic fidelity. Competing masters can include career, approval, family pressure, busyness, habits, or relationships that displace devotion to God and covenant responsibilities.',null,
   'What competing priority has been asking for a place in your life that does not belong to it?',null,
   'Make one concrete adjustment before the next gathering that puts God and your primary commitments back in their proper order.',4,13),
  (v_study_id,14,14,'bridge','Carry It Forward',array['1 Thessalonians 5:21','Hebrews 10:23'],
   'Two weeks ago the invitation was to move from merely having to faithfully holding. The goal was never clinging to everything indiscriminately; Scripture calls us to test, discern, hold what is good, and remain anchored to the faithful God who holds us.',null,
   'What is one thing God has shown you during this journey that you want to carry into the next gathering?',
   'Father, thank You for what You have entrusted to me. Give me discernment to hold what is good, grace to repair what can be repaired, courage to release what competes with You, and perseverance to walk faithfully with Christ. Amen.',
   'Bring one sentence to the next gathering: “God is teaching me to hold…”',4,14);
end $$;
