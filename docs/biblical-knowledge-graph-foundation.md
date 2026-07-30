# Biblical Knowledge Graph Foundation

## Purpose

The Biblical Knowledge Graph (BKG) is the curated Scripture relationship layer beneath Study Companion. It connects passages to literary context, cross-references, original-language data, people, places, events, themes, doctrines, growth areas, study questions, and practical next steps.

The graph must remain useful without generative AI. AI may later provide an optional conversational interface, but it must retrieve from and cite approved graph records rather than inventing biblical content.

## Non-negotiable principles

1. **Scripture is primary.** Commentary, theology, language notes, and application remain subordinate to the biblical text.
2. **Every substantive claim has provenance.** Records must identify their source, contributor, review state, and last review date.
3. **Fact, interpretation, and application are distinct.** The interface and schema must never present theological interpretation or pastoral application as raw historical or linguistic fact.
4. **Unreviewed content is not publishable.** Draft and machine-assisted records remain inaccessible to public users until human review is complete.
5. **Disagreement is represented honestly.** When credible traditions differ, the graph records the major interpretations and their supporting sources rather than silently selecting one.
6. **Licensing is enforced.** Bible text, lexicon data, maps, quotations, and reference works may only be stored or displayed when their licenses permit the intended use.
7. **The graph is auditable.** Published records retain version history and reviewer attribution.

## Evidence classes

Every claim-bearing record receives one evidence class.

### A. Primary biblical text

The text of Scripture, passage boundaries, canonical references, and direct textual observations. Bible text must identify translation, edition, copyright status, and permitted display scope.

### B. Primary-language evidence

Hebrew, Aramaic, or Greek lemmas; morphology; manuscript or textual-variant data; and syntax observations. Records must identify the underlying edition or dataset and should distinguish lexical gloss from contextual meaning.

### C. Historical and geographical evidence

Claims about dates, rulers, customs, locations, archaeology, geography, and social setting. Prefer primary-source editions, peer-reviewed research, recognized academic reference works, or institutional datasets.

### D. Intertextual relationship

Connections based on quotation, allusion, shared wording, explicit citation, narrative parallel, typology, or thematic development. The relationship type and confidence must be recorded.

### E. Theological interpretation

Doctrinal synthesis or interpretation of a passage. These records require an identified theological tradition or neutral editorial framing. Credible alternative interpretations must be attachable to the same passage.

### F. Pastoral application

Growth-area associations, reflection prompts, study questions, and next-step suggestions. These are reviewed ministry content, not objective facts, and must be labeled accordingly.

## Source tiers

Sources receive a quality tier independent of the claim they support.

- **Tier 1:** Biblical text editions, critical editions, original-language datasets, peer-reviewed scholarship, university or museum datasets, and established academic reference works.
- **Tier 2:** Major scholarly commentaries, recognized denominational or seminary resources, and carefully edited reference works.
- **Tier 3:** Reputable ministry resources, pastoral works, and educational materials suitable for application or explanatory support.
- **Tier 4:** Community submissions, unsourced web material, AI-generated suggestions, and internal drafts. Tier 4 content can seed research but cannot independently support publication.

Publication rules:

- Historical, linguistic, archaeological, and textual claims require at least one Tier 1 or Tier 2 source.
- A disputed or high-impact claim should have two independent sources when practical.
- AI output is never a source.
- Wikipedia and general web summaries may help locate sources but are not final authorities.

## Review workflow

Each content record moves through these states:

1. `draft`
2. `researching`
3. `ready_for_review`
4. `changes_requested`
5. `approved`
6. `published`
7. `retired`

Minimum publication requirements:

- At least one attached source.
- Evidence class assigned.
- Source tier assigned.
- Claim text separated from editorial/application text.
- Reviewer identity and review date recorded.
- Licensing status confirmed when copyrighted material is stored or quoted.

Higher-risk records—including doctrinal disputes, mental-health application, abuse, suicide, marriage crisis, and medical or legal implications—require an additional pastoral or subject-matter review before publication.

## Core graph entities

The initial schema should support these node types:

- `passage`
- `verse`
- `book`
- `person`
- `place`
- `event`
- `theme`
- `doctrine`
- `growth_area`
- `original_language_term`
- `historical_context`
- `question`
- `next_step`
- `source`

Initial edge types:

- `contains`
- `precedes`
- `follows`
- `quotes`
- `alludes_to`
- `parallels`
- `fulfills`
- `contrasts_with`
- `shares_theme`
- `mentions_person`
- `occurs_at_place`
- `part_of_event`
- `uses_term`
- `supports_doctrine`
- `associated_with_growth_area`
- `has_question`
- `has_next_step`
- `supported_by_source`

Every edge must support:

- relationship subtype
- editorial explanation
- confidence (`high`, `medium`, `low`)
- evidence class
- review status
- provenance

## Passage granularity

The graph must support both verse-level and passage-level study. Verse nodes should not force artificial isolation from literary units. A passage record should identify:

- book
- chapter and verse range
- literary unit title
- preceding and following units
- genre
- speaker or narrator when applicable
- immediate context

Questions, themes, and language notes may attach to a verse, a passage, or both.

## Original-language safeguards

Original-language records must distinguish:

- lemma
- inflected form
- morphology
- basic gloss
- semantic range
- contextual sense
- interpretive significance

A word's dictionary possibilities must not be presented as though every possible meaning applies in a given verse. Etymology alone is insufficient evidence for contextual meaning.

## Theological neutrality and transparency

The platform may have an LFP editorial position, but it must not hide meaningful interpretive differences. Interpretation records should allow:

- tradition or viewpoint label
- summary
- supporting passages
- supporting sources
- objections or alternative readings
- LFP editorial note, where appropriate

Core Christian doctrines may be clearly affirmed in an LFP statement of faith. Secondary and disputed matters should be marked as such.

## Questions and next steps

Questions are curated content with a purpose and difficulty level. Suggested categories:

- observation
- context
- interpretation
- connection
- reflection
- application

Next steps must be:

- passage-grounded
- specific
- achievable
- non-manipulative
- appropriate to the user's context

The system must not imply that a generated or selected action is a direct personal command from God.

## Initial pilot

Do not begin with all 31,000+ verses. Prove the model with one coherent biblical unit.

Recommended pilot: **James 1**.

Reasons:

- manageable scope
- strong practical application
- multiple themes and growth areas
- useful Greek terms
- clear links to wisdom literature, Jesus' teaching, trials, temptation, speech, poverty, and obedience

Pilot deliverables:

1. Passage boundaries for James 1.
2. Verse and passage nodes.
3. Curated cross-references with typed relationships.
4. Selected Greek terms with contextual notes.
5. Themes and growth areas.
6. Observation, interpretation, reflection, and application questions.
7. Next-step suggestions.
8. Source records and review workflow.
9. A simple graph-backed study page with no AI dependency.

## Definition of verified

Within Study Companion, `verified` means:

- the record is supported by identified sources appropriate to its evidence class;
- the record has passed the required human review;
- any material disagreement is disclosed;
- copyright and license requirements have been checked; and
- the published version is traceable to its sources and reviewers.

`Verified` does not mean that every theological conclusion is universally accepted. It means the evidence, interpretation, viewpoint, and review history are transparent and responsibly represented.
