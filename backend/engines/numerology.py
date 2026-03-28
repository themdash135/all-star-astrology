from __future__ import annotations

from typing import Any

from .common import (
    PYTHAGOREAN_VALUES,
    alpha_only,
    clamp,
    consonants_value,
    current_context_snapshot,
    highlight,
    insight,
    map_score_to_label,
    pythagorean_value,
    reduce_number,
    round2,
    table,
    vowels_value,
)


NUMBER_THEMES = {
    1: "independence, initiative, self-definition",
    2: "partnership, sensitivity, diplomacy",
    3: "expression, creativity, visibility",
    4: "structure, discipline, consistency",
    5: "change, movement, experimentation",
    6: "care, responsibility, relational balance",
    7: "analysis, introspection, spiritual distance",
    8: "power, management, material execution",
    9: "completion, compassion, release",
    11: "intuition, inspiration, heightened perception",
    22: "master-building, scale, implementation",
    33: "teaching, stewardship, service",
}

# ── Life Path narratives ─────────────────────────────────────────
LIFE_PATH_NARRATIVES = {
    1: "Life Path 1 is The Pioneer — you are here to forge your own trail, lead by example, and master self-reliance. Your soul's curriculum is learning to trust your own vision and stand confidently alone when necessary. You are an originator, and your greatest fulfillment comes from creating something entirely your own.",
    2: "Life Path 2 is The Diplomat — you are here to master the art of partnership, patience, and emotional sensitivity. Your soul's curriculum is learning to balance giving and receiving, to mediate, and to find strength in cooperation rather than competition. You are the peacemaker who weaves people together.",
    3: "Life Path 3 is The Communicator — you are here to express, create, and inspire through words, art, or performance. Your soul's curriculum is learning to channel your abundant creative energy without scattering it. Joy is both your gift and your lesson — finding it, sharing it, and protecting it.",
    4: "Life Path 4 is The Builder — you are here to create lasting structures, systems, and security. Your soul's curriculum is learning that discipline and consistency are forms of devotion, not limitation. You are the foundation upon which others build their dreams.",
    5: "Life Path 5 is The Adventurer — you are here to experience freedom, change, and the full range of human sensation. Your soul's curriculum is learning to embrace transformation without losing your center. You teach others that change is not something to fear but something to ride.",
    6: "Life Path 6 is The Nurturer — you are here to master responsibility, love, and service to family and community. Your soul's curriculum is learning to care deeply without sacrificing yourself. You create beauty and harmony wherever you go, and others depend on your steady warmth.",
    7: "Life Path 7 is The Seeker — you are here to explore the mysteries of existence, to question, and to discover hidden truths. Your soul's curriculum is learning to trust both your intellect and your intuition. Solitude is your workshop, and wisdom is your ultimate product.",
    8: "Life Path 8 is The Powerhouse — you are here to master abundance, authority, and material achievement. Your soul's curriculum is learning to wield power with integrity and to understand that true wealth includes generosity. You are meant to build empires that serve a purpose greater than profit.",
    9: "Life Path 9 is The Humanitarian — you are here to complete, to release, and to serve the greater good. Your soul's curriculum is learning detachment with compassion — giving without keeping score. You carry the wisdom of all numbers before you and are meant to leave the world better than you found it.",
    11: "Life Path 11 is The Illuminator — a master number path of heightened intuition, spiritual insight, and inspirational leadership. Your soul's curriculum is learning to channel intense inner vision into practical reality without being overwhelmed. You are a lightning rod for ideas that change how others see the world.",
    22: "Life Path 22 is The Master Builder — the most powerful path in numerology, combining visionary idealism with practical execution at scale. Your soul's curriculum is learning to build something enduring that serves humanity. You think in blueprints while others think in sketches.",
    33: "Life Path 33 is The Master Teacher — the rarest path, dedicated to selfless service, healing, and uplifting humanity through love. Your soul's curriculum is learning to embody unconditional compassion while maintaining boundaries. You teach by example, and your presence alone is transformative.",
}

