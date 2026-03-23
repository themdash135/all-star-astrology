
You need to CORRECT the Readings section implementation.

The previous version is wrong because it treated the Readings tiles like astrology scoring / daily percentage / calendar interpretation screens.

That is NOT what I want.

==================================================
CORE CORRECTION
==================================================

The 6 tiles on the Readings page are CATEGORY LAUNCHERS for actual fortune-telling tools.

They must NOT open:
- score dashboards
- daily percentage summaries
- calendar-style “how the day looks” screens
- generalized astrology system scoring views

They MUST open TOOL HUB PAGES.

==================================================
READINGS HOME SCREEN
==================================================

Build a Readings home screen with a 2-column grid of 6 large launcher cards:

1. Horoscope
2. Kundli
3. Match Making
4. Tarot Reading
5. Panchang
6. Numerology

These are navigation cards only.

They should visually resemble the reference screenshots:
- large rounded cards
- centered icon/illustration
- title below icon
- clean premium mystical feel
- subtle entrance / tap animation
- no result text on the card
- no percentages
- no daily scoring

==================================================
WHAT EACH TILE MUST OPEN
==================================================

1. HOROSCOPE TILE → Horoscope Hub page

This must open a Horoscope tools page, not a result page.

Show tappable fortune-telling tools like:
- Daily Horoscope
- Zodiac Sign
- Love Compatibility
- Chinese Horoscope
- Horoscope 2026
- Weekly Horoscope
- Monthly Horoscope
- Yearly Horoscope

Use the screenshot pattern:
- top header
- horizontal category/tabs if useful
- vertical tappable list rows/cards
- each item has icon, title, arrow/CTA

Tapping a tool item should open its dedicated detail/result flow.

--------------------------------------------------

2. TAROT READING TILE → Tarot Hub page

This must open a Tarot tools page.

Show tappable tarot tools:
- One Card Reading
- Three Card Reading
- Love Tarot Reading
- Wellness Tarot Reading
- State of Mind Tarot Reading
- Monthly Tarot Reading

This page is a launcher/menu page, not the final reading output page.

Use the screenshot pattern:
- header
- category strip if needed
- vertical list of tappable tools
- each tool opens deeper screen

--------------------------------------------------

3. KUNDLI TILE → Kundli Hub page

This must open a profile-based Kundli tools page.

Main launcher/content states:
- Add Kundli Profile
- Saved Profiles
- Generate Kundli
- Birth Chart
- Planet Positions
- House Analysis
- Dosha / Yog tools

If no profile exists:
show a prominent primary CTA:
- Add Kundli Profile

This should resemble the screenshot where the main action is adding a Kundli profile.

--------------------------------------------------

4. MATCH MAKING TILE → Match Making Hub page

This must open a profile-pair tools page.

Main state:
- Kundli Profile 1
- Kundli Profile 2
- Add Profile buttons
- Start Match Analysis button when both exist

Additional tool entries can include:
- Basic Compatibility
- Guna Match
- Love Match
- Marriage Match
- Strengths & Challenges

Use the screenshot structure:
- M & F / pair visualization
- profile slots
- add profile buttons
- match flow launcher

--------------------------------------------------

5. PANCHANG TILE → Panchang Hub page

This must open a Panchang tools page with sub-tools.

Important:
Do NOT convert Panchang into a percentage/scoring screen.

Panchang should include tool navigation such as:
- Today’s Panchang
- Choghadiya
- Subh Hora
- Nakshatra
- Tithi
- Yog
- Karan
- Hindu Month & Year

Default can open Today’s Panchang content, but visible navigation/sub-tools must remain available.

Follow the screenshot pattern:
- header
- short intro text
- chip/tab-like sub-tools
- detailed content cards below

--------------------------------------------------

6. NUMEROLOGY TILE → Numerology Hub page

This must open a Numerology tools page.

Include launcher cards/tabs for:
- Life Path
- Birth Path
- Ruling Number
- Name Numerology
- Daily
- Weekly
- Yearly
- Lucky Colors
- Lucky Days
- Lucky Numbers
- Lucky Gemstone

This should resemble the reference screenshots:
- top hero/profile summary
- date of birth area
- small horizontal cards for key numerology tools
- daily/weekly/yearly switching area
- supportive info cards below

This is a personalized numerology hub, not a scoring dashboard.

==================================================
STRUCTURE RULE
==================================================

The correct hierarchy is:

LEVEL 1:
Readings Home
→ 6 category launcher tiles

LEVEL 2:
Category Hub
→ actual fortune-telling tools for that category

LEVEL 3:
Specific Tool Screen
→ input / result / detail / profile / report

Do NOT skip directly from Level 1 into unrelated interpretation dashboards.

==================================================
IMPORTANT DO NOT DO
==================================================

Do NOT:
- show astrology “percentage of your day”
- show score-based day views
- show calendar scoring UIs
- show system-wide daily interpretation summaries on the 6 launcher tiles
- merge this with the separate multi-astrology-system calendar architecture
- replace tool hubs with generic overview pages

==================================================
BUILD REQUIREMENTS
==================================================

Use reusable architecture.

Create reusable components such as:
- ReadingsHomeScreen
- ReadingCategoryCard
- ReadingHubScreen
- ToolLauncherList
- ToolLauncherRow
- ToolLauncherCard
- ProfileRequiredState
- EmptyProfileCTA
- SubToolTabs
- DetailContentCard

Use external config/data instead of hardcoding screens individually.

Suggested config shape:
- readings_categories
- horoscope_tools
- tarot_tools
- kundli_tools
- matchmaking_tools
- panchang_tools
- numerology_tools

==================================================
VISUAL / ANIMATION
==================================================

Use subtle premium animation only:
- screen fade/slide in
- stagger reveal of launcher cards
- light tap scale on tiles
- soft glow or shimmer on important CTA buttons
- lightweight, mobile-safe motion
- no heavy particle overload

==================================================
SUCCESS CRITERIA
==================================================

Success means:
- tapping Horoscope opens Horoscope tools hub
- tapping Tarot Reading opens Tarot tools hub
- tapping Kundli opens Kundli tools hub
- tapping Match Making opens Match Making tools hub
- tapping Panchang opens Panchang sub-tools/content hub
- tapping Numerology opens Numerology personalized tools hub

The user should feel like they opened a marketplace/menu of actual fortune-telling tools, not a day-scoring screen.

==================================================
IMPLEMENT NOW
==================================================

Please rebuild/correct only the Readings section around this interpretation.
Do not rebuild the whole app.
Reuse as much existing styling and shared component structure as possible.
```

