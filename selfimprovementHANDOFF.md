# Neuro-Symbolic Pipeline — God-Level Upgrades (1-30)

Completed: 2026-03-24
Status: All 30 upgrades implemented and passing (210 backend tests, 12 frontend tests)

---

## Files Modified

| File | Upgrades |
|------|----------|
| `backend/engines/pipeline/schemas.py` | 1, 2, 6, 14, 16, 17 |
| `backend/engines/pipeline/intent_classifier.py` | 1, 2, 3, 4, 5, 6 |
| `backend/engines/pipeline/system_router.py` | 7, 8, 9, 10 |
| `backend/engines/pipeline/adapters/base.py` | 11, 12, 13, 14, 15, 16, 17 |
| `backend/engines/pipeline/adapters/western.py` | 18, 19, 20, 21, 22, 23, 24, 25, 26 |
| `backend/engines/pipeline/adapters/vedic.py` | 27, 28, 29, 30 |
| `backend/engines/pipeline/engine.py` | 1, 9 (wiring) |

---

## Upgrade Details

### Intent Classifier (1-6)

**1. Question Feasibility Scoring**
- New `feasibility` field on `ClassifiedIntent` (0.0-1.0)
- `_UNFEASIBLE_PATTERNS`: 8 compiled regex patterns for existential/unanswerable questions ("will I ever be happy", "what is my destiny", etc.)
- `_FEASIBLE_MARKERS`: 27 words indicating actionable questions (today, interview, sign, lease, etc.)
- `_score_feasibility()` computes score from baseline 0.5 with penalties for unfeasible patterns (-0.35), boosts for feasible markers (+0.1 each, max +0.35), binary decision bonus (+0.15), timing question bonus (+0.10), short question penalty (-0.10), and general guidance penalty (-0.10)
- Engine wiring: feasibility < 0.5 caps aggregated confidence at `feasibility × 0.50`

**2. Question Specificity Scoring**
- New `specificity` field on `ClassifiedIntent` (0.0-1.0)
- `_SPECIFIC_MARKERS`: 26 words indicating precise questions (days of week, months, relational nouns, objects)
- `_VAGUE_MARKERS`: 13 words indicating vague questions (destiny, purpose, everything, somehow)
- `_score_specificity()` from baseline 0.3 with specific marker boosts (+0.12 each, max +0.40), vague marker penalties (-0.15 each, max -0.30), binary option bonus (+0.20), time horizon boost, length bonus, and digit bonus (+0.08)

**3. Emotional Charge Detection**
- Three-tier keyword dictionary: `EMOTION_HIGH` (0.80-0.95: scared, terrified, desperate, heartbroken, devastated, panicking, hopeless, crying), `EMOTION_MEDIUM` (0.45-0.60: worried, anxious, confused, frustrated, lonely, stressed, overwhelmed, lost, stuck), `EMOTION_LOW` (0.10-0.25: wondering, curious, thinking, considering, hoping)
- `_detect_emotional_charge()` returns highest matching score

**4. Semantic Similarity Normalization**
- `_SEMANTIC_GROUPS`: 9 regex patterns mapping varied phrasings to canonical groups — compatibility question, reconnection question, career opportunity question, relocation question, timing question
- `_semantic_group()` returns group label, used in `classify()` to override question type and inject missing domain tags
- Example: "Should I date him?" and "Is he a good match?" both classify as compatibility question → relationship_question type with love domain

**5. Question Type Expansion**
- 7 question types: binary_decision, timing_question, relationship_question, career_question, health_energy_question, emotional_state_question, general_guidance_question
- Semantic groups feed into type classification before keyword fallback
- Domain tag ordering now by keyword hit count (most hits first)

**6. Negation Detection**
- New `negated` field on `ClassifiedIntent` (bool)
- `_NEGATION_PATTERNS`: 10 regex patterns covering contractions, formal negation, and avoidance language (shouldn't, don't, not, never, avoid, stop, without, refrain)
- `_detect_negation()` scans normalized text for any match

### System Router (7-10)

**7. Emotional Charge Routing**
- When `intent.emotional_charge > 0.70`: Kabbalistic gets +3.0 boost, Vedic gets +2.0 boost
- Rationale: highly emotional questions benefit from Kabbalistic symbolic wisdom and Vedic nakshatra insight

**8. Feasibility-Aware Routing**
- When `intent.feasibility < 0.4`: Kabbalistic +2.0, Gematria +1.5, Numerology +1.0
- Rationale: unfeasible/existential questions get routed to symbolic/interpretive systems rather than concrete planetary systems

**9. Confidence-Aware Re-Routing**
- `route()` accepts `prior_confidences: list[float] | None`
- When last 3 confidences all < 0.40: Chinese +1.5, Persian +1.5, Kabbalistic +1.0
- Engine wiring: re-classifies last 3 questions from history and passes feasibility as confidence proxy
- Rationale: persistent low confidence suggests the dominant systems aren't serving this user well — try alternatives

**10. Specificity-Aware Routing**
- High specificity (> 0.70): Persian +1.5, Vedic +1.0 (systems with fine-grained timing/placement)
- Low specificity (< 0.30): Kabbalistic +2.0, Numerology +1.5, Gematria +1.0 (systems that handle abstract questions well)

