"""Kabbalistic adapter — deterministic Tree-of-Life logic.

Uses:
  - Birth sefirah → permanent disposition
  - Name sefirah → identity vibration
  - Cycle sefirah → current-year emphasis
  - Soul / Personality sefirah → inner/outer tone
  - Personal Year / Month / Day sefirah (from Current cycles table)
  - Cycle path / Soul path → symbolic quality of current and inner gates
  - Pillar balance (Right/Left/Middle) → expansion vs restraint tendency
  - World (Olam) layer → depth of influence
  - Sefirah domain associations → life-area relevance boosts

Sefirot are mapped to three pillars:
  Right (Mercy)  → expansion, growth, compassion   (action/yang)
  Left (Severity) → restraint, discipline, structure (rest/yin)
  Middle (Balance) → harmony, integration            (neutral)

The adapter maps these pillar emphases to question options.
"""

from __future__ import annotations

from typing import Any

from ..schemas import ClassifiedIntent, EvidenceItem
from .base import (
    BaseAdapter,
    get_highlight_value,
    get_table_rows,
    option_polarities,
    polarity_to_stance,
)

# ── Sefirot → pillar → action polarity ────────────────────────────
# Keter(1), Tiferet(6), Yesod(9), Malkuth(10) = Middle
# Chokmah(2), Chesed(4), Netzach(7)            = Right (Mercy / expansion)
# Binah(3), Gevurah(5), Hod(8)                 = Left (Severity / restraint)

SEFIRAH_NAMES = {
    1: "Keter", 2: "Chokmah", 3: "Binah", 4: "Chesed", 5: "Gevurah",
    6: "Tiferet", 7: "Netzach", 8: "Hod", 9: "Yesod", 10: "Malkuth",
}

SEFIRAH_POLARITY: dict[str, float] = {
    # Right pillar → expansion / action
    "Chokmah":  0.6,   # wisdom, spark
    "Chesed":   0.7,   # mercy, growth, abundance
    "Netzach":  0.5,   # desire, persistence, victory
    # Left pillar → restraint / reflection
    "Binah":   -0.6,   # understanding, form, containment
    "Gevurah": -0.7,   # discipline, severity, restriction
    "Hod":     -0.4,   # intellect, analysis, order
    # Middle pillar → balance
    "Keter":    0.1,   # unity, potential
    "Tiferet":  0.0,   # harmony, beauty
    "Yesod":   -0.2,   # foundation, rest, dreams
    "Malkuth": -0.1,   # grounding, embodiment
}

# ── Sefirah domain associations ────────────────────────────────────
# Each sefirah governs specific life areas; weights reflect strength of
# association.  Used to boost evidence and amplify stance when the
# cycle sefirah's primary domain matches the questioned domain.

SEFIRAH_DOMAIN: dict[str, dict] = {
    "Keter":    {"domains": {"mood": 0.9, "health": 0.4},                   "quality": "divine will and unity"},
    "Chokmah":  {"domains": {"career": 0.7, "mood": 0.6, "wealth": 0.5},   "quality": "creative spark and vision"},
    "Binah":    {"domains": {"mood": 0.8, "health": 0.5, "career": 0.4},   "quality": "understanding and form"},
    "Chesed":   {"domains": {"love": 0.8, "wealth": 0.7, "mood": 0.6},     "quality": "abundance and mercy"},
    "Gevurah":  {"domains": {"career": 0.8, "health": 0.6, "mood": 0.5},   "quality": "discipline and boundaries"},
    "Tiferet":  {"domains": {"love": 0.7, "mood": 0.8, "health": 0.6},     "quality": "harmony and beauty"},
    "Netzach":  {"domains": {"love": 0.9, "mood": 0.7, "career": 0.4},     "quality": "desire and persistence"},
    "Hod":      {"domains": {"career": 0.7, "mood": 0.6, "wealth": 0.5},   "quality": "intellect and communication"},
    "Yesod":    {"domains": {"love": 0.6, "mood": 0.8, "health": 0.5},     "quality": "foundation and dreams"},
    "Malkuth":  {"domains": {"health": 0.8, "wealth": 0.6, "career": 0.5}, "quality": "manifestation and embodiment"},
}

# ── Pillar balance ─────────────────────────────────────────────────

PILLAR_MAP: dict[str, str] = {
    "Chokmah": "Right", "Chesed": "Right", "Netzach": "Right",
    "Binah": "Left",    "Gevurah": "Left",  "Hod": "Left",
    "Keter": "Middle",  "Tiferet": "Middle", "Yesod": "Middle", "Malkuth": "Middle",
}

PILLAR_POLARITY: dict[str, float] = {
    "Right": 0.5,
    "Left": -0.5,
    "Middle": 0.0,
}

# ── World (Olam) layer ─────────────────────────────────────────────
# Higher worlds are more abstract / latent; Assiah is most concrete.

