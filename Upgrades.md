Game List + How They Play
1. BaZi — Element Balance Challenge
How it’s played:
User enters birth data
Game calculates their 5-element balance
User explores which elements strengthen or weaken their chart
Result shows strongest/weakest energies and best balance strategy
Fun build idea:
Make it feel like a strategy board
Use animated element orbs
Let users test “what if” scenarios
2. BaZi — Four Pillars Explorer
How it’s played:
User sees Year, Month, Day, Hour pillars
Taps each pillar to reveal stems, branches, hidden stems, meanings
Can complete mini challenge prompts to learn the chart
Fun build idea:
Make pillars feel like locked relic towers
Tap to reveal glowing layers
Add progressive discovery and completion feel
3. BaZi — Luck Pillar Life Timeline
How it’s played:
Game computes life phases / luck pillars
User scrolls through timeline periods
Each period shows themes, strengths, risks, opportunities
Fun build idea:
Build as a journey map
Each pillar is a milestone node
Use color shifts and animated transitions through life stages
4. BaZi — BaZi Compatibility Strategy
How it’s played:
Two profiles are compared
Game analyzes pillar harmony, clashes, support, imbalance
Result shows emotional fit, conflict zones, growth zones
Fun build idea:
Present it like a relationship battle/synergy board
Use connecting lines between pillars
Show support and clash visually
5. Vedic — Guna Match Deep Dive
How it’s played:
Two birth charts are compared
Traditional guna scoring categories are revealed step by step
Final score plus interpretation is shown
Fun build idea:
Make it feel like a ceremonial compatibility reveal
Reveal categories one by one
Add score meter buildup
6. Vedic — Dasha Timeline Game
How it’s played:
User enters birth data
Game generates dasha periods
User taps each major period for meaning and life themes
Fun build idea:
Make it feel like a cosmic timeline scroll
Planets appear as rulers of each era
Add layered “major period / sub period” depth
7. Vedic — Prashna Question Oracle
How it’s played:
User asks a question
Game uses current timing / horary logic
Returns answer tendency, obstacles, timing, guidance
Fun build idea:
Make it feel like a ritual oracle
Slow reveal animation
Add sacred/ceremonial interaction before answer appears
8. Western — Advanced Synastry Lab
How it’s played:
Two natal charts are compared
Game scores attraction, communication, bonding, conflict, stability
Aspect cards reveal one at a time
Fun build idea:
Build like a compatibility lab
Use aspect cards and chart overlays
Let users tap into each relationship category
9. Western — Transit Impact Game
How it’s played:
Current transits are compared with natal placements
User sees strongest influences for love, work, mood, opportunity
Daily/weekly score is shown
Fun build idea:
Build like a live weather map for astrology
Use moving transit cards
Show active zones lighting up
10. Chinese Zodiac — Zodiac Compatibility Matrix
How it’s played:
Two zodiac animals are compared
Game evaluates harmony, tension, support, rivalry
Shows relationship type and score
Fun build idea:
Build like a matrix board
Use animal icons and visual pairings
Make matchups feel collectible and social
11. Chinese Zodiac — Fortune Stick Oracle
How it’s played:
User asks a question
Fortune stick is drawn
Result reveals poem/fortune, meaning, and guidance
Fun build idea:
Build as a shake-and-draw ritual
Let user shake or tap container
Make the reveal feel suspenseful and elegant
12. Numerology — Life Path Deep Decoder
How it’s played:
User enters full name + birthdate
Game calculates core numbers
Meaning is revealed layer by layer
Fun build idea:
Build like an identity decoder
Animate numbers assembling into a profile
Reveal “your code” in stages





Build the following premium games inside the existing astrology system apps. Each system already exists and has tabs: Overview, Details, Calendar, Games. These games belong only inside the Games tab of their matching astrology system.

Games to build:

1. BaZi -> Element Balance Challenge
2. BaZi -> Four Pillars Explorer
3. BaZi -> Luck Pillar Life Timeline
4. BaZi -> BaZi Compatibility Strategy

5. Vedic -> Guna Match Deep Dive
6. Vedic -> Dasha Timeline Game
7. Vedic -> Prashna Question Oracle

8. Western -> Advanced Synastry Lab
9. Western -> Transit Impact Game

10. Chinese Zodiac -> Zodiac Compatibility Matrix
11. Chinese Zodiac -> Fortune Stick Oracle