### Base Adapter Infrastructure (11-17)

**11. Signal Accumulation Architecture**
- New `Signal` NamedTuple: `(direction: float, weight: float, label: str)`
- `blend_signals(signals, fallback=0.5)` computes weighted average of directional signals with fallback for empty lists
- Replaces ad-hoc stance accumulation in adapters with a traceable, composable pattern

**12. Domain Relevance Weighting**
- `_domain_relevance_weight(system_id, domain_tags)` returns a multiplier (0.5-1.0) based on how well a system fits the question's domain
- Domain affinity map: e.g., Western excels at love/mood, BaZi at career/wealth, Vedic at career/health, Numerology at wealth/mood, Persian at health/career, Kabbalistic at mood, Chinese at career, Gematria at mood
- Applied as a confidence multiplier in `_compute_confidence()`

**13. Time-Horizon Cycle Bias**
- Adds a cycle-alignment boost/penalty based on whether a system's natural cycle length matches the question's time horizon
- System cycle map: Western → this_month, Vedic → this_year, Chinese → this_year, BaZi → this_month, Numerology → today, Persian → this_week, Kabbalistic → general, Gematria → general
- Matching horizon → +0.05, adjacent → +0.02, distant → -0.03

**14. Aspect Orb Weight Decay**
- `orb_weight_decay(orb_degrees)` returns linear decay from 1.0 (exact, 0°) to 0.40 (8°+)
- Formula: `max(0.40, 1.0 - orb * 0.075)`
- New `orb` field on `EvidenceItem` schema for tracking
- Applied in Western adapter when processing aspect evidence

**15. Overconfidence Dampening**
- In `BaseAdapter.evaluate()`: when any stance value > 0.95 and confidence > 0.80, reduce confidence by 0.15
- Prevents systems from claiming near-certainty, which would distort aggregation
- Logged via stance_explanation when triggered

**16. Evidence Category Tagging**
- New `category` field on `EvidenceItem` schema
- `_categorize_evidence(feature)` auto-classifies into 18 categories by keyword matching: planet, house, sign, aspect, transit, number, element, star, nakshatra, dasha, sefirah, mansion, root, pillar, animal, yoga, tithi, temperament
- Applied to all evidence items in `evaluate()` post-processing

**17. Stance Explanation Generation**
- New `stance_explanation` field on `SystemOpinion` schema
- `_build_stance_explanation(stance, evidence)` produces a plain-English explanation: identifies the winning stance, top evidence contributor, and confidence characterization
- Example: "Leans favorable (0.72 vs cautious 0.28). Strongest signal: Sun in 10th House (weight 0.85). Confidence: solid."

### Western Adapter (18-26)

**18. Aspect Orb Integration**
- Parses orb from transit aspect data (column 3, format like "2°15'")
- `_parse_orb()` extracts degree value from string
- Sets `orb` field on aspect EvidenceItem
- Applies `orb_weight_decay()` to adjust evidence weight — tight aspects matter more

**19. Retrograde Motion Weighting**
- Reads motion column (column 4) from transit data: "D" (direct) or "R" (retrograde)
- Direct motion: +0.10 weight boost to transit evidence
- Retrograde motion: -0.05 weight penalty
- Reflects that retrograde transits carry revisionary/cautionary energy

**20. Lunar Node Interpretation**
- `NODE_THEMES` dict: North Node (growth, purpose, lessons) and South Node (release, comfort, past)
- `_NODE_HOUSE_DOMAINS` maps houses 1-12 to life domains (love, career, health, wealth, mood)
- When North Node house domain matches question domain: adds supportive signal
- When South Node matches: adds cautionary signal

**21. Rulership Chain Tracing**
- `SIGN_RULER` dict mapping all 12 signs to planetary rulers
- For domain-relevant houses (7th for love, 10th for career, etc.), traces which planet rules the sign on that house cusp
- If the ruling planet appears in a strong house (1, 4, 7, 10), adds a favorable signal

**22. House Ruler Dignity Assessment**
- Extends rulership chain with dignity evaluation
- If the ruler of a domain-relevant house is in its own sign or exaltation: strong favorable signal (weight 0.65)
- Checks planet's sign placement against domicile/exaltation tables

**23. Compound Transit Detection**
- Groups transiting planets by their natal target
- When 2+ transits hit the same natal planet: creates compound signal
- Multiple favorable transits = amplified favorable stance
- Multiple unfavorable transits = amplified cautionary stance
- Mixed transits on same planet = reduced weight (conflicting energies)

**24. Element/Modality Alignment**
- Counts elements (fire, earth, air, water) and modalities (cardinal, fixed, mutable) from natal placements
- For "should I act" questions: fire/cardinal emphasis → favorable; earth/fixed → cautious
- For stability questions: earth/fixed → favorable; fire/cardinal → cautious
- Adds element-alignment signal weighted at 0.30

**25. Mercury Post-Shadow Detection**
- When Mercury is direct but degree < 15°: flags as post-shadow period
- Adds cautionary signal for communication/travel/signing questions
- Weight 0.50 — moderate caution, not as strong as full retrograde