# ── Pinnacle number interpretations ──────────────────────────────
PINNACLE_INTERPRETATIONS = {
    1: "This pinnacle phase calls you to develop independence, self-confidence, and personal initiative. It is a time to step forward as a leader and trust your own judgment.",
    2: "This pinnacle phase asks for patience, diplomacy, and cooperation. Relationships and partnerships take center stage, and your growth comes through learning to collaborate.",
    3: "This pinnacle phase is about creative expression, social expansion, and finding your voice. Joy, art, and communication are your primary tools for growth.",
    4: "This pinnacle phase demands discipline, hard work, and building solid foundations. Progress may feel slow, but everything you construct now will endure.",
    5: "This pinnacle phase brings change, travel, and unexpected opportunities. Flexibility and courage are required — resist clinging to what is comfortable.",
    6: "This pinnacle phase centers on family, home, responsibility, and service. You are called to nurture and to create beauty and stability for those who depend on you.",
    7: "This pinnacle phase invites introspection, study, and spiritual development. You may feel drawn to solitude — honor it, as deep wisdom is being cultivated within you.",
    8: "This pinnacle phase is about material achievement, authority, and financial mastery. Ambition is rewarded, and you are learning to manage power with integrity.",
    9: "This pinnacle phase asks for completion, release, and compassionate service. Let go of what no longer serves you and focus on contributing to something greater than yourself.",
    11: "This pinnacle phase carries the energy of spiritual awakening and visionary inspiration. Intuitive flashes guide you — trust them, even when logic protests.",
    22: "This pinnacle phase calls you to build something of lasting significance. Think big, plan carefully, and know that you have the capacity to manifest on a grand scale.",
    33: "This pinnacle phase is about selfless service and teaching through love. Your personal growth is inseparable from how much you uplift others.",
}

# ── Challenge number interpretations ─────────────────────────────
CHALLENGE_INTERPRETATIONS = {
    0: "Your current challenge is the challenge of choice — all possibilities are open, and you must learn to define yourself without external limitations. This is rare and powerful.",
    1: "Your current challenge is learning to assert yourself without dominating others. Find the balance between independence and cooperation.",
    2: "Your current challenge is learning patience, diplomacy, and trusting the timing of partnerships. Avoid being overly sensitive or passive-aggressive.",
    3: "Your current challenge is learning to focus your creative energy and express yourself authentically without scattering or seeking approval.",
    4: "Your current challenge is learning to embrace discipline without becoming rigid, and to build structures that support rather than imprison.",
    5: "Your current challenge is learning to embrace change constructively and resist the urge to either flee from responsibility or resist all transformation.",
    6: "Your current challenge is learning to care for others without losing yourself, and to accept imperfection in those you love.",
    7: "Your current challenge is learning to trust others and open up emotionally, rather than retreating into isolation or excessive analysis.",
    8: "Your current challenge is learning to handle power, money, and authority without being consumed by ambition or fear of failure.",
    9: "Your current challenge is learning to release attachments, forgive freely, and serve without expecting recognition or reward.",
}

# ── Expression / Soul Urge / Personality interpretations ─────────
EXPRESSION_INTERPRETATIONS = {
    1: "You project leadership, originality, and a pioneering spirit. Others see you as someone who gets things started and is not afraid to go first.",
    2: "You project sensitivity, grace, and a cooperative nature. Others see you as a natural mediator and peacemaker.",
    3: "You project creativity, charm, and expressive energy. Others see you as entertaining, articulate, and full of life.",
    4: "You project reliability, practicality, and a strong work ethic. Others see you as the person who gets things done properly.",
    5: "You project versatility, magnetism, and a love of freedom. Others see you as dynamic, adventurous, and impossible to pin down.",
    6: "You project warmth, responsibility, and a nurturing presence. Others see you as the glue that holds groups and families together.",
    7: "You project depth, intelligence, and a mysterious quality. Others see you as thoughtful, analytical, and spiritually attuned.",
    8: "You project authority, business acumen, and material competence. Others see you as powerful, ambitious, and capable of handling large-scale endeavors.",
    9: "You project compassion, worldliness, and an inclusive spirit. Others see you as wise, generous, and connected to something larger than yourself.",
    11: "You project inspiration, spiritual insight, and visionary energy. Others see you as someone who operates on a higher frequency.",
    22: "You project mastery, ambition, and the ability to turn dreams into reality. Others see you as a builder of extraordinary things.",
    33: "You project unconditional love, wisdom, and a teaching presence. Others see you as a healer and spiritual guide.",
}