12. Numerology -> Life Path Deep Decoder



Prompt for Claude CLI


General rules:
- Build these only inside each system’s Games tab
- Do not rebuild the full app
- Do not rebuild auth, navigation, overview, details, or calendar
- Reuse a shared game framework
- Keep logic modular and config-driven
- Separate UI, game logic, astrology rules, and interpretation content
- Make each game feel playful, interactive, and premium
- Use progressive reveal, animation states, and strong visual feedback
- Support save, replay, and result history if possible

Fun interaction goals:
- each game should feel like an experience, not a calculator
- use staged reveal patterns
- use symbolism native to the astrology system
- use motion, transitions, and playful UI feedback
- keep mobile-first usability



JSON Build Blueprint for Claude

{
  "projectScope": {
    "type": "system_games_only",
    "existingApp": true,
    "existingTabs": ["Overview", "Details", "Calendar", "Games"],
    "buildOnly": "Games"
  },
  "sharedFramework": {
    "requiredModules": [
      "GameShell",
      "InputStep",
      "CalculationEngine",
      "CompatibilityEngine",
      "TimelineEngine",
      "InterpretationEngine",
      "RevealAnimationController",
      "ResultScreen",
      "SaveReplayHistory"
    ],
    "principles": [
      "modular",
      "config_driven",
      "mobile_first",
      "fun_interactive_ui",
      "separate_logic_from_ui"
    ]
  },
  "games": [
    {
      "system": "BaZi",
      "tab": "Games",
      "gameId": "bazi_element_balance",
      "title": "Element Balance Challenge",
      "playBrief": "Calculate the user chart, show five-element balance, let the user explore which energies help or hurt the chart, and return a balance strategy.",
      "gameType": "strategy_optimization",
      "inputs": ["birthDate", "birthTime", "location_optional"],
      "funBuild": {
        "theme": "element_strategy_board",
        "interactions": [
          "tap element orbs",
          "simulate support/control cycles",
          "reveal strongest and weakest energies"
        ],
        "feel": "smart, mystical, strategic"
      }
    },
    {
      "system": "BaZi",
      "tab": "Games",
      "gameId": "bazi_four_pillars_explorer",
      "title": "Four Pillars Explorer",
      "playBrief": "Let the user tap each pillar to reveal stems, branches, hidden stems, meanings, and guided learning prompts.",
      "gameType": "discovery_puzzle",
      "inputs": ["birthDate", "birthTime"],
      "funBuild": {
        "theme": "unlockable_relic_towers",
        "interactions": [
          "tap to reveal layers",
          "progressive unlock states",
          "mini knowledge prompts"
        ],
        "feel": "exploratory, rewarding, visual"
      }
    },
    {
      "system": "BaZi",
      "tab": "Games",
      "gameId": "bazi_luck_pillar_timeline",
      "title": "Luck Pillar Life Timeline",
      "playBrief": "Compute life periods and show a scrollable timeline of phases, themes, strengths, and risks.",
      "gameType": "timeline_progression",
      "inputs": ["birthDate", "birthTime"],
      "funBuild": {
        "theme": "life_journey_map",
        "interactions": [
          "scroll timeline",
          "tap each phase",
          "highlight strongest and hardest eras"
        ],
        "feel": "epic, reflective, immersive"
      }
    },
    {
      "system": "BaZi",
      "tab": "Games",
      "gameId": "bazi_compatibility_strategy",
      "title": "BaZi Compatibility Strategy",
      "playBrief": "Compare two charts and show harmony, clashes, support patterns, and relationship strategy insights.",
      "gameType": "compatibility_strategy",
      "inputs": ["profileA", "profileB"],
      "funBuild": {
        "theme": "synergy_vs_clash_board",
        "interactions": [
          "connect matching pillars",
          "show clash lines",
          "reveal emotional and growth zones"
        ],
        "feel": "dynamic, relational, insightful"
      }
    },
    {
      "system": "Vedic",
      "tab": "Games",
      "gameId": "vedic_guna_match",
      "title": "Guna Match Deep Dive",
      "playBrief": "Compare two charts using guna categories and reveal the score step by step.",
      "gameType": "compatibility_reveal",
      "inputs": ["profileA", "profileB"],
      "funBuild": {
        "theme": "ceremonial_match_reveal",
        "interactions": [
          "category-by-category reveal",
          "score meter buildup",
          "final compatibility outcome"
        ],
        "feel": "formal, meaningful, high-stakes"
      }
    },
    {
      "system": "Vedic",
      "tab": "Games",
      "gameId": "vedic_dasha_timeline",
      "title": "Dasha Timeline Game",
      "playBrief": "Generate major and sub-periods, then let the user explore the meaning of each life era.",
      "gameType": "timeline_exploration",
      "inputs": ["birthDate", "birthTime", "location_optional"],
      "funBuild": {
        "theme": "planetary_era_scroll",
        "interactions": [
          "tap planetary eras",
          "expand sub-periods",
          "see turning points"
        ],
        "feel": "cosmic, structured, deep"
      }
    },
    {
      "system": "Vedic",
      "tab": "Games",
      "gameId": "vedic_prashna_oracle",
      "title": "Prashna Question Oracle",
      "playBrief": "User asks a question, the system evaluates current timing/oracle logic, and reveals guidance.",
      "gameType": "oracle_question_response",
      "inputs": ["question", "currentDateTime"],
      "funBuild": {
        "theme": "sacred_oracle_ritual",
        "interactions": [
          "submit intention",
          "ritual pause",
          "slow answer reveal"
        ],
        "feel": "ceremonial, suspenseful, sacred"
      }
    },
    {
      "system": "Western",
      "tab": "Games",
      "gameId": "western_synastry_lab",
      "title": "Advanced Synastry Lab",
      "playBrief": "Compare two natal charts and reveal attraction, bonding, communication, conflict, and stability.",
      "gameType": "compatibility_analysis",
      "inputs": ["profileA", "profileB"],
      "funBuild": {
        "theme": "relationship_lab",
        "interactions": [
          "aspect cards reveal",
          "category score sections",
          "chart overlay highlights"
        ],
        "feel": "clean, modern, analytical"
      }
    },
    {
      "system": "Western",
      "tab": "Games",
      "gameId": "western_transit_impact",
      "title": "Transit Impact Game",
      "playBrief": "Compare current transits with natal placements to show active influences by life category.",
      "gameType": "live_daily_strategy",
      "inputs": ["birthData", "currentDateTime"],
      "funBuild": {
        "theme": "cosmic_weather_map",
        "interactions": [
          "live transit cards",
          "active zone highlights",
          "daily/weekly score panels"
        ],
        "feel": "alive, timely, useful"
      }
    },
    {
      "system": "Chinese Zodiac",
      "tab": "Games",
      "gameId": "chinese_zodiac_matrix",
      "title": "Zodiac Compatibility Matrix",
      "playBrief": "Compare two zodiac animals and reveal harmony, tension, support, rivalry, and match type.",
      "gameType": "compatibility_matrix",
      "inputs": ["profileA", "profileB"],
      "funBuild": {
        "theme": "animal_match_matrix",
        "interactions": [
          "animal pairing reveal",
          "matrix score display",
          "relationship archetype card"
        ],
        "feel": "playful, social, collectible"
      }
    },
    {
      "system": "Chinese Zodiac",
      "tab": "Games",
      "gameId": "chinese_fortune_stick_oracle",
      "title": "Fortune Stick Oracle",
      "playBrief": "The user asks a question, draws a stick, and receives a fortune with deeper interpretation.",
      "gameType": "oracle_draw",
      "inputs": ["question"],
      "funBuild": {
        "theme": "shake_and_draw_ritual",
        "interactions": [
          "shake container",
          "single stick reveal",
          "fortune card + guidance"
        ],
        "feel": "ritualistic, elegant, suspenseful"
      }
    },
    {
      "system": "Numerology",
      "tab": "Games",
      "gameId": "numerology_life_path_decoder",
      "title": "Life Path Deep Decoder",
      "playBrief": "Calculate core numerology numbers and reveal the user identity code in layered stages.",
      "gameType": "identity_decoder",
      "inputs": ["fullName", "birthDate"],
      "funBuild": {
        "theme": "number_identity_decoder",
        "interactions": [
          "numbers assemble visually",
          "layer-by-layer reveal",
          "final character code summary"
        ],
        "feel": "personal, sleek, satisfying"
      }
    }
  ],
  "resultScreenRules": {
    "show": [
      "headline",
      "score_if_relevant",
      "symbol_or_factor_breakdown",
      "summary",
      "deeper_insight_sections",
      "save",
      "replay",
      "history"
    ],
    "style": "premium_fun_clear"
  }
}