**26. Aspect Pattern Recognition**
- `_detect_aspect_patterns()` identifies three major patterns:
  - **Grand Trine**: 3 planets each ~120° apart (tolerance 10°) → harmonious, easy energy → favorable signal
  - **T-Square**: 2 planets ~180° apart + 1 planet ~90° from both (tolerance 10°) → tension driving action → neutral-cautious signal
  - **Yod**: 2 planets ~150° apart + 1 planet ~60° from both (tolerance 4°) → fated turning point → domain-dependent signal
- Each detected pattern added as evidence with appropriate weight

### Vedic Adapter (27-30)

**27. Nakshatra Pada Precision**
- `PADA_MODIFIER` dict: Pada 1 (fire, assertive, +0.08), Pada 2 (earth, stable, -0.03), Pada 3 (air, communicative, +0.05), Pada 4 (water, emotional, ±0.00 but emotional_charge × 0.12)
- `_extract_pada()` parses pada number from nakshatra string (e.g., "Rohini Pada 3" → 3)
- Adds pada-specific signal at weight 0.30 with element and polarity modifiers
- Adds pada evidence item with nakshatra category tag

**28. Dasha Timescale Separation**
- `DASHA_TIMESCALE` maps time horizons to (maha_mult, antar_mult) tuples:
  - today/tomorrow: maha 0.3, antar 1.0 (short-term = Antardasha dominates)
  - this_week/this_month: maha 0.5, antar 0.8
  - this_year: maha 0.8, antar 0.5
  - general: maha 1.0, antar 0.4 (long-term = Mahadasha dominates)
- Mahadasha evidence weight × maha_mult, Antardasha weight × antar_mult
- Reflects that asking "should I do X today?" should weight the current sub-period more heavily

**29. Mahadasha-Antardasha Interaction**
- Classifies Mahadasha and Antardasha lords as benefic (Jupiter, Venus, Mercury, Moon) or malefic (Saturn, Mars, Rahu, Ketu, Sun)
- Four interaction combos:
  - Both benefic: +0.25 favorable boost (harmonious period)
  - Benefic Maha + malefic Antar: -0.08 (minor friction in good period)
  - Malefic Maha + benefic Antar: +0.08 (relief in difficult period)
  - Both malefic: -0.15 cautionary (challenging period, heavier caution)
- Added as dasha-category evidence with interaction label

**30. Yoga Domain Matching**
- `YOGA_MEANING` dict for 5 yogas: Vishkambha (power/career, +1), Preeti (love/harmony, +1), Ayushman (health/longevity, +1), Saubhagya (wealth/fortune, +1), Shobhana (mood/beauty, +1)
- When yoga's domain tags overlap with question's domain_tags: adds yoga-aligned signal
- Signal strength: polarity × relevance × 0.3
- Evidence item tagged with yoga category

---

## Architecture Diagram

```
question  →  IntentClassifier (1-6)
                   ↓
              [feasibility, specificity, negated,
               emotional_charge, semantic_group,
               question_type, domain_tags]
                   ↓
              SystemRouter (7-10)
                   ↓
              [emotional routing, feasibility routing,
               confidence re-routing, specificity routing]
                   ↓
              SystemAdapters (11-17 base, 18-26 western, 27-30 vedic)
                   ↓
              [Signal accumulation, domain relevance,
               time-horizon bias, orb decay, overconfidence
               dampening, category tagging, stance explanation]
                   ↓
              Aggregator
                   ↓
              [feasibility confidence cap (1)]
                   ↓
              AnswerComposer
                   ↓
              PipelineResponse
```

---

---

## Upgrades 31-40: BaZi Adapter

File: `backend/engines/pipeline/adapters/bazi.py`

**31. Hidden Stems (Cang Gan) Extraction**
- `HIDDEN_STEMS` dict maps 12 Earthly Branches to their hidden Heavenly Stems (main/middle/residual)
- `STEM_ELEMENT` maps each stem to its element
- Evidence: reports hidden stems in day branch that match favorable/unfavorable elements
- Stance: counts hidden stem matches across all current pillars, ±0.06 per match

**32. Day Master Strength Amplification**
- `DM_STRENGTH_AMPLIFIER` dict maps (is_strong, element) to amplification values (0.03-0.15)
- Replaces flat +0.08 with proportional: strong Fire DM → +0.15, weak Water DM → +0.12
- Applied to the leading option in stance computation

**33. Ten God Interaction Matrix**
- `TEN_GOD_INTERACTION` dict with 8 compound pairs (e.g., Direct Wealth + Rob Wealth → "wealth competition" at -0.15)
- Collects all ten gods from day/month/year pillars, checks all unique pairs
- Evidence describes interactions; stance applies polarity modifiers

**34. Natal vs Current Pillar Clash Detection**
- `BRANCH_CLASHES` set with 6 opposition pairs (Zi-Wu, Chou-Wei, etc.)
- Checks natal day branch against current day/month/year branches
- Clash produces cautionary evidence (weight 0.75) and -0.12 to action options

**35. Seasonal Strength Modulation**
- `SEASON_STRENGTH` dict: each element has seasonal modifiers (Wood strong in spring +0.15, weak in autumn -0.10)
- `BRANCH_TO_SEASON` maps month branches to seasons
- Applies seasonal modifier to Day Master's stance contribution

