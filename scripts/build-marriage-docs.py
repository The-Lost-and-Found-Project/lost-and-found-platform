import json, os, subprocess
from pathlib import Path
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
root=Path(__file__).parent
node_script = "const fs=require('fs'),ts=require('typescript'),vm=require('vm');const src=fs.readFileSync('lib/marriage-deep-lessons.ts','utf8');const js=ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;const ctx={exports:{}};vm.runInNewContext(js,ctx);process.stdout.write(JSON.stringify(ctx.exports.marriageDeepLessons));"
lessons=json.loads(subprocess.check_output(['node','-e',node_script], cwd=root.parent, text=True))
exercise_script = "const fs=require('fs'),ts=require('typescript'),vm=require('vm');const src=fs.readFileSync('lib/marriage-daily-exercises.ts','utf8');const js=ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;const ctx={exports:{}};vm.runInNewContext(js,ctx);process.stdout.write(JSON.stringify(ctx.exports.marriageDailyExercises));"
exercises=json.loads(subprocess.check_output(['node','-e',exercise_script], cwd=root.parent, text=True))
assert len(lessons)==21 and len(exercises)==21
out=Path.home()/'Documents'/'Lost and Found Project'/'Marriage Journey Review'
out.mkdir(parents=True,exist_ok=True)
titles=['Listening Is an Act of Love','Why Do We React So Strongly?','Speaking Truth Without Causing Harm','When Conflict Becomes a Battle','Intentions and Impact','Understanding Your Spouse’s Needs','Our Communication Covenant','Becoming One Flesh','God’s Calling and Family Responsibilities','Leadership That Looks Like Jesus','Expectations We Never Discussed','Recovery and Healthy Boundaries','Becoming a Family','Protecting Our Marriage in a New Season','Your Past and Your Future','Forgiveness and Rebuilding Trust','When Ministry Becomes Our Identity','Creating Emotional Safety','Praying as Husband and Wife','Weathering Difficult Seasons','Choosing Each Other, Choosing Christ']
refs=['James 1:19–20; Proverbs 18:13','Proverbs 4:23; Psalm 139:23–24','Ephesians 4:15, 25–32','Proverbs 15:1; Romans 12:18','Philippians 2:3–4; 1 Corinthians 13:4–7','Romans 12:10; 1 Peter 3:7','Colossians 3:12–15; Ephesians 4:29','Genesis 2:18–25; Matthew 19:4–6','Ephesians 5:25–33; Mark 7:9–13','Mark 10:42–45; John 13:1–17','Philippians 2:3–4; Proverbs 20:5','Galatians 6:2–5; Luke 5:15–16','Deuteronomy 6:4–9; Ephesians 6:4','Ecclesiastes 3:1–8; Philippians 2:4','Psalm 34:18; Romans 12:2','Ephesians 4:31–32; Luke 17:3–4','Luke 10:38–42; John 15:4–5','Romans 12:9–10; Colossians 3:12–14','Philippians 4:6–7; 1 Peter 3:7','Matthew 7:24–27; Ecclesiastes 4:9–12','Joshua 24:15; Colossians 3:12–17']
def setup(d):
 sec=d.sections[0];sec.top_margin=Inches(.76);sec.bottom_margin=Inches(.72);sec.left_margin=Inches(.86);sec.right_margin=Inches(.86)
 st=d.styles['Normal'];st.font.name='Aptos';st.font.size=Pt(10.5);st.paragraph_format.space_after=Pt(7)
 for n,size in [('Title',24),('Heading 1',17),('Heading 2',12)]:
  s=d.styles[n];s.font.name='Aptos Display';s.font.size=Pt(size);s.font.color.rgb=RGBColor(27,60,80);s.paragraph_format.space_before=Pt(12);s.paragraph_format.space_after=Pt(6)
 f=sec.footer.paragraphs[0];f.text='THE LOST & FOUND PROJECT   |   ONE FLESH, ONE FOUNDATION';f.alignment=WD_ALIGN_PARAGRAPH.CENTER;f.runs[0].font.size=Pt(8)