SOUL_URGE_INTERPRETATIONS = {
    1: "Deep down, you crave independence, originality, and the freedom to follow your own path without interference.",
    2: "Deep down, you crave harmony, partnership, and the comfort of knowing you are truly understood by another soul.",
    3: "Deep down, you crave joyful self-expression, creative recognition, and an audience for your ideas and art.",
    4: "Deep down, you crave order, security, and the satisfaction of building something that lasts.",
    5: "Deep down, you crave freedom, variety, and sensory experience — you need to feel alive through change and exploration.",
    6: "Deep down, you crave harmony, family, and beauty. Your heart is most at peace when those you love are safe and happy.",
    7: "Deep down, you crave understanding, solitude, and access to hidden truths. Your inner world is rich and demands exploration.",
    8: "Deep down, you crave achievement, recognition, and the ability to shape the material world according to your vision.",
    9: "Deep down, you crave meaning, service, and a life that contributes to the greater good of humanity.",
    11: "Deep down, you crave spiritual connection, inspiration, and the ability to channel higher wisdom into everyday life.",
    22: "Deep down, you crave the power to build something monumental — your inner drive is to leave a legacy that outlasts you.",
    33: "Deep down, you crave the ability to heal and uplift humanity through pure, unconditional love and selfless service.",
}

PERSONALITY_INTERPRETATIONS = {
    1: "Others perceive you as confident, independent, and assertive. You make a strong first impression and seem like a natural leader.",
    2: "Others perceive you as gentle, approachable, and tactful. You seem easy to confide in and naturally supportive.",
    3: "Others perceive you as charismatic, witty, and socially magnetic. You light up a room and seem effortlessly entertaining.",
    4: "Others perceive you as dependable, grounded, and no-nonsense. You seem practical, organized, and trustworthy.",
    5: "Others perceive you as exciting, attractive, and unpredictable. You seem like someone who lives life to the fullest.",
    6: "Others perceive you as caring, responsible, and aesthetically refined. You seem like the person everyone turns to for comfort.",
    7: "Others perceive you as reserved, intelligent, and somewhat enigmatic. You seem to know more than you reveal.",
    8: "Others perceive you as powerful, composed, and financially savvy. You carry an aura of authority and success.",
    9: "Others perceive you as cultured, compassionate, and worldly. You seem to understand people from all walks of life.",
    11: "Others perceive you as inspired, visionary, and operating on a different wavelength. You seem touched by something beyond the ordinary.",
    22: "Others perceive you as extraordinarily capable, systematic, and destined for large-scale achievement.",
    33: "Others perceive you as a source of light and wisdom — a natural healer whose presence alone is comforting.",
}

# ── Personal Year narratives ─────────────────────────────────────
PERSONAL_YEAR_NARRATIVES = {
    1: "a year of new beginnings, fresh starts, and planting seeds for the next nine-year cycle",
    2: "a year of patience, partnerships, and letting things develop at their own pace",
    3: "a year of creative expansion, social visibility, and joyful self-expression",
    4: "a year of hard work, foundation-building, and disciplined progress",
    5: "a year of change, freedom, and unexpected opportunities that demand flexibility",
    6: "a year of home, family, responsibility, and deepening commitments",
    7: "a year of reflection, inner work, and spiritual or intellectual deepening",
    8: "a power year for financial decisions, career advancement, and material achievement",
    9: "a year of completion, release, and clearing the way for what comes next",
    11: "a master number year of heightened intuition, spiritual downloads, and inspired action",
    22: "a master number year of visionary building and large-scale manifestation",
    33: "a master number year of profound teaching, healing, and selfless service",
}

PERSONAL_MONTH_FLAVORS = {
    1: "initiative and solo action",
    2: "cooperation and subtle sensitivity",
    3: "creative expression and social connection",
    4: "structure and methodical effort",
    5: "change and restless energy",
    6: "nurturing and domestic focus",
    7: "introspection and quiet analysis",
    8: "financial power and executive energy",
    9: "release, generosity, and completion",
    11: "intuitive flashes and spiritual intensity",
    22: "large-scale vision and practical mastery",
    33: "compassionate service and teaching",
}