WORLD_MAP: dict[str, str] = {
    "Keter": "Atzilut", "Chokmah": "Atzilut", "Binah": "Atzilut",
    "Chesed": "Briah",  "Gevurah": "Briah",    "Tiferet": "Briah",
    "Netzach": "Yetzirah", "Hod": "Yetzirah",  "Yesod": "Yetzirah",
    "Malkuth": "Assiah",
}

WORLD_POLARITY: dict[str, float] = {
    "Atzilut":  0.1,   # pure emanation — subtle lift
    "Briah":    0.2,   # creative realm — moderate action
    "Yetzirah": 0.0,   # formative realm — neutral
    "Assiah":  -0.2,   # material realm — grounding / restraint
}

# ── Path themes (simplified polarity for the 22 paths) ───────────

PATH_POLARITY: dict[str, float] = {
    "Aleph":  0.3,    # breath, openness
    "Beth":  -0.2,    # containment, shelter
    "Gimel":  0.4,    # movement, passage
    "Daleth": 0.0,    # threshold, receptivity
    "He":     0.3,    # revelation, emergence
    "Vav":    0.1,    # bonding, alignment
    "Zayin": -0.3,    # discernment, tension
    "Cheth": -0.4,    # containment, protection
    "Teth":  -0.2,    # hidden strength, cultivation
    "Yod":   -0.3,    # seed, concentration
    "Kaph":   0.2,    # capacity, transmission
    "Lamed":  0.4,    # aspiration, direction
    "Mem":   -0.5,    # depth, gestation
    "Nun":   -0.4,    # descent, renewal
    "Samekh":-0.2,    # support, centering
    "Ayin":   0.1,    # perception, appetite
    "Pe":     0.5,    # speech, declaration
    "Tzaddi":-0.3,    # discipline, refinement
    "Qoph":  -0.5,    # dream, subconscious
    "Resh":   0.4,    # mind, illumination
    "Shin":   0.7,    # fire, transformation, will
    "Tav":   -0.1,    # completion, embodiment
}

# ── Path domain associations ───────────────────────────────────────
# Each letter-path has affinity for certain life areas.

PATH_DOMAIN: dict[str, dict[str, float]] = {
    "Aleph":  {"mood": 0.8},
    "Beth":   {"career": 0.6, "wealth": 0.5},
    "Gimel":  {"wealth": 0.7, "career": 0.5},
    "Daleth": {"love": 0.8, "mood": 0.5},
    "He":     {"mood": 0.7, "health": 0.5},
    "Vav":    {"love": 0.7, "mood": 0.5},
    "Zayin":  {"career": 0.6, "mood": 0.5},
    "Cheth":  {"health": 0.6, "mood": 0.5},
    "Teth":   {"health": 0.7, "mood": 0.5},
    "Yod":    {"mood": 0.8, "career": 0.4},
    "Kaph":   {"wealth": 0.6, "career": 0.6},
    "Lamed":  {"career": 0.7, "mood": 0.6},
    "Mem":    {"mood": 0.9, "health": 0.5},
    "Nun":    {"health": 0.7, "mood": 0.7},
    "Samekh": {"mood": 0.7, "health": 0.5},
    "Ayin":   {"career": 0.5, "mood": 0.5},
    "Pe":     {"career": 0.7, "love": 0.5},
    "Tzaddi": {"career": 0.6, "health": 0.5},
    "Qoph":   {"mood": 0.9, "health": 0.4},
    "Resh":   {"career": 0.6, "mood": 0.6},
    "Shin":   {"mood": 0.8, "health": 0.6},
    "Tav":    {"health": 0.6, "mood": 0.6},
}

# ── Upgrade 61: Sefirot Proximity (Tree of Life adjacency) ───────

SEFIRAH_ADJACENCY: dict[str, set[str]] = {
    "Keter":   {"Chokmah", "Binah", "Tiferet"},
    "Chokmah": {"Keter", "Binah", "Chesed", "Tiferet"},
    "Binah":   {"Keter", "Chokmah", "Gevurah", "Tiferet"},
    "Chesed":  {"Chokmah", "Gevurah", "Tiferet", "Netzach"},
    "Gevurah": {"Binah", "Chesed", "Tiferet", "Hod"},
    "Tiferet": {"Keter", "Chesed", "Gevurah", "Netzach", "Hod", "Yesod"},
    "Netzach": {"Chesed", "Tiferet", "Hod", "Yesod"},
    "Hod":     {"Gevurah", "Tiferet", "Netzach", "Yesod"},
    "Yesod":   {"Tiferet", "Netzach", "Hod", "Malkuth"},
    "Malkuth": {"Yesod", "Netzach", "Hod"},
}

# ── Upgrade 62: Supernal / Abyss boundary ────────────────────────

SUPERNAL_SEFIROT: set[str] = {"Keter", "Chokmah", "Binah"}

# ── Upgrade 65: Letter element associations ──────────────────────

LETTER_ELEMENT: dict[str, str] = {
    "Aleph": "Air", "Mem": "Water", "Shin": "Fire",
}