**36. Na Yin Cycle Compatibility**
- Checks Na Yin element vs Day Master element using production/destruction cycles
- Na Yin produces DM → +0.06, destroys DM → -0.06, same element → +0.04
- Evidence describes the Na Yin cycle relationship

**37. Ten God + Symbolic Star Synergy**
- When day Ten God's domain weight >= 0.6 AND a symbolic star covers same domain >= 0.6
- Synergy bonus: +0.08 to leading option
- Detects when cosmic and structural energies align on the same life area

**38. Element Balance Extremes**
- Element > 40%: +0.10 boost if it matches an option's element (overwhelming presence)
- Element == 0%: -0.08 penalty if the option needs that element (complete absence)
- Evidence notes extreme imbalances ("Fire dominates at 45%", "Metal completely absent")

**39. Luck Period + Day Pillar Ten God Compound**
- Both Ten Gods positive polarity → +0.10 to action option
- Both negative polarity → +0.08 to cautious option
- Opposite polarities → 0.05 pull toward neutral (tension)

**40. Branch Combination Transformation**
- `BRANCH_COMBINATION_RESULT` maps 6 combination pairs to resulting elements
- When a combination is detected, checks if resulting element is favorable/unfavorable
- Favorable result → +0.08, unfavorable → -0.06
- Evidence notes the transformation element

---

## Upgrades 41-50: Chinese Zodiac Adapter

File: `backend/engines/pipeline/adapters/chinese.py`

**41. Animal Hidden Element Extraction**
- `ANIMAL_HIDDEN_ELEMENT` maps each animal to its primary hidden element
- When natal hidden element matches current year element → +0.15 harmony
- Destruction cycle clash → -0.15

**42. Month-Current Year Clash Detection**
- Checks month animal vs current year animal (not just birth year)
- Month-year clash: -0.30 × 0.8 penalty
- Month-year Liu He: +0.25 × 0.8 bonus
- Evidence describes the month-current year relation

