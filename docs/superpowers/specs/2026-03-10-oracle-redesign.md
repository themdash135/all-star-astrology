# Ask the Stars Oracle — Design Spec

## Summary
Transform "Ask the Stars" from a basic keyword-matched input buried in the Home tab into an immersive, full-screen oracle experience that serves as the app's default landing screen. Mystical & poetic tone, medium astrological specificity, dramatic reveal animations.

## Navigation Change
- 5 bottom tabs: **Oracle** | Home | Systems | Combined | You
- Oracle is the default tab after splash/onboarding
- Oracle icon: crystal ball or stylized star

## Oracle Screen — UX Flow
1. Full-screen atmospheric background with subtle floating particle dots (CSS keyframe)
2. Centered prompt: "Speak your question into the cosmos..." in Playfair Display
3. Text input with gradient border (gold to periwinkle), glassmorphism
4. "Ask the Stars" gold CTA button
5. On submit: dramatic reveal — input fades, orb pulses for ~2.5s, particles accelerate, answer fades in line-by-line
6. Answer card: question echoed in muted text above, poetic response below
7. "The Celestial Evidence" expandable section — contributing systems with colored sentiment dots
8. Two actions: "Ask Another" (resets) + "Share" (copies text)
9. Previous Q&As stack below as scrollable session history

## Answer Quality — Medium Specificity
Names actual placements and systems woven into readable mystical prose.

Example: "Your Gemini Sun squares the current Saturn transit, pulling you toward caution — but your Vedic nakshatra speaks of courage, and your BaZi Water pillar flows toward change. Five traditions see momentum here. The tension you feel is not a warning; it is the bowstring drawing back before release."

## Backend Upgrades (`POST /api/ask`)

### Question Classification
- Yes/no ("Should I...?") → oracle-style directional answers
- Open ("Tell me about...") → guidance paragraphs
- Timing ("When will...?") → poetic timing responses referencing cycles

### Chart-Specific Weaving
- Extract Sun, Moon, Rising, Chinese animal, Day Master, Life Path, nakshatra from reading data
- Reference naturally: "As a Pisces Moon..." or "Your Earth Goat year carries..."

### Mystical Confidence Framing
- "65% probability" → "Five of eight celestial traditions whisper the same truth"
- "positive sentiment" → "The cosmic current runs warm here"
- "3 systems agree" → "Three ancient voices speak in unison"

### Poetic Response Templates
- Multiple structures per (area × sentiment × question-type) combination
- Varied openings to prevent formulaic repetition
- Closing lines that resonate, not just inform

## Subtle Animations Across App
- Chinese/BaZi system detail: animal emoji gentle scale pulse (CSS breathing)
- System grid tiles: constellation dots slow twinkle (alternating opacity)
- Home cosmic message: gradient border slow rotation
- Oracle background: 15-20 dots with randomized drift, opacity pulse
- Oracle answer: line-by-line fade-in, 150ms stagger per sentence
- Score bars + card entrances: keep existing animations

## Tone Examples

**"Should I take the job?"**
"The celestial currents shift in your favor. Five ancient traditions see momentum in your career house — your Day Master carries the energy of moving water, and water finds its way. The hesitation you feel is Saturn's wisdom, not fear. Trust the current."

**"Will I find love?"**
"Venus traces a path through your seventh house like ink through water — slow, beautiful, inevitable. The stars do not say when. They say: stop searching the horizon and notice who is already standing beside you."

**"How's my health?"**
"Your vitality chart reads like a candle burning at both ends — bright, but finite. Three systems urge you to honor the body that carries you. Rest is not retreat. It is the soil where tomorrow's strength grows."