PERSONAL_DAY_FLAVORS = {
    1: "bold action and new initiatives",
    2: "patience and diplomatic finesse",
    3: "communication, joy, and visibility",
    4: "methodical work and physical effort",
    5: "spontaneity and embracing the unexpected",
    6: "family, beauty, and acts of service",
    7: "solitude, study, and inner clarity",
    8: "financial decisions and power moves",
    9: "forgiveness, letting go, and humanitarian gestures",
    11: "inspired ideas and trusting your gut",
    22: "turning vision into concrete steps",
    33: "healing through presence and love",
}


def _digit_sum(value: str | int) -> int:
    return sum(int(char) for char in str(value) if char.isdigit())


def _life_path(birth_date) -> int:
    return reduce_number(_digit_sum(birth_date.strftime("%Y%m%d")))


def _birthday_number(day: int) -> tuple[int, int]:
    return day, reduce_number(day)


def _attitude_number(birth_date) -> int:
    return reduce_number(_digit_sum(f"{birth_date.month:02d}{birth_date.day:02d}"))


def _universal_year(year: int) -> int:
    return reduce_number(_digit_sum(year), keep_masters=False)


def _personal_year(birth_date, current_year: int) -> int:
    return reduce_number(_digit_sum(f"{birth_date.month:02d}{birth_date.day:02d}") + _universal_year(current_year))


def _personal_month(personal_year: int, current_month: int) -> int:
    return reduce_number(personal_year + current_month)


def _personal_day(personal_month: int, current_day: int) -> int:
    return reduce_number(personal_month + current_day)


def _pinnacles_and_challenges(birth_date, life_path: int) -> dict[str, Any]:
    month = reduce_number(birth_date.month, keep_masters=False)
    day = reduce_number(birth_date.day, keep_masters=False)
    year = reduce_number(_digit_sum(birth_date.year), keep_masters=False)

    pinnacle1 = reduce_number(month + day)
    pinnacle2 = reduce_number(day + year)
    pinnacle3 = reduce_number(pinnacle1 + pinnacle2)
    pinnacle4 = reduce_number(month + year)

    challenge1 = abs(day - month)
    challenge2 = abs(day - year)
    challenge3 = abs(challenge1 - challenge2)
    challenge4 = abs(month - year)

    first_end = 36 - reduce_number(life_path, keep_masters=False)
    return {
        "pinnacles": [pinnacle1, pinnacle2, pinnacle3, pinnacle4],
        "challenges": [challenge1, challenge2, challenge3, challenge4],
        "ranges": [
            f"0-{first_end}",
            f"{first_end + 1}-{first_end + 9}",
            f"{first_end + 10}-{first_end + 18}",
            f"{first_end + 19}+",
        ],
    }


def _active_pinnacle(age_years: float, life_path: int, data: dict[str, Any]) -> tuple[int, int, str]:
    first_end = 36 - reduce_number(life_path, keep_masters=False)
    if age_years <= first_end:
        return data["pinnacles"][0], data["challenges"][0], data["ranges"][0]
    if age_years <= first_end + 9:
        return data["pinnacles"][1], data["challenges"][1], data["ranges"][1]
    if age_years <= first_end + 18:
        return data["pinnacles"][2], data["challenges"][2], data["ranges"][2]
    return data["pinnacles"][3], data["challenges"][3], data["ranges"][3]


def _name_numbers(full_name: str) -> dict[str, Any]:
    if not alpha_only(full_name):
        return {}
    expression_total = pythagorean_value(full_name)
    soul_total = vowels_value(full_name, PYTHAGOREAN_VALUES)
    personality_total = consonants_value(full_name, PYTHAGOREAN_VALUES)
    return {
        "expression_total": expression_total,
        "expression": reduce_number(expression_total),
        "soul_urge_total": soul_total,
        "soul_urge": reduce_number(soul_total),
        "personality_total": personality_total,
        "personality": reduce_number(personality_total),
    }


def _apply(score_map: dict[str, float], reasons: dict[str, list[str]], key: str, delta: float, reason: str) -> None:
    score_map[key] += delta
    sign = "+" if delta >= 0 else ""
    reasons[key].append(f"{sign}{delta:.1f}: {reason}")