ELEMENT_DOMAIN_AFFINITY: dict[str, dict[str, float]] = {
    "Fire":  {"career": 0.7, "mood": 0.5, "health": 0.4},
    "Water": {"love": 0.8, "mood": 0.7, "health": 0.5},
    "Air":   {"career": 0.5, "mood": 0.6, "love": 0.4},
}

# ── Upgrade 66: Sefirah pair harmony / tension ───────────────────

HARMONIOUS_PAIRS: set[frozenset] = {
    frozenset({"Chesed", "Netzach"}),
    frozenset({"Binah", "Hod"}),
    frozenset({"Chokmah", "Chesed"}),
    frozenset({"Tiferet", "Yesod"}),
    frozenset({"Keter", "Tiferet"}),
    frozenset({"Netzach", "Yesod"}),
}

TENSE_PAIRS: set[frozenset] = {
    frozenset({"Chesed", "Gevurah"}),
    frozenset({"Netzach", "Hod"}),
    frozenset({"Keter", "Malkuth"}),
    frozenset({"Chokmah", "Binah"}),
    frozenset({"Gevurah", "Netzach"}),
}

# ── Upgrade 67: Sefirah numeric position (1=Keter → 10=Malkuth) ──

SEFIRAH_POSITION: dict[str, int] = {
    "Keter": 1, "Chokmah": 2, "Binah": 3, "Chesed": 4, "Gevurah": 5,
    "Tiferet": 6, "Netzach": 7, "Hod": 8, "Yesod": 9, "Malkuth": 10,
}

# ── Upgrade 64: World domain affinities ──────────────────────────

WORLD_DOMAIN: dict[str, dict[str, float]] = {
    "Atzilut":  {"mood": 0.9, "love": 0.4},
    "Briah":    {"career": 0.6, "mood": 0.5, "wealth": 0.4},
    "Yetzirah": {"love": 0.6, "mood": 0.6, "health": 0.4},
    "Assiah":   {"health": 0.7, "wealth": 0.7, "career": 0.6},
}


# ── Module-level helpers ───────────────────────────────────────────

def _sefirah_polarity(name: str) -> float:
    """Get polarity for a sefirah name (case-insensitive partial match)."""
    name_lower = name.lower()
    for sname, pol in SEFIRAH_POLARITY.items():
        if sname.lower() in name_lower:
            return pol
    return 0.0


def _path_polarity(name: str) -> float:
    name_lower = name.lower()
    for pname, pol in PATH_POLARITY.items():
        if pname.lower() in name_lower:
            return pol
    return 0.0


def _normalize_sefirah(raw: str) -> str:
    """Return the canonical sefirah name by partial match, or the raw value."""
    raw_lower = raw.lower().strip()
    for name in SEFIRAH_POLARITY:
        if name.lower() in raw_lower or raw_lower in name.lower():
            return name
    return raw.strip()


def _normalize_path(raw: str) -> str:
    """Return the canonical path name by partial match, or the raw value."""
    raw_lower = raw.lower().strip()
    for name in PATH_POLARITY:
        if name.lower() in raw_lower or raw_lower in name.lower():
            return name
    return raw.strip()


def _sefirah_domain_boost(sefirah: str, domain_tags: list[str]) -> float:
    """Return the highest domain weight when the sefirah governs a questioned domain."""
    entry = SEFIRAH_DOMAIN.get(sefirah, {})
    domains = entry.get("domains", {})
    boost = 0.0
    for domain in domain_tags:
        boost = max(boost, domains.get(domain, 0.0))
    return boost


def _path_domain_weight(path: str, domain_tags: list[str]) -> float:
    """Return the highest path-domain weight for the questioned domains."""
    path_domains = PATH_DOMAIN.get(path, {})
    weight = 0.0
    for domain in domain_tags:
        weight = max(weight, path_domains.get(domain, 0.0))
    return weight


def _cycle_table_sefirah(rows: list[list], label: str) -> str | None:
    """Find a row in the Current cycles table and return its Sefirah column (col 2)."""
    label_lower = label.lower()
    for row in rows:
        if row and label_lower in str(row[0]).lower():
            if len(row) > 2:
                return str(row[2]).strip() or None
    return None


def _path_table_theme(rows: list[list], label: str) -> str | None:
    """Find a row in the Path gates table and return its Theme column (col 3)."""
    label_lower = label.lower()
    for row in rows:
        if row and label_lower in str(row[0]).lower():
            if len(row) > 3:
                return str(row[3]).strip() or None
    return None


def _path_table_path(rows: list[list], label: str) -> str | None:
    """Find a row in the Path gates table and return its Path column (col 2)."""
    label_lower = label.lower()
    for row in rows:
        if row and label_lower in str(row[0]).lower():
            if len(row) > 2:
                return str(row[2]).strip() or None
    return None