**43. Seasonal Animal Strength**
- `ANIMAL_SEASON` maps each animal to its associated season
- In-season (natal animal's season == current season): +0.12 action boost
- Opposite season: -0.08 penalty
- Evidence: "Tiger is in-season during spring — strong energy"

**44. Self-Punishment Detection**
- `SELF_PUNISHMENT` set: Dragon, Horse, Rooster, Pig
- When natal_animal == current_animal AND animal is in set: -0.20 to action
- Cautionary evidence at weight 0.70

**45. Three Penalties (San Xing) Detection**
- 3 penalty groups: Ungrateful (Tiger/Snake/Monkey, -0.35), Uncivilized (Ox/Goat/Dog, -0.30), Self (Rabbit, -0.20)
- Collects natal year/month/hour animals + current year animal
- 2+ from a penalty group triggers it; polarity applied at weight 0.9
- Evidence at weight 0.80 describes the penalty

**46. Peach Blossom Activation Timing**
- `PEACH_BLOSSOM_ANIMAL` maps natal animal to its Peach Blossom trigger animal
- When current year IS the Peach Blossom animal: love → +0.25, other → +0.10
- Evidence describes the romantic activation

**47. Nobleman Star (Gui Ren) Detection**
- `NOBLEMAN_ANIMAL` maps each animal to its nobleman animals
- Current year is nobleman → career/general +0.15 boost
- Evidence at weight 0.75: "Nobleman Star activated — Ox year brings powerful helpers"

**48. Traveling Horse (Yi Ma) Detection**
- `TRAVELING_HORSE` maps natal animal to its travel-trigger animal
- Career questions → +0.20 action boost
- Evidence: "movement, travel, and career change energy" (weight 0.70)

**49. Void/Empty Branch Detection (Kong Wang)**
- `VOID_BRANCHES` maps each natal animal to branches that are "empty" for it
- Day animal falling on void branch: -0.10 penalty, promises unreliable
- Evidence at weight 0.55 warns about void day

**50. Animal Domain Amplification**
- When natal animal's top domain matches question's primary domain
- Weight multiplier bumped from 0.8 to 1.2 for natal animal polarity
- Similar amplification for month and hour animals

---

## Upgrades 51-60: Numerology Adapter

File: `backend/engines/pipeline/adapters/numerology.py`

**51. Master Number Special Handling**
- `MASTER_NUMBER_BOOST`: 11 (intensity 1.4, mood/love), 22 (1.5, career/wealth), 33 (1.3, mood/health)
- When found in Personal Day/Month/Year: polarity weight × intensity factor
- Domain overlap → additional +0.08 amplification
- Evidence at weight 0.80 with meaning description

**52. Karmic Debt Number Detection**
- `KARMIC_DEBT`: 13 (-0.10), 14 (-0.08), 16 (-0.12), 19 (-0.06)
- `_safe_int_unreduced()` reads raw pre-reduction values from "X / Y" format
- Cautionary polarity_mod always adds caution regardless of other signals
- Evidence at weight 0.60

**53. Pinnacle-Challenge Interaction**
- Uses `_harmony_note()` to check active pinnacle vs challenge
- Harmonic: +0.06 to leading option, evidence at 0.55
- Dissonant: -0.04 (dampened decisiveness), evidence at 0.50

**54. Personal Year Cycle Position**
- `YEAR_CYCLE_PHASE`: year 1 (beginning, +0.15) through year 9 (completion, +0.05)
- Phase determines natural action/rest orientation
- Evidence at weight 0.55 describing cycle position

**55. Pinnacle Period Domain Matching**
- Checks pinnacle number's `NUMBER_DOMAIN` against question domains
- Domain overlap weight >= 0.6 → pinnacle polarity × 0.5 as additional signal
- Evidence at weight 0.50 for domain-matched pinnacle

**56. Challenge Number as Warning Signal**
- Challenge number's domain overlapping question domain (weight >= 0.5) → -0.08 cautionary
- Active challenges in the questioned life area add caution
- Evidence at weight 0.50

**57. Maturity Number Integration**
- Extracted from "core numbers" table
- Long-term questions (this_year/general): polarity at weight 0.5, evidence at 0.55
- Short-term: weight 0.15, evidence at 0.30

**58. Universal Day Influence**
- `_compute_universal_day()` extracts from "current cycles" table
- Today/tomorrow: polarity at weight 0.4, evidence at 0.45
- Other horizons: weight 0.1, evidence at 0.25

**59. Number Repetition Pattern (Echo Effect)**
- Counts number occurrences across all positions using Counter
- 3+ appearances: "echo" — polarity amplified ×1.5, +0.10 decisiveness bonus
- Evidence at weight 0.85: "Number 8 echoes across 3 positions"

**60. Cycle Transition Detection**
- `CYCLE_TRANSITION`: year 9 (-0.08, release), year 1 (+0.12, fresh starts)
- Cusp energy (year 9 + day 1 or vice versa): +0.05 toward action
- Evidence at weight 0.60 / cusp evidence at 0.55

---

## Upgrades 61-70: Kabbalistic Adapter

File: `backend/engines/pipeline/adapters/kabbalistic.py`

**61. Sefirot Proximity Weighting**
- `SEFIRAH_ADJACENCY` dict mapping each sefirah to its Tree of Life neighbors
- When birth sefirah neighbors cycle sefirah: +0.10 resonance bonus to action option
- When day sefirah neighbors cycle sefirah: +0.06 timing alignment bonus
- Evidence at weight 0.65 describes the proximity

**62. Da'at (Abyss) Detection**
- `SUPERNAL_SEFIROT` set: {Keter, Chokmah, Binah}; `LOWER_SEFIROT`: the other 7
- When one sefirah is supernal and another is lower: "crossing the Abyss" signal
- Transformative signal: +0.12 to action for career/mood questions, -0.08 for stability questions
- Evidence at weight 0.75 describes the crossing

**63. Pillar Imbalance Severity**
- Replace binary pillar count with continuous severity: `abs(right - left) / total_active`
- Severity > 0.6: extreme imbalance, confidence penalty -0.08
- Severity < 0.2: balanced, confidence bonus +0.04
- Evidence describes severity level with qualitative label

**64. World Layer Resonance**
- Count sefirot per Olam (Atzilut/Briah/Yetzirah/Assiah)
- 3+ sefirot in same world: amplify that world's polarity ×1.5
- Add world resonance evidence at weight 0.55
- Atzilut resonance boosts mood/spiritual; Assiah boosts career/material

**65. Path Letter Element Association**
- `LETTER_ELEMENT` dict: 3 Mother letters (Aleph=Air, Mem=Water, Shin=Fire), 7 Double letters → planets, 12 Simple → zodiac signs
- When path letter element matches question domain element affinity: +0.08
- Evidence at weight 0.45 describes the elemental correspondence

**66. Sefirah Pair Harmony/Tension**
- `HARMONIOUS_PAIRS`: {(Chesed,Netzach), (Binah,Hod), (Chokmah,Chesed), (Tiferet,Yesod)}
- `TENSE_PAIRS`: {(Chesed,Gevurah), (Netzach,Hod), (Keter,Malkuth)}
- Check birth-vs-cycle and soul-vs-personality pairs
- Harmonious: +0.08; Tense: -0.06
- Evidence at weight 0.55

**67. Tree Ascent/Descent Detection**
- Assign numeric position 1(Keter)-10(Malkuth) to each sefirah
- Track direction: birth→cycle→day; ascending (decreasing number) = spiritual growth, descending = material grounding
- Ascending: mood/love +0.06; Descending: career/wealth +0.06
- Evidence at weight 0.50

**68. Sefirah Domain Cascade**
- When personal day sefirah AND cycle sefirah both have domain weight >= 0.6 for questioned domain
- Double the combined domain boost (stacking from ×1.3 to ×1.6 each)
- Evidence at weight 0.70 describes the cascade alignment

**69. Path Gate Theme as Evidence**
- Extract soul path theme and cycle path theme from path gates table
- Match theme keywords against domain keywords (love, career, health, wealth, mood)
- Domain-matched themes: evidence at weight 0.60
- Non-matched themes: evidence at weight 0.35

**70. Sefirah Cycle Timing**
- Map sefirah position: 1-3 = initiation phase, 4-7 = development phase, 8-10 = completion phase
- Initiation: action questions get +0.08; patience questions get -0.04
- Completion: action questions get -0.04; patience/timing questions get +0.08
- Evidence at weight 0.45

---

## Upgrades 71-80: Gematria Adapter

File: `backend/engines/pipeline/adapters/gematria.py`

**71. Root Progression Analysis**
- Compare text_root → ordinal_root → bridge_root sequence
- Ascending (each larger): momentum signal +0.08 toward action
- Descending (each smaller): contraction signal +0.06 toward caution
- Stable (same or ±1): grounding signal, confidence +0.04
- Evidence at weight 0.55

**72. Master Number Amplification**
- `MASTER_INTENSITY`: 11→1.4, 22→1.5, 33→1.3
- When text or bridge root is master number: polarity weight × intensity factor
- Domain overlap (master number domain matches question): additional +0.10
- Evidence at weight 0.80 with master vibration description

**73. Hebrew Letter Path Depth**
- `LETTER_PATH_MEANING` dict mapping 9 letters to full path descriptions (not just polarity)
- Add path meaning as evidence with domain-aware weighting
- Domain match: weight 0.60; no match: weight 0.35

**74. Root Threshold Moment**
- When abs(text_root - current_gate) == 1: threshold/transition moment
- Gate approaching (text < gate): +0.06 toward action (building energy)
- Gate receding (text > gate): -0.04 (energy passing)
- Evidence at weight 0.50

**75. Positional Word Root Weighting**
- First word in name: root weight ×1.3 (strongest imprint)
- Middle words: weight ×1.0
- Last word: weight ×0.8
- Applied in word-root convergence/divergence scoring

**76. Compound Root Resonance**
- When text_root == (ordinal_root + bridge_root) % 9 (or exact): mathematical harmony
- Compound resonance: +0.12 to leading option, confidence +0.05
- Evidence at weight 0.75 describes the numeric convergence

**77. Root Domain Intensity Scaling**
- Scale root polarity by ROOT_DOMAIN strength for questioned domain
- Example: root 8 (polarity 0.5) × wealth domain weight (0.9) = effective polarity 0.45
- Replaces flat polarity application with domain-proportional scaling

**78. Temporal Root Shift**
- Compare birth root (from bridge) vs current gate
- Same root: stable identity period, confidence +0.06
- Different: evolution/transition period, ±0.04 based on gate polarity
- Evidence at weight 0.50

**79. Letter Frequency Resonance**
- Count occurrences of each Hebrew letter correspondence in the full name
- 3+ of same letter: amplify that letter's polarity ×1.5
- Evidence at weight 0.55: "Letter Gimel appears 3 times — amplified abundance signal"

**80. Correspondence Layer Agreement**
- Count how many root correspondence layers (from table) share the same theme
- 3+ layers agree: convergence bonus +0.15 to leading option
- Evidence at weight 0.65

---

## Upgrades 81-90: Persian Adapter

File: `backend/engines/pipeline/adapters/persian.py`

**81. Sect-Aware Planet Dignity**
- `SECT_BENEFIC`: Day={Jupiter, Sun, Saturn}, Night={Venus, Moon, Mars}
- Planet in own sect: condition effect ×1.3
- Planet in opposite sect: condition effect ×0.7
- Applied to PLANET_CONDITION_EFFECT scoring

**82. Triplicity Ruler Chain**
- `TRIPLICITY_RULERS` dict: each sign → (day_ruler, night_ruler, participating_ruler)
- Evaluate all 3 rulers for ascendant sign; count dignified/weak
- All 3 strong: +0.15; all 3 weak: -0.12; mixed: proportional
- Evidence at weight 0.60

**83. Fixed Star Influence**
- `FIXED_STARS`: Regulus (career +0.15), Spica (wealth +0.12), Algol (health -0.15), Fomalhaut (mood +0.10), Antares (career -0.10), Aldebaran (career +0.10)
- Check if any planet within 2° of a star; add star domain signal
- Evidence at weight 0.65

**84. Void-of-Course Moon Detection**
- When Moon's degree > 25° in current sign and no applying aspects found in data
- Add caution signal: -0.10 for timing/action questions
- Evidence at weight 0.60: "Moon is void-of-course — promises made now may not hold"

**85. Temperament Extremity Scoring**
- Compute max quality weight from temperament profile table
- Extremity > 0.7 (single quality dominates): amplify temperament signal ×1.4
- Balanced (< 0.4): reduce temperament influence ×0.7
- Evidence describes extremity level

**86. Lot Interaction (Fortune × Spirit)**
- Parse both lot houses; compute house distance
- Same house: synergy +0.12
- Opposing houses (distance=6): creative tension +0.06 toward action
- Square (distance=3 or 9): friction -0.08
- Evidence at weight 0.55

**87. Mansion Series Grouping**
- 4 series: 1-7 (beginning), 8-14 (growth), 15-21 (harvest), 22-28 (release)
- Natal and current in same series: resonance +0.08
- Adjacent series: flow +0.04
- Opposite series: contrast -0.06
- Evidence at weight 0.50

**88. Planet Condition Weight by Importance**
- `PLANET_IMPORTANCE`: Jupiter=1.5, Saturn=1.5, Mars=1.3, Sun=1.2, Venus=1.1, Moon=1.0, Mercury=0.8
- Multiply condition effect by importance before averaging
- Ensures major planet conditions dominate the aggregate

**89. Ascendant Decan Precision**
- Parse degree from ascendant data; divide into decans (0-10, 10-20, 20-30)
- `DECAN_SUBRULER` maps sign + decan to sub-ruling planet
- Sub-ruler dignified: +0.06; debilitated: -0.04
- Evidence at weight 0.45

**90. Mansion Domain Mapping**
- `MANSION_DOMAIN` maps all 28 mansions to primary life domains
- When mansion domain matches question domain: polarity ×1.4 amplification
- When mismatched: polarity ×0.8 reduction
- Evidence includes domain relevance note

---

## Upgrades 91-100: Aggregator

File: `backend/engines/pipeline/aggregator.py`

**91. Bayesian Prior from History**
- Accept `prior_confidence: float | None` parameter
- Blend: `final = 0.70 * current + 0.30 * prior` when prior available
- Smooths confidence trajectory across session

**92. System Cluster Detection**
- Compute stance standard deviation across systems
- Bimodal (std > 0.15 with 2+ clusters): add `clustered=True` to result
- Single cluster (std < 0.08): `clustered=False`, confidence +0.03

**93. Inverted Consensus Handling**
- When all systems agree on "cautious" (agreement ratio > 0.85): this IS a clear answer
- Boost confidence by +0.06 instead of leaving it as-is
- Set tone to "firm" even though the answer is "no"

**94. Evidence Quality Score**
- Count distinct `category` values across each opinion's evidence
- 5+ categories: quality_bonus = +0.05 × (opinion.confidence)
- Applied as multiplier on opinion's influence weight

**95. Sigmoid Confidence Calibration**
- After blended formula: apply `1/(1+exp(-8*(conf-0.45)))` curve
- Pushes mid-range values toward extremes: 0.45→0.50, 0.30→0.18, 0.65→0.82
- More decisive confidence labels

**96. Weighted Agreement Counting**
- Replace raw count with weighted: `sum(SYSTEM_WEIGHT[sys] for sys in agreeing)`
- Threshold for "strong agree": weighted_sum > 0.60 × total_possible_weight
- More accurate representation of consensus

**97. Stance Distribution Shape**
- Compute variance of stance values across all opinions for the winner
- High variance (>0.03): polarized → confidence -0.04
- Low variance (<0.01): consensus → confidence +0.03
- New `polarized` boolean on AggregatedResult

**98. Dynamic Confidence Floor**
- Replace fixed 0.08 floor with: `0.08 × feasibility × specificity`
- Vague unfeasible questions: floor near 0.01
- Specific feasible questions: floor stays at 0.08

**99. System Reliability Tracking**
- Accept `session_opinions: list[list[SystemOpinion]]` from prior questions
- Track per-system majority-agreement rate
- Systems with < 50% agreement rate: confidence discounted ×0.85

**100. Multi-Path Detection**
- When 3+ stance options within 0.05 of each other: flag `multi_path=True`
- Lower confidence by -0.06 (genuinely ambiguous)
- Answer composer uses special multi-path framing

---

## Upgrades 101-110: Answer Composer

File: `backend/engines/pipeline/answer_composer.py`

**101. Emotion-Aware Tone Modulation**
- emotional_charge > 0.70: prepend empathetic opener ("I hear you..."), soften blunt negatives
- emotional_charge < 0.20: use direct/efficient language, skip empathetic filler
- 5 empathetic opening templates, 5 direct templates

**102. Interpretive Evidence Translation**
- `_EVIDENCE_INTERPRETATION` dict: 30+ feature→meaning mappings per domain
- "Fire Day Master" + career → "Fire Day Masters thrive on bold moves"
- "Moon in Scorpio" + love → "deep emotional intensity shapes your connections"

**103. Question-Type Opening Pools**
- 5 new pool sets (4 options each): relationship, career, health, wealth, existential
- Selected based on primary domain_tag, not just favorable/cautious binary
- Falls back to generic pool if domain not matched

**104. Narrative Flow Connectors**
- `_TRANSITIONS` list: 20+ flowing connectors replacing mechanical "{System} confirms"
- "This aligns with...", "Deeper still,...", "Adding nuance,...", "Looking through another lens,...", "Beneath the surface,..."
- Connectors vary by position in narrative (1st, 2nd, 3rd system cited)

**105. Confidence Strength Qualifiers**
- `_QUALIFIER` dict mapping confidence bands to adverbs
- ≥0.65: "strongly", "clearly", "decisively"
- 0.45-0.64: "gently", "with moderate conviction"
- <0.45: "tentatively", "with some hesitation"
- Injected before key stance verbs in opening/body

**106. Domain Metaphor Layer**
- `_DOMAIN_METAPHORS` dict: 3-4 metaphors per domain
- Love: "the garden of your connections", "the emotional current"
- Career: "the architecture of your path", "the compass of ambition"
- Selected by `random.choice()` and woven into closing sentences

**107. Deep Contradiction Narrative**
- When conflict_note triggers: explain the dimension of disagreement
- "Your timing is ripe (Persian planetary day) but your emotional readiness lags (Kabbalistic soul sefirah)"
- Maps supporter/dissenter system to their specialization for meaningful "why"

**108. Domain-Specific Closings**
- `_CLOSE_DOMAIN` dict: 4 closings per domain
- Love: "Trust what your heart already knows", "The heart's timing has its own logic"
- Career: "The path forward will crystallize with your next move"
- Health: "Honor your body's rhythm above all external pressures"

**109. Opening-Body Feature Dedup**
- Track `skip_feature` set from chart_lead used in opening
- `_weave_body()` checks evidence features against skip set before including
- Prevents "your Day Master is Fire" appearing in both opening and body

**110. Negation-Aware Answer Framing**
- When `intent.negated == True`: invert favorable/cautious language
- "Should I NOT quit?" + chart says favorable → "Your chart suggests staying is the stronger path"
- Swap _OPEN_FAV/_OPEN_CAUT pool selection based on negation

---

## Upgrades 111-120: Context Memory & Pattern Analyzer

Files: `backend/engines/pipeline/context_memory.py`, `backend/engines/pipeline/pattern_analyzer.py`

**111. Temporal Decay Weighting**
- Weight questions by recency: `weight = 0.85 ** index` (newest=1.0, 5th=0.44, 10th=0.20)
- Apply decay to domain_counts and type_counts
- More recent questions dominate the context

**112. Emotion Trajectory Tracking**
- New `emotion_trajectory` field on UserContext: list of emotional_charge values
- New `emotion_trend` field: "rising", "falling", "stable", "volatile"
- Computed via linear regression slope on charge values

**113. Domain Transition Detection**
- Track domain sequence: [career, career, love, career, love]
- Detect patterns: "deepening" (same domain), "shifting" (new domain), "oscillating" (back-and-forth)
- New `domain_trajectory` field on UserContext

**114. Compound Pattern Recognition**
- Combine base patterns: hesitation + timing_focus → "hesitant_timing"
- domain_loop + emotional high → "anxious_fixation"
- 6 compound patterns with specific insight templates

**115. Session Coherence Score**
- `coherence = 1 - (n_unique_domains / max(n_questions, 1))`
- 1.0 = all same domain; 0.2 = every question different domain
- New field on UserContext; affects answer depth in composer

**116. Question Trajectory Tracking**
- Track specificity values across questions
- Rising specificity: "zeroing in" — user is getting clearer
- Falling: "pulling back" — user may be overwhelmed
- New `specificity_trend` on UserContext

**117. Recurring Theme Extraction**
- Extract non-stop-word bigrams from all questions
- Count frequency; themes with 2+ occurrences become `recurring_themes: list[str]`
- "new job" appearing 3 times → theme extracted

**118. Confidence History Trend**
- Accept prior confidence values; compute trend
- Declining: insight "The chart's clarity is fading on this topic — you may be asking from too many angles"
- Rising: insight "Each question brings more clarity"

**119. Rich Pattern Insight Generation**
- Use extracted themes, domains, and trajectories in insight text
- "Your questions keep circling back to trust in your relationship" instead of generic "You've been focused on love"
- Template system with 3+ slots: {theme}, {domain}, {trajectory}

**120. Continuous Pattern Scoring**
- Replace threshold gates with sigmoid: `strength = 1/(1+exp(-10*(ratio-threshold)))`
- binary_ratio of 0.55 → strength 0.38 (not 0.0 as before)
- All patterns have continuous strength values

---

## Upgrades 121-126: Pipeline-Level

Files: `backend/engines/pipeline/engine.py`, `backend/engines/pipeline/schemas.py`

**121. Intent Classification Cache**
- `_intent_cache: dict[str, ClassifiedIntent]` module-level LRU dict (max 50)
- Key: question text hash
- Avoids re-classifying the same history questions repeatedly

**122. Adapter Result Memoization**
- Cache adapter results keyed on `(system_id, hash(system_data_json), intent_hash)`
- Within-session only (cleared per `run()` call if reading changes)
- Speeds up follow-up questions with identical reading data

**123. Graceful Adapter Fallback**
- Wrap each `adapter.evaluate()` in try/except
- On error: return neutral SystemOpinion (relevant=False, stance=50/50, confidence=0.0)
- Log the error for diagnostics without killing the pipeline

**124. Pipeline Timing Diagnostics**
- `_timings: dict[str, float]` tracking milliseconds per stage
- Stages: classify, route, adapt_total, adapt_per_system, temporal, aggregate, compose
- Returned as optional `diagnostics` field on PipelineResponse

**125. Configurable Confidence Weights**
- `PipelineConfig` dataclass: gap_weight, agree_weight, data_weight, dissent_weight, floor
- Default values match current hardcoded: 0.30, 0.25, 0.15, -0.20, 0.08
- Passed into `aggregate()` for A/B testing

**126. Evidence Provenance Chain**
- New `provenance` field on EvidenceItem: "extraction" | "stance" | "temporal" | "interaction"
- Set during evidence creation in each adapter stage
- Enables answer composer to prioritize extraction-stage evidence over computed evidence