def calculate(context: dict[str, Any]) -> dict[str, Any]:
    birth_date = context["birth_date"]
    current_date = context["now_local"].date()
    full_name = context["full_name"]

    life_path = _life_path(birth_date)
    birthday_raw, birthday_reduced = _birthday_number(birth_date.day)
    attitude = _attitude_number(birth_date)
    universal_year = _universal_year(current_date.year)
    personal_year = _personal_year(birth_date, current_date.year)
    personal_month = _personal_month(personal_year, current_date.month)
    personal_day = _personal_day(personal_month, current_date.day)
    name_numbers = _name_numbers(full_name)
    pinnacle_data = _pinnacles_and_challenges(birth_date, life_path)
    active_pinnacle, active_challenge, active_range = _active_pinnacle(context["age_years"], life_path, pinnacle_data)

    maturity = reduce_number(life_path + (name_numbers.get("expression") or birthday_reduced))

    scores = {"love": 50.0, "career": 50.0, "health": 50.0, "wealth": 50.0, "mood": 50.0}
    reasons = {key: [] for key in scores}

    if life_path in {2, 6, 9, 11, 33}:
        _apply(scores, reasons, "love", 5.0, f"Life Path {life_path} is relationship-sensitive")
    if life_path in {1, 8, 22}:
        _apply(scores, reasons, "career", 5.0, f"Life Path {life_path} leans toward initiative and execution")
        _apply(scores, reasons, "wealth", 4.5, f"Life Path {life_path} leans toward material organization")
    if life_path in {4, 6}:
        _apply(scores, reasons, "health", 3.0, f"Life Path {life_path} favors consistent routines")
    if life_path in {3, 5, 11}:
        _apply(scores, reasons, "mood", 2.5, f"Life Path {life_path} is mentally or creatively active")
    if life_path == 7:
        _apply(scores, reasons, "mood", -2.5, "Life Path 7 often needs more space and quiet")

    if personal_year in {2, 6, 9}:
        _apply(scores, reasons, "love", 8.0, f"Personal Year {personal_year} puts relationships in focus")
    if personal_year in {1, 4, 8, 22}:
        _apply(scores, reasons, "career", 8.0, f"Personal Year {personal_year} supports work and direction")
        _apply(scores, reasons, "wealth", 6.0, f"Personal Year {personal_year} favors building or consolidation")
    if personal_year in {5}:
        _apply(scores, reasons, "career", 3.0, "Personal Year 5 supports movement and experimentation")
        _apply(scores, reasons, "mood", -2.0, "Personal Year 5 can feel overstimulating")
    if personal_year in {7}:
        _apply(scores, reasons, "career", -3.0, "Personal Year 7 favors reflection more than outward push")
        _apply(scores, reasons, "mood", -1.5, "Personal Year 7 can feel solitary")
    if personal_year in {4, 6, 7}:
        _apply(scores, reasons, "health", 4.0, f"Personal Year {personal_year} supports disciplined maintenance")

    if personal_month in {2, 6}:
        _apply(scores, reasons, "love", 3.0, f"Personal Month {personal_month} softens social tone")
    if personal_month in {8, 22}:
        _apply(scores, reasons, "wealth", 3.0, f"Personal Month {personal_month} is practical and results-oriented")
    if personal_day in {1, 3, 5}:
        _apply(scores, reasons, "career", 1.8, f"Personal Day {personal_day} supports action and communication")
    if personal_day in {6, 9}:
        _apply(scores, reasons, "love", 1.8, f"Personal Day {personal_day} supports empathy and connection")
    if personal_day in {4}:
        _apply(scores, reasons, "health", 1.5, "Personal Day 4 supports routine and order")

    if name_numbers:
        if name_numbers["expression"] in {1, 8, 22}:
            _apply(scores, reasons, "career", 3.5, f"Expression {name_numbers['expression']} amplifies execution")
            _apply(scores, reasons, "wealth", 2.5, f"Expression {name_numbers['expression']} amplifies administration")
        if name_numbers["soul_urge"] in {2, 6, 9, 11}:
            _apply(scores, reasons, "love", 3.5, f"Soul Urge {name_numbers['soul_urge']} values emotional connection")
        if name_numbers["personality"] in {3, 5}:
            _apply(scores, reasons, "mood", 2.0, f"Personality {name_numbers['personality']} keeps the tone lively")
        if name_numbers["expression"] == personal_year:
            _apply(scores, reasons, "career", 2.5, "Expression number aligns with the current year cycle")
        if name_numbers["soul_urge"] == personal_year:
            _apply(scores, reasons, "love", 2.5, "Soul Urge aligns with the current year cycle")

    if active_pinnacle in {8, 22}:
        _apply(scores, reasons, "career", 4.0, f"Active pinnacle {active_pinnacle} emphasizes construction and scale")
        _apply(scores, reasons, "wealth", 4.0, f"Active pinnacle {active_pinnacle} emphasizes results and management")
    if active_pinnacle in {2, 6, 9}:
        _apply(scores, reasons, "love", 3.0, f"Active pinnacle {active_pinnacle} emphasizes relational learning")
    if active_challenge in {4, 5}:
        _apply(scores, reasons, "mood", -2.0, f"Active challenge {active_challenge} adds tension around change or order")

    scores = {key: round2(clamp(value, 5, 95)) for key, value in scores.items()}

    core_rows = [
        ["Life Path", life_path, NUMBER_THEMES.get(life_path, "")],
        ["Birthday", f"{birthday_raw} / {birthday_reduced}", NUMBER_THEMES.get(birthday_reduced, "")],
        ["Attitude", attitude, NUMBER_THEMES.get(attitude, "")],
        ["Maturity", maturity, NUMBER_THEMES.get(maturity, "")],
    ]

    cycle_rows = [
        ["Universal Year", universal_year, NUMBER_THEMES.get(universal_year, "")],
        ["Personal Year", personal_year, NUMBER_THEMES.get(personal_year, "")],
        ["Personal Month", personal_month, NUMBER_THEMES.get(personal_month, "")],
        ["Personal Day", personal_day, NUMBER_THEMES.get(personal_day, "")],
        ["Active Pinnacle", active_pinnacle, f"Range {active_range}"],
        ["Active Challenge", active_challenge, NUMBER_THEMES.get(active_challenge, "")],
    ]

    pinnacle_rows = [
        [idx + 1, pinnacle, challenge, rng]
        for idx, (pinnacle, challenge, rng) in enumerate(zip(pinnacle_data["pinnacles"], pinnacle_data["challenges"], pinnacle_data["ranges"]))
    ]

    name_rows = []
    if name_numbers:
        name_rows = [
            ["Expression", name_numbers["expression_total"], name_numbers["expression"], NUMBER_THEMES.get(name_numbers["expression"], "")],
            ["Soul Urge", name_numbers["soul_urge_total"], name_numbers["soul_urge"], NUMBER_THEMES.get(name_numbers["soul_urge"], "")],
            ["Personality", name_numbers["personality_total"], name_numbers["personality"], NUMBER_THEMES.get(name_numbers["personality"], "")],
        ]

    driver_rows = []
    for category in ["love", "career", "health", "wealth", "mood"]:
        for line in reasons[category][:6]:
            driver_rows.append([category.title(), line])

    summary = [
        f"This numerology tab uses your birth date to compute the Life Path, Birthday, Attitude, current Personal Year, and longer pinnacle cycles. Your Life Path is {life_path}, which points toward {NUMBER_THEMES.get(life_path, '')}.",
        f"The active current cycle is Personal Year {personal_year}, Personal Month {personal_month}, and Personal Day {personal_day}. Those moving cycles drive the score set below.",
        f"The active pinnacle is {active_pinnacle} with challenge {active_challenge} across {active_range}, which adds the medium-term layer to the reading.",
    ]
    if name_numbers:
        summary.append(f"Because a name was provided, the tab also computes Expression {name_numbers['expression']}, Soul Urge {name_numbers['soul_urge']}, and Personality {name_numbers['personality']} numbers using the Pythagorean table.")

    highlights = [
        highlight("Life Path", life_path),
        highlight("Birthday", f"{birthday_raw} / {birthday_reduced}"),
        highlight("Attitude", attitude),
        highlight("Personal Year", personal_year),
        highlight("Personal Month", personal_month),
        highlight("Personal Day", personal_day),
        highlight("Active Pinnacle", active_pinnacle),
        highlight("Active Challenge", active_challenge),
    ]
    if name_numbers:
        highlights.extend([
            highlight("Expression", name_numbers["expression"]),
            highlight("Soul Urge", name_numbers["soul_urge"]),
            highlight("Personality", name_numbers["personality"]),
        ])

    # ── Build enriched insights ──
    lp_narrative = LIFE_PATH_NARRATIVES.get(life_path, f"Life Path {life_path} carries the themes of {NUMBER_THEMES.get(life_path, 'unique expression')}. This is your core vibration and lifelong lesson.")

    # Current timing narrative
    py_narrative = PERSONAL_YEAR_NARRATIVES.get(personal_year, f"a year aligned with the energy of {NUMBER_THEMES.get(personal_year, 'personal evolution')}")
    pm_flavor = PERSONAL_MONTH_FLAVORS.get(personal_month, f"the energy of {NUMBER_THEMES.get(personal_month, 'this cycle')}")
    pd_flavor = PERSONAL_DAY_FLAVORS.get(personal_day, f"the energy of {NUMBER_THEMES.get(personal_day, 'this day')}")
    timing_text = f"Personal Year {personal_year} + Month {personal_month} + Day {personal_day}: You are in {py_narrative}. This month adds {pm_flavor}, and today specifically favors {pd_flavor}."
    if personal_month in {11, 22, 33}:
        timing_text += f" The master number {personal_month} month amplifies intuitive and spiritual energy — trust your deeper knowing today."
    if personal_day in {11, 22, 33}:
        timing_text += f" A master number {personal_day} day signals a peak moment for inspired action."

    # Pinnacle and challenge interpretations
    pinnacle_meaning = PINNACLE_INTERPRETATIONS.get(active_pinnacle, f"Pinnacle {active_pinnacle} brings the energy of {NUMBER_THEMES.get(active_pinnacle, 'this vibration')} into your developmental arc.")
    challenge_meaning = CHALLENGE_INTERPRETATIONS.get(active_challenge, f"Challenge {active_challenge} asks you to work with the themes of {NUMBER_THEMES.get(active_challenge, 'growth and adaptation')}.")
    pinnacle_text = f"Active pinnacle {active_pinnacle} and challenge {active_challenge} describe your current developmental chapter (ages {active_range}). {pinnacle_meaning} {challenge_meaning}"

    insights = [
        insight("Life Path", lp_narrative),
        insight("Current timing", timing_text),
        insight("Pinnacles and challenges", pinnacle_text),
    ]
    if name_numbers:
        expr_num = name_numbers["expression"]
        soul_num = name_numbers["soul_urge"]
        pers_num = name_numbers["personality"]
        expr_text = EXPRESSION_INTERPRETATIONS.get(expr_num, f"Expression {expr_num} channels the energy of {NUMBER_THEMES.get(expr_num, 'your unique vibration')}.")
        soul_text = SOUL_URGE_INTERPRETATIONS.get(soul_num, f"Soul Urge {soul_num} resonates with {NUMBER_THEMES.get(soul_num, 'your inner drive')}.")
        pers_text = PERSONALITY_INTERPRETATIONS.get(pers_num, f"Personality {pers_num} projects {NUMBER_THEMES.get(pers_num, 'your outer image')}.")
        insights.append(insight("Expression", f"Expression number {expr_num}: {expr_text}"))
        insights.append(insight("Soul Urge", f"Soul Urge number {soul_num}: {soul_text}"))
        insights.append(insight("Personality", f"Personality number {pers_num}: {pers_text}"))

    tables = [
        table("Core numbers", ["Number", "Value", "Theme"], core_rows),
        table("Current cycles", ["Cycle", "Value", "Theme / detail"], cycle_rows),
        table("Pinnacles and challenges", ["Stage", "Pinnacle", "Challenge", "Age range"], pinnacle_rows),
    ]
    if name_rows:
        tables.append(table("Name numbers", ["Number", "Total", "Reduced", "Theme"], name_rows))
    tables.append(table("Score drivers", ["Area", "Driver"], driver_rows))

    return {
        "id": "numerology",
        "name": "Numerology",
        "headline": f"Life Path {life_path} in a Personal Year {personal_year}",
        "summary": summary,
        "highlights": highlights,
        "scores": {key: {"value": value, "label": map_score_to_label(value)} for key, value in scores.items()},
        "insights": insights,
        "tables": tables,
        "meta": {
            "engine_type": "Pythagorean birth-date numerology with current cycle overlays",
            "context": current_context_snapshot(context),
            "full_name_used": bool(name_numbers),
        },
    }