def _pillar_balance(sefirot: list[str]) -> tuple[dict[str, int], str]:
    """Count sefirot per pillar and derive a tendency label.

    Returns a counts dict and a summary string like
    '3 Right, 1 Left, 2 Middle → expansion emphasis'.
    """
    counts: dict[str, int] = {"Right": 0, "Left": 0, "Middle": 0}
    for s in sefirot:
        pillar = PILLAR_MAP.get(s)
        if pillar:
            counts[pillar] += 1

    right = counts["Right"]
    left = counts["Left"]
    middle = counts["Middle"]

    if right > left and right > middle:
        tendency = "expansion emphasis"
    elif left > right and left > middle:
        tendency = "restraint emphasis"
    elif middle >= right and middle >= left:
        tendency = "balance emphasis"
    elif right == left:
        tendency = "tension between expansion and restraint"
    else:
        tendency = "mixed influence"

    summary = f"{right} Right, {left} Left, {middle} Middle -> {tendency}"
    return counts, summary


# ── Upgrade 61 helper ────────────────────────────────────────────

def _are_adjacent(a: str, b: str) -> bool:
    """Check if two sefirot are adjacent on the Tree of Life."""
    return b in SEFIRAH_ADJACENCY.get(a, set())


# ── Upgrade 62 helper ────────────────────────────────────────────

def _crosses_abyss(a: str, b: str) -> bool:
    """Check if one sefirah is supernal and the other is lower."""
    if not a or not b:
        return False
    return (a in SUPERNAL_SEFIROT) != (b in SUPERNAL_SEFIROT)


# ── Upgrade 63 helper ────────────────────────────────────────────

def _pillar_severity(counts: dict[str, int]) -> float:
    """Continuous pillar imbalance severity 0.0-1.0."""
    total = sum(counts.values())
    if total == 0:
        return 0.0
    return abs(counts.get("Right", 0) - counts.get("Left", 0)) / total


# ── Upgrade 64 helper ────────────────────────────────────────────

def _world_resonance(sefirot: list[str]) -> tuple[str | None, int]:
    """Find world with 3+ sefirot. Returns (world, count) or (None, 0)."""
    world_counts: dict[str, int] = {}
    for s in sefirot:
        world = WORLD_MAP.get(s)
        if world:
            world_counts[world] = world_counts.get(world, 0) + 1
    best = max(world_counts.items(), key=lambda x: x[1], default=(None, 0))
    return (best[0], best[1]) if best[1] >= 3 else (None, 0)


# ── Upgrade 67 helper ────────────────────────────────────────────

def _tree_direction(sefirot_sequence: list[str]) -> str:
    """Detect ascent (toward Keter=1) or descent (toward Malkuth=10)."""
    positions = [SEFIRAH_POSITION[s] for s in sefirot_sequence if s in SEFIRAH_POSITION]
    if len(positions) < 2:
        return "stable"
    deltas = [positions[i + 1] - positions[i] for i in range(len(positions) - 1)]
    avg = sum(deltas) / len(deltas)
    if avg < -0.5:
        return "ascending"   # toward Keter (spiritual)
    if avg > 0.5:
        return "descending"  # toward Malkuth (material)
    return "stable"


# ── Upgrade 70 helper ────────────────────────────────────────────

def _cycle_phase(sefirah: str) -> tuple[str, str]:
    """Return (phase, description) from sefirah position."""
    pos = SEFIRAH_POSITION.get(sefirah, 5)
    if pos <= 3:
        return "initiation", "new beginnings and action"
    if pos <= 7:
        return "development", "growth and expansion"
    return "completion", "integration and patience"