def heading(d,t):d.add_heading(t,2)
def add(d,text):d.add_paragraph(text)
d=Document();setup(d)
d.add_heading('One Flesh, One Foundation',0);add(d,'21-day guided marriage discipleship | Participant workbook')
add(d,'Complete each daily lesson together. Read Scripture from your own Bible, discuss the questions, practice the exercise, and pray. Each spouse may keep private reflections separately. Meet with your mentor after Days 7, 14, and 21.')
add(d,'Safety: Participation is voluntary. Do not pressure trauma disclosures or use Scripture to justify intimidation, control, or unsafe reconciliation. This material is pastoral education, not medical or trauma treatment.')
for i in range(1,22):
 lesson=lessons[str(i)]
 d.add_page_break();d.add_heading('Day %02d  |  %s'%(i,titles[i-1]),1)
 p=d.add_paragraph();r=p.add_run('READ TOGETHER  ');r.bold=True;p.add_run(refs[i-1])
 heading(d,'Understand the passage');add(d,lesson['setting'])
 heading(d,'Deeper teaching')
 for paragraph in lesson['teaching']:add(d,paragraph)
 heading(d,'Discuss together')
 for j,q in enumerate(lesson['questions'],1):add(d,'%s. %s'%(j,q))
 heading(d,'Practice as a couple');add(d,exercises[i-1][0]);add(d,exercises[i-1][1])
 heading(d,'Pray together');add(d,lesson['prayer'])
 heading(d,'Private personal reflection');add(d,'What is God showing me about my own response? What will I practice before tomorrow? Keep this response private unless you freely choose to share it.')
 add(d,'Notes: ______________________________________________________________')
 add(d,'_____________________________________________________________________')
 if i in (7,14,21):
  heading(d,'Weekly mentor meeting');add(d,'Together prepare one observation, one question, and one practical commitment to discuss voluntarily with your mentor. Private reflections and trauma disclosures are not required.')
participant=out/'One Flesh One Foundation - Participant Workbook.docx';d.save(participant)
f=Document();setup(f);f.add_heading('One Flesh, One Foundation',0);add(f,'Facilitator guide | Three weekly mentoring meetings')
add(f,'The couple completes daily lessons together. Your role is to teach Scripture in context, ask thoughtful questions, and support practical next steps. Never require access to private journal entries.')
heading(f,'Pastoral safeguards')
add(f,'Forgiveness is not immediate trust. Never demand trauma disclosure, use spiritual authority to pressure a spouse, or treat threats and coercion as an ordinary communication disagreement. Stop joint work when safety is uncertain and refer for qualified individual support. Follow applicable safeguarding and reporting requirements.')
meetings=[
 ('Week 1 — Communication and repair','James 1:19–20; Ephesians 4:29',['Where did listening improve?','Which conflict pattern still needs work?','What will each person practice next week?']),
 ('Week 2 — Family, capacity, and ministry','Mark 7:9–13; Philippians 2:3–4',['How is the family experiencing the ministry schedule?','What practical support is needed for the baby and all children?','What responsibility can be paused or delegated?']),
 ('Week 3 — Trust and sustained growth','Colossians 3:12–17; Matthew 7:24–27',['What changes have become observable?','What support or referral remains appropriate?','What will the thirty-day follow-up review?'])
]
for i,(name,scripture,questions) in enumerate(meetings,1):
 f.add_page_break();f.add_heading(name,1);add(f,'Read and discuss in context: '+scripture)
 heading(f,'Meeting flow')
 for item in ['Open in prayer and read Scripture.','Invite voluntary reflections without requiring private answers.','Explore one real-life example without taking sides.','Identify one small measurable practice.','Close in prayer and agree on a follow-up.']:add(f,'• '+item)
 heading(f,'Discussion prompts')
 for q in questions:add(f,'• '+q)
 heading(f,'Facilitator notes')
 for _ in range(6):add(f,'_____________________________________________________________________')
heading(f,'Review checklist')
for item in ['Scripture context and application checked','Safety and referral language reviewed','Participant exercises and mentor meetings aligned','Mobile app and privacy behavior reviewed in Preview','Curriculum approved separately from any release approval']:add(f,'☐ '+item)
facilitator=out/'One Flesh One Foundation - Facilitator Guide.docx';f.save(facilitator)
print(participant);print(facilitator);print('Participant paragraphs',len(d.paragraphs),'Facilitator paragraphs',len(f.paragraphs))