class KabbalisticAdapter(BaseAdapter):
    system_id = "kabbalistic"
    system_name = "Kabbalistic"
    confidence_scale = 0.85

    def _extract_evidence(
        self,
        system_data: dict[str, Any],
        intent: ClassifiedIntent,
    ) -> list[EvidenceItem]:
        items: list[EvidenceItem] = []
        domain_tags = intent.domain_tags or []

        # ── Cycle table and path gate table rows ───────────────────
        cycle_rows = get_table_rows(system_data, "current cycles")
        path_rows = get_table_rows(system_data, "path gates")

        # ── Birth sefirah ──────────────────────────────────────────
        birth_sef = get_highlight_value(system_data, "birth sefirah")
        if birth_sef:
            items.append(EvidenceItem(feature="Birth sefirah", value=birth_sef, weight=0.7))

        # ── Name sefirah (identity vibration) ─────────────────────
        name_sef = get_highlight_value(system_data, "name sefirah")
        if name_sef:
            norm = _normalize_sefirah(name_sef)
            quality = SEFIRAH_DOMAIN.get(norm, {}).get("quality", "")
            value_str = f"{name_sef} — {quality}" if quality else name_sef
            # Boost for identity-touching domains (mood, love)
            id_relevant = any(d in domain_tags for d in ("mood", "love", "career"))
            weight = 0.65 if id_relevant else 0.50
            items.append(EvidenceItem(feature="Name sefirah", value=value_str, weight=weight))

        # ── Cycle sefirah (current year emphasis) ─────────────────
        cycle_sef = get_highlight_value(system_data, "cycle sefirah")
        if cycle_sef:
            weight = 0.85 if intent.time_horizon in ("this_year", "this_month", "general") else 0.6
            # Amplify when cycle sefirah's primary domain matches the question
            norm = _normalize_sefirah(cycle_sef)
            domain_boost = _sefirah_domain_boost(norm, domain_tags)
            if domain_boost >= 0.6:
                weight = min(weight + 0.10, 1.0)
            items.append(EvidenceItem(feature="Cycle sefirah", value=cycle_sef, weight=round(weight, 2)))

        # ── Soul sefirah ───────────────────────────────────────────
        soul_sef = get_highlight_value(system_data, "soul sefirah")
        if soul_sef:
            items.append(EvidenceItem(feature="Soul sefirah", value=soul_sef, weight=0.55))

        # ── Personality sefirah ────────────────────────────────────
        pers_sef = get_highlight_value(system_data, "personality sefirah")
        if pers_sef:
            items.append(EvidenceItem(feature="Personality sefirah", value=pers_sef, weight=0.45))

        # ── Personal Day sefirah (strongest short-term influence) ──
        pd_sef = _cycle_table_sefirah(cycle_rows, "personal day")
        if pd_sef:
            weight = 0.90 if intent.time_horizon in ("today", "tomorrow") else 0.55
            norm = _normalize_sefirah(pd_sef)
            domain_boost = _sefirah_domain_boost(norm, domain_tags)
            if domain_boost >= 0.6:
                weight = min(weight + 0.08, 1.0)
            items.append(EvidenceItem(
                feature="Personal Day sefirah",
                value=pd_sef,
                weight=round(weight, 2),
            ))

        # ── Personal Month sefirah ─────────────────────────────────
        pm_sef = _cycle_table_sefirah(cycle_rows, "personal month")
        if pm_sef:
            weight = 0.70 if intent.time_horizon == "this_month" else 0.50
            items.append(EvidenceItem(feature="Personal Month sefirah", value=pm_sef, weight=weight))

        # ── Cycle path ─────────────────────────────────────────────
        cycle_path = get_highlight_value(system_data, "cycle path")
        if cycle_path:
            items.append(EvidenceItem(feature="Cycle path", value=cycle_path, weight=0.7))

        # ── Name path ──────────────────────────────────────────────
        name_path = get_highlight_value(system_data, "name path")
        if name_path:
            items.append(EvidenceItem(feature="Name path", value=name_path, weight=0.4))

        # ── Soul path theme (from path gates table) ────────────────
        soul_path_name = _path_table_path(path_rows, "soul path")
        soul_path_theme = _path_table_theme(path_rows, "soul path")
        if soul_path_theme and soul_path_name:
            norm_sp = _normalize_path(soul_path_name)
            pd_weight = _path_domain_weight(norm_sp, domain_tags)
            weight = 0.55 if pd_weight >= 0.5 else 0.40
            items.append(EvidenceItem(
                feature="Soul path theme",
                value=f"{soul_path_name}: {soul_path_theme}",
                weight=weight,
            ))

        # ── Cycle path theme (from path gates table) ───────────────
        cycle_path_name = _path_table_path(path_rows, "cycle path")
        cycle_path_theme = _path_table_theme(path_rows, "cycle path")
        if cycle_path_theme and cycle_path_name:
            norm_cp = _normalize_path(cycle_path_name)
            pd_weight = _path_domain_weight(norm_cp, domain_tags)
            weight = 0.65 if pd_weight >= 0.5 else 0.50
            items.append(EvidenceItem(
                feature="Cycle path theme",
                value=f"{cycle_path_name}: {cycle_path_theme}",
                weight=weight,
            ))

        # ── Pillar balance (across all collected sefirot) ──────────
        all_sefirot = [
            _normalize_sefirah(s) for s in [
                birth_sef or "",
                name_sef or "",
                cycle_sef or "",
                soul_sef or "",
                pd_sef or "",
                pm_sef or "",
            ] if s
        ]
        if len(all_sefirot) >= 2:
            counts, balance_summary = _pillar_balance(all_sefirot)
            items.append(EvidenceItem(
                feature="Pillar balance",
                value=balance_summary,
                weight=0.45,
            ))

            # ── Upgrade 63: Pillar imbalance severity ────────────
            severity = _pillar_severity(counts)
            if severity > 0.5:
                items.append(EvidenceItem(
                    feature="Pillar imbalance",
                    value=f"severity {severity:.0%} — strong {'expansion' if counts.get('Right', 0) > counts.get('Left', 0) else 'restraint'} pull",
                    weight=0.50,
                    category="sefirah",
                ))

        # ── Upgrade 61: Sefirot proximity ─────────────────────────
        n_birth = _normalize_sefirah(birth_sef) if birth_sef else ""
        n_cycle = _normalize_sefirah(cycle_sef) if cycle_sef else ""
        n_pd = _normalize_sefirah(pd_sef) if pd_sef else ""
        if n_birth and n_cycle and _are_adjacent(n_birth, n_cycle):
            items.append(EvidenceItem(
                feature="Sefirot proximity",
                value=f"{n_birth} and {n_cycle} are neighbors on the Tree — resonance amplified",
                weight=0.65,
                category="sefirah",
            ))
        if n_pd and n_cycle and _are_adjacent(n_pd, n_cycle):
            items.append(EvidenceItem(
                feature="Day-Cycle proximity",
                value=f"Personal Day ({n_pd}) neighbors Cycle ({n_cycle}) — timing aligned",
                weight=0.55,
                category="sefirah",
            ))

        # ── Upgrade 62: Da'at / Abyss crossing ───────────────────
        if n_birth and n_cycle and _crosses_abyss(n_birth, n_cycle):
            items.append(EvidenceItem(
                feature="Abyss crossing",
                value=f"Birth ({n_birth}) and Cycle ({n_cycle}) span the Abyss — transformative period",
                weight=0.75,
                category="sefirah",
            ))

        # ── Upgrade 64: World layer resonance ─────────────────────
        if len(all_sefirot) >= 3:
            res_world, res_count = _world_resonance(all_sefirot)
            if res_world:
                items.append(EvidenceItem(
                    feature="World resonance",
                    value=f"{res_count} sefirot concentrate in {res_world} — {res_world} energies dominate",
                    weight=0.55,
                    category="sefirah",
                ))

        # ── Upgrade 65: Path letter element association ───────────
        cycle_path_name_ev = _normalize_path(cycle_path) if cycle_path else ""
        if cycle_path_name_ev:
            element = LETTER_ELEMENT.get(cycle_path_name_ev)
            if element:
                elem_domains = ELEMENT_DOMAIN_AFFINITY.get(element, {})
                elem_boost = max((elem_domains.get(d, 0.0) for d in domain_tags), default=0.0)
                if elem_boost > 0.3:
                    items.append(EvidenceItem(
                        feature="Path element",
                        value=f"{cycle_path_name_ev} carries {element} energy — {element} resonates with your question",
                        weight=0.45,
                        category="sefirah",
                    ))

        # ── Upgrade 66: Sefirah pair harmony/tension ──────────────
        pairs_to_check = [
            (n_birth, n_cycle, "Birth-Cycle"),
            (_normalize_sefirah(soul_sef) if soul_sef else "", _normalize_sefirah(pers_sef) if pers_sef else "", "Soul-Personality"),
        ]
        for a, b, label in pairs_to_check:
            if a and b and a != b:
                pair = frozenset({a, b})
                if pair in HARMONIOUS_PAIRS:
                    items.append(EvidenceItem(
                        feature="Sefirah harmony",
                        value=f"{label} pair ({a}-{b}) is harmonious — inner alignment",
                        weight=0.55,
                        category="sefirah",
                    ))
                elif pair in TENSE_PAIRS:
                    items.append(EvidenceItem(
                        feature="Sefirah tension",
                        value=f"{label} pair ({a}-{b}) creates tension — growth through friction",
                        weight=0.55,
                        category="sefirah",
                    ))

        # ── Upgrade 67: Tree ascent/descent detection ─────────────
        seq = [s for s in [n_birth, n_cycle, n_pd] if s and s in SEFIRAH_POSITION]
        if len(seq) >= 2:
            direction = _tree_direction(seq)
            if direction != "stable":
                items.append(EvidenceItem(
                    feature="Tree direction",
                    value=f"Sefirah journey is {direction} — {'spiritual deepening' if direction == 'ascending' else 'material grounding'}",
                    weight=0.50,
                    category="sefirah",
                ))

        # ── Upgrade 70: Cycle phase from Personal Day sefirah ─────
        if n_pd and n_pd in SEFIRAH_POSITION:
            phase, phase_desc = _cycle_phase(n_pd)
            items.append(EvidenceItem(
                feature="Cycle phase",
                value=f"Personal Day in {phase} phase — {phase_desc}",
                weight=0.45,
                category="sefirah",
            ))

        return items[:18]

    def _compute_stance(
        self,
        system_data: dict[str, Any],
        intent: ClassifiedIntent,
        evidence: list[EvidenceItem],
    ) -> dict[str, float]:
        options = intent.options or ["favorable", "cautious"]
        polarities = option_polarities(options)
        domain_tags = intent.domain_tags or []

        action_score = 0.0
        total_weight = 0.0

        cycle_rows = get_table_rows(system_data, "current cycles")
        path_rows = get_table_rows(system_data, "path gates")

        # ── Personal Day sefirah (strongest for today/tomorrow) ────
        pd_sef_raw = _cycle_table_sefirah(cycle_rows, "personal day") or ""
        pd_sef = _normalize_sefirah(pd_sef_raw)
        if pd_sef_raw:
            pol = _sefirah_polarity(pd_sef)
            # World layer nudge on top of base polarity
            world = WORLD_MAP.get(pd_sef, "Yetzirah")
            pol += WORLD_POLARITY.get(world, 0.0) * 0.3
            w = 3.0 if intent.time_horizon in ("today", "tomorrow") else 1.5
            # Domain amplification: if Personal Day sefirah governs the questioned domain
            domain_boost = _sefirah_domain_boost(pd_sef, domain_tags)
            if domain_boost >= 0.6:
                w *= 1.0 + (domain_boost * 0.4)
            action_score += pol * w
            total_weight += w

        # ── Cycle sefirah (current year — strong background influence) ─
        cycle_sef_raw = get_highlight_value(system_data, "cycle sefirah") or ""
        cycle_sef = _normalize_sefirah(cycle_sef_raw)
        if cycle_sef_raw:
            pol = _sefirah_polarity(cycle_sef)
            world = WORLD_MAP.get(cycle_sef, "Yetzirah")
            pol += WORLD_POLARITY.get(world, 0.0) * 0.3
            w = 2.5
            domain_boost = _sefirah_domain_boost(cycle_sef, domain_tags)
            if domain_boost >= 0.5:
                w *= 1.0 + (domain_boost * 0.3)
            action_score += pol * w
            total_weight += w

        # ── Personal Month sefirah (medium-term) ──────────────────
        pm_sef_raw = _cycle_table_sefirah(cycle_rows, "personal month") or ""
        pm_sef = _normalize_sefirah(pm_sef_raw)
        if pm_sef_raw:
            pol = _sefirah_polarity(pm_sef)
            w = 1.8 if intent.time_horizon == "this_month" else 0.9
            domain_boost = _sefirah_domain_boost(pm_sef, domain_tags)
            if domain_boost >= 0.5:
                w *= 1.0 + (domain_boost * 0.25)
            action_score += pol * w
            total_weight += w

        # ── Name sefirah (identity layer) ─────────────────────────
        name_sef_raw = get_highlight_value(system_data, "name sefirah") or ""
        name_sef = _normalize_sefirah(name_sef_raw)
        if name_sef_raw:
            pol = _sefirah_polarity(name_sef)
            world = WORLD_MAP.get(name_sef, "Yetzirah")
            pol += WORLD_POLARITY.get(world, 0.0) * 0.2
            w = 1.2
            action_score += pol * w
            total_weight += w

        # ── Birth sefirah (permanent background) ──────────────────
        birth_sef_raw = get_highlight_value(system_data, "birth sefirah") or ""
        birth_sef = _normalize_sefirah(birth_sef_raw)
        if birth_sef_raw:
            pol = _sefirah_polarity(birth_sef)
            action_score += pol * 1.0
            total_weight += 1.0

        # ── Soul sefirah ───────────────────────────────────────────
        soul_sef_raw = get_highlight_value(system_data, "soul sefirah") or ""
        if soul_sef_raw:
            pol = _sefirah_polarity(soul_sef_raw)
            action_score += pol * 0.8
            total_weight += 0.8

        # ── Pillar balance scoring ─────────────────────────────────
        # Collect all active sefirot; Right-heavy = action, Left-heavy = restraint
        all_sefirot = [
            s for s in [birth_sef, name_sef, cycle_sef, pd_sef, pm_sef,
                         _normalize_sefirah(soul_sef_raw)] if s
        ]
        if len(all_sefirot) >= 2:
            counts, _ = _pillar_balance(all_sefirot)
            total_active = sum(counts.values())
            if total_active > 0:
                pillar_score = sum(
                    PILLAR_POLARITY[pillar] * count
                    for pillar, count in counts.items()
                ) / total_active
                w = 1.0
                action_score += pillar_score * w
                total_weight += w

        # ── Cycle path (symbolic gate) ─────────────────────────────
        cycle_path_raw = get_highlight_value(system_data, "cycle path") or ""
        if cycle_path_raw:
            cycle_path_norm = _normalize_path(cycle_path_raw)
            pol = _path_polarity(cycle_path_raw)
            # Domain-specific path weight amplification
            pd_weight = _path_domain_weight(cycle_path_norm, domain_tags)
            w = 1.5 * (1.0 + pd_weight * 0.4)
            action_score += pol * w
            total_weight += w

        # ── Soul path (from path gates table) ─────────────────────
        soul_path_name = _path_table_path(path_rows, "soul path") or ""
        if soul_path_name:
            soul_path_norm = _normalize_path(soul_path_name)
            pol = _path_polarity(soul_path_name)
            pd_weight = _path_domain_weight(soul_path_norm, domain_tags)
            w = 0.8 * (1.0 + pd_weight * 0.3)
            action_score += pol * w
            total_weight += w

        # ── Upgrade 61: Sefirot proximity bonus ──────────────────
        if birth_sef_raw and cycle_sef_raw:
            if _are_adjacent(birth_sef, cycle_sef):
                action_score += 0.10
                total_weight += 0.5
        if pd_sef_raw and cycle_sef_raw:
            if _are_adjacent(pd_sef, cycle_sef):
                action_score += 0.06
                total_weight += 0.4

        # ── Upgrade 62: Abyss crossing signal ────────────────────
        if birth_sef_raw and cycle_sef_raw and _crosses_abyss(birth_sef, cycle_sef):
            is_action_q = intent.question_type in ("career_question", "emotional_state_question")
            abyss_push = 0.12 if is_action_q else -0.08
            action_score += abyss_push
            total_weight += 0.6

        # ── Upgrade 63: Pillar imbalance confidence adjustment ───
        if len(all_sefirot) >= 2:
            counts_st, _ = _pillar_balance(all_sefirot)
            severity = _pillar_severity(counts_st)
            if severity > 0.6:
                # Extreme imbalance → push toward dominant pillar
                dominant_pol = 0.3 if counts_st.get("Right", 0) > counts_st.get("Left", 0) else -0.3
                action_score += dominant_pol * severity * 0.5
                total_weight += 0.4

        # ── Upgrade 64: World resonance amplification ────────────
        if len(all_sefirot) >= 3:
            res_world, _ = _world_resonance(all_sefirot)
            if res_world:
                w_pol = WORLD_POLARITY.get(res_world, 0.0) * 1.5
                action_score += w_pol
                total_weight += 0.5

        # ── Upgrade 65: Path letter element signal ───────────────
        cycle_path_raw_st = get_highlight_value(system_data, "cycle path") or ""
        if cycle_path_raw_st:
            cp_norm = _normalize_path(cycle_path_raw_st)
            element = LETTER_ELEMENT.get(cp_norm)
            if element:
                elem_domains = ELEMENT_DOMAIN_AFFINITY.get(element, {})
                elem_boost = max((elem_domains.get(d, 0.0) for d in domain_tags), default=0.0)
                if elem_boost > 0.3:
                    action_score += elem_boost * 0.15
                    total_weight += 0.3

        # ── Upgrade 66: Sefirah pair harmony/tension ─────────────
        soul_sef_norm = _normalize_sefirah(soul_sef_raw) if soul_sef_raw else ""
        pairs_stance = [
            (birth_sef, cycle_sef),
            (soul_sef_norm, _normalize_sefirah(get_highlight_value(system_data, "personality sefirah") or "")),
        ]
        for a, b in pairs_stance:
            if a and b and a != b:
                pair = frozenset({a, b})
                if pair in HARMONIOUS_PAIRS:
                    action_score += 0.08
                    total_weight += 0.4
                elif pair in TENSE_PAIRS:
                    action_score -= 0.06
                    total_weight += 0.4

        # ── Upgrade 67: Tree direction signal ────────────────────
        seq = [s for s in [birth_sef, cycle_sef, pd_sef] if s and s in SEFIRAH_POSITION]
        if len(seq) >= 2:
            direction = _tree_direction(seq)
            if direction == "ascending":
                # Spiritual ascent: mood/love boost
                push = 0.06 if any(d in domain_tags for d in ("mood", "love")) else 0.02
                action_score += push
                total_weight += 0.3
            elif direction == "descending":
                # Material descent: career/wealth boost
                push = 0.06 if any(d in domain_tags for d in ("career", "wealth")) else 0.02
                action_score += push
                total_weight += 0.3

        # ── Upgrade 68: Domain cascade (double domain boost) ─────
        if pd_sef and cycle_sef:
            pd_dom = _sefirah_domain_boost(pd_sef, domain_tags)
            cy_dom = _sefirah_domain_boost(cycle_sef, domain_tags)
            if pd_dom >= 0.6 and cy_dom >= 0.6:
                cascade_push = (pd_dom + cy_dom) * 0.12
                action_score += cascade_push
                total_weight += 0.6

        # ── Upgrade 69: Path gate theme domain matching ──────────
        for gate_label in ("soul path", "cycle path"):
            theme = _path_table_theme(path_rows, gate_label)
            if theme:
                theme_lower = theme.lower()
                domain_match = any(d in theme_lower for d in domain_tags)
                if domain_match:
                    action_score += 0.08
                    total_weight += 0.4

        # ── Upgrade 70: Cycle phase timing signal ────────────────
        if pd_sef and pd_sef in SEFIRAH_POSITION:
            phase, _ = _cycle_phase(pd_sef)
            is_action_q = intent.question_type in ("binary_decision", "career_question", "timing_question")
            if phase == "initiation" and is_action_q:
                action_score += 0.08
                total_weight += 0.4
            elif phase == "completion" and is_action_q:
                action_score -= 0.04
                total_weight += 0.4
            elif phase == "completion" and intent.question_type == "timing_question":
                action_score += 0.08
                total_weight += 0.4

        raw = action_score / total_weight if total_weight > 0 else 0.0
        return polarity_to_stance(options, raw)
