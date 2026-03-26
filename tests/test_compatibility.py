"""Tests for the Love & Compatibility engine — tiered output, playbook, and edge cases."""
import pytest
from backend.engines.compatibility import (
    compute,
    _western_compat,
    _vedic_compat,
    _chinese_compat,
    _bazi_compat,
    _numerology_compat,
    _kabbalistic_compat,
    _gematria_compat,
    _persian_compat,
    _build_relationship_playbook,
    _synthesize_tier1,
    _build_relationship_roles,
    _build_when_you_clash,
    VALID_INTENTS,
    SYSTEM_META,
)


# ─── Fixtures ──────────────────────────────────────────────

def _make_reading(**overrides):
    """Minimal reading dict with system stubs."""
    base = {
        "systems": {
            "western": {
                "positions": {
                    "Sun": {"sign": "Aries", "degree": 15},
                    "Moon": {"sign": "Cancer", "degree": 10},
                    "Venus": {"sign": "Pisces", "degree": 20},
                    "Mars": {"sign": "Aries", "degree": 5},
                },
            },
            "vedic": {
                "nakshatra": {"name": "Ashwini"},
                "positions": {"Moon": {"sign": "Aries"}},
                "house_lords": {"7": "Venus"},
            },
            "chinese": {"year_animal": "Dragon", "element": "Wood"},
            "bazi": {
                "day_master": "Jia Wood",
                "day_master_element": "Wood",
                "day_master_profile": {"relationships": "Loyal and protective"},
                "branch_interactions": [],
            },
            "numerology": {"life_path": 7, "soul_urge": 3, "expression": 5},
            "kabbalistic": {"birth_sefirah": 6, "soul_sefirah": 6},
            "gematria": {"text_root": 5, "total": 127},
            "persian": {"temperament": "Sanguine", "lunar_mansion": {"name": "Al-Thurayya"}},
        },
        "meta": {},
    }
    base.update(overrides)
    return base


@pytest.fixture
def happy_pair():
    u = _make_reading()
    p = _make_reading(
        systems={
            "western": {
                "positions": {
                    "Sun": {"sign": "Leo", "degree": 5},
                    "Moon": {"sign": "Scorpio", "degree": 22},
                    "Venus": {"sign": "Libra", "degree": 18},
                    "Mars": {"sign": "Sagittarius", "degree": 12},
                },
            },
            "vedic": {
                "nakshatra": {"name": "Magha"},
                "positions": {"Moon": {"sign": "Leo"}},
                "house_lords": {"7": "Mars"},
            },
            "chinese": {"year_animal": "Monkey", "element": "Fire"},
            "bazi": {
                "day_master": "Bing Fire",
                "day_master_element": "Fire",
                "day_master_profile": {"relationships": "Warm and generous"},
                "branch_interactions": [],
            },
            "numerology": {"life_path": 3, "soul_urge": 9, "expression": 1},
            "kabbalistic": {"birth_sefirah": 4, "soul_sefirah": 7},
            "gematria": {"text_root": 2, "total": 83},
            "persian": {"temperament": "Choleric", "lunar_mansion": {"name": "Al-Dabaran"}},
        }
    )
    return u, p


@pytest.fixture
def empty_reading():
    return {"systems": {}, "meta": {}}


# ─── PHASE 1: API response shape ──────────────────────────

class TestResponseShape:
    def test_top_level_keys(self, happy_pair):
        u, p = happy_pair
        r = compute(u, p, "Alice", "Bob")
        expected = {"overall_score", "verdict", "verdict_prose", "user_name", "partner_name",
                    "systems", "couple_guide", "tier1_synthesis", "relationship_roles",
                    "when_you_clash", "relationship_playbook", "intent"}
        assert expected == set(r.keys())

    def test_all_eight_systems_present(self, happy_pair):
        u, p = happy_pair
        r = compute(u, p, "A", "B")
        assert set(r["systems"].keys()) == {
            "western", "vedic", "chinese", "bazi",
            "numerology", "kabbalistic", "gematria", "persian",
        }

    def test_every_system_has_tier(self, happy_pair):
        u, p = happy_pair
        r = compute(u, p, "A", "B")
        for sid, s in r["systems"].items():
            assert "tier" in s, f"{sid} missing tier"
            assert s["tier"] in (1, 2, 3), f"{sid} has invalid tier {s['tier']}"

    def test_tier_assignments_match_spec(self, happy_pair):
        u, p = happy_pair
        r = compute(u, p, "A", "B")
        assert r["systems"]["western"]["tier"] == 1
        assert r["systems"]["vedic"]["tier"] == 1
        assert r["systems"]["bazi"]["tier"] == 1
        assert r["systems"]["chinese"]["tier"] == 2
        assert r["systems"]["kabbalistic"]["tier"] == 2
        assert r["systems"]["numerology"]["tier"] == 2
        assert r["systems"]["gematria"]["tier"] == 3
        assert r["systems"]["persian"]["tier"] == 3

    def test_system_meta_all_have_tiers(self):
        for sid, meta in SYSTEM_META.items():
            assert "tier" in meta, f"SYSTEM_META[{sid}] missing tier"

    def test_playbook_keys(self, happy_pair):
        u, p = happy_pair
        r = compute(u, p, "A", "B")
        pb = r["relationship_playbook"]
        expected = {"what_works", "what_breaks", "daily_behaviors", "top_mistake", "long_term"}
        assert expected == set(pb.keys())

    def test_playbook_daily_behaviors_count(self, happy_pair):
        u, p = happy_pair
        r = compute(u, p, "A", "B")
        behaviors = r["relationship_playbook"]["daily_behaviors"]
        assert 1 <= len(behaviors) <= 3

    def test_couple_guide_keys(self, happy_pair):
        u, p = happy_pair
        r = compute(u, p, "A", "B")
        cg = r["couple_guide"]
        for key in ["who_you_are", "who_they_are", "how_you_clash",
                     "how_to_make_them_happy", "how_they_make_you_happy",
                     "living_together", "all_strengths", "all_challenges"]:
            assert key in cg, f"couple_guide missing {key}"


# ─── PHASE 2: Empty / partial data ───────────────────────

class TestEdgeCases:
    def test_empty_readings_no_crash(self, empty_reading):
        r = compute(empty_reading, empty_reading, "", "")
        assert isinstance(r["overall_score"], int)
        assert len(r["systems"]) == 8

    def test_empty_readings_playbook_present(self, empty_reading):
        r = compute(empty_reading, empty_reading, "", "")
        pb = r["relationship_playbook"]
        assert pb["what_works"]
        assert pb["what_breaks"]
        assert len(pb["daily_behaviors"]) >= 1

    def test_partial_one_system(self, empty_reading):
        partial = _make_reading(
            systems={
                "western": {
                    "positions": {
                        "Sun": {"sign": "Gemini"},
                        "Moon": {"sign": "Aquarius"},
                        "Venus": {"sign": "Taurus"},
                        "Mars": {"sign": "Leo"},
                    }
                }
            }
        )
        r = compute(partial, empty_reading, "X", "Y")
        assert len(r["systems"]) == 8
        assert r["relationship_playbook"]["what_works"]

    def test_self_comparison(self, happy_pair):
        u, _ = happy_pair
        r = compute(u, u, "Me", "Me")
        assert r["overall_score"] >= 0
        assert r["verdict"]
        assert len(r["relationship_playbook"]["daily_behaviors"]) >= 1

    def test_names_empty_strings(self, happy_pair):
        u, p = happy_pair
        r = compute(u, p, "", "")
        # Should not crash, and playbook should still work
        assert r["relationship_playbook"]["what_works"]


# ─── PHASE 3: No jargon / scores in output ───────────────

class TestContentQuality:
    def test_no_raw_scores_in_strengths(self, happy_pair):
        u, p = happy_pair
        r = compute(u, p, "A", "B")
        for sid, s in r["systems"].items():
            for item in s.get("strengths", []):
                assert "/6" not in item, f"{sid} strength has /6 jargon: {item}"
                assert "/5" not in item, f"{sid} strength has /5 jargon: {item}"
                assert "/4" not in item, f"{sid} strength has /4 jargon: {item}"

    def test_no_raw_percentages_in_strengths(self, happy_pair):
        u, p = happy_pair
        r = compute(u, p, "A", "B")
        for sid, s in r["systems"].items():
            for item in s.get("strengths", []):
                assert "%" not in item, f"{sid} strength has percentage: {item}"

    def test_no_generic_fallback_text(self, happy_pair):
        u, p = happy_pair
        r = compute(u, p, "A", "B")
        for sid, s in r["systems"].items():
            for item in s.get("strengths", []) + s.get("challenges", []):
                assert "No specific signals detected" not in item, f"{sid} has generic fallback"

    def test_polished_fallbacks_when_empty(self, empty_reading):
        r = compute(empty_reading, empty_reading, "A", "B")
        for sid, s in r["systems"].items():
            for item in s.get("strengths", []) + s.get("challenges", []):
                assert len(item) > 20, f"{sid} fallback too short: {item}"
                assert "No specific signals" not in item

    def test_vedic_strengths_plain_english(self):
        """Vedic strengths should use plain English, not raw Kuta scores."""
        u = {"nakshatra": {"name": "Pushya"}, "positions": {"Moon": {"sign": "Cancer"}}, "house_lords": {"7": "Moon"}}
        p = {"nakshatra": {"name": "Ashwini"}, "positions": {"Moon": {"sign": "Aries"}}, "house_lords": {"7": "Mars"}}
        r = _vedic_compat(u, p)
        for s in r["strengths"]:
            assert "/6" not in s and "/5" not in s and "/4" not in s, f"Vedic strength has jargon: {s}"

    def test_numerology_no_percentage(self):
        r = _numerology_compat({"life_path": 3, "soul_urge": 6, "expression": 9},
                               {"life_path": 9, "soul_urge": 3, "expression": 6})
        for s in r["strengths"]:
            if s:
                assert "%" not in s, f"Numerology strength has percentage: {s}"


# ─── PHASE 4: Gematria bridge number ─────────────────────

class TestGematriaBridge:
    def test_bridge_zero_maps_to_nine(self):
        r = _gematria_compat({"text_root": 5, "total": 0}, {"text_root": 5, "total": 0})
        assert r["bridge_number"] == 9

    def test_bridge_normal_case(self):
        r = _gematria_compat({"text_root": 3, "total": 127}, {"text_root": 7, "total": 83})
        assert 1 <= r["bridge_number"] <= 33

    def test_bridge_in_dynamic_text(self):
        r = _gematria_compat({"text_root": 5, "total": 0}, {"text_root": 5, "total": 0})
        # Should mention bridge 9, not bridge 0
        assert "0" not in r["dynamic"] or "9" in r["dynamic"]


# ─── PHASE 5: Playbook length and dedup ──────────────────

class TestPlaybookGuards:
    def test_playbook_fields_under_length_limits(self, happy_pair):
        u, p = happy_pair
        r = compute(u, p, "A", "B")
        pb = r["relationship_playbook"]
        assert len(pb["what_works"]) <= 401
        assert len(pb["what_breaks"]) <= 401
        assert len(pb["top_mistake"]) <= 351
        assert len(pb["long_term"]) <= 401
        for b in pb["daily_behaviors"]:
            assert len(b) <= 301

    def test_playbook_no_duplicate_behaviors(self, happy_pair):
        u, p = happy_pair
        r = compute(u, p, "A", "B")
        behaviors = r["relationship_playbook"]["daily_behaviors"]
        # No two behaviors should start the same way
        starts = [b[:40].lower() for b in behaviors]
        assert len(starts) == len(set(starts)), "Duplicate daily behaviors detected"

    def test_playbook_all_fields_nonempty(self, happy_pair):
        u, p = happy_pair
        r = compute(u, p, "A", "B")
        pb = r["relationship_playbook"]
        for key in ["what_works", "what_breaks", "top_mistake", "long_term"]:
            assert pb[key] and len(pb[key]) > 30, f"Playbook {key} too short or empty"

    def test_playbook_personalized_for_high_score(self):
        """High-score playbook should mention complacency or natural resonance."""
        systems = {}
        pb = _build_relationship_playbook(systems, "Jeff", "Sarah", 80)
        # High-score path
        assert "resonance" in pb["what_works"].lower() or "natural" in pb["what_works"].lower()

    def test_playbook_personalized_for_low_score(self):
        """Low-score playbook should mention growth or effort."""
        systems = {}
        pb = _build_relationship_playbook(systems, "Jeff", "Sarah", 40)
        assert "growth" in pb["what_works"].lower() or "effort" in pb["what_works"].lower() or "curiosity" in pb["what_works"].lower()


# ─── PHASE 6: Per-system compat functions ────────────────

class TestPerSystemCompat:
    def test_western_score_bounded(self):
        r = _western_compat(
            {"positions": {"Sun": {"sign": "Aries"}, "Moon": {"sign": "Cancer"}, "Venus": {"sign": "Pisces"}, "Mars": {"sign": "Leo"}}},
            {"positions": {"Sun": {"sign": "Libra"}, "Moon": {"sign": "Capricorn"}, "Venus": {"sign": "Virgo"}, "Mars": {"sign": "Aquarius"}}},
        )
        assert 20 <= r["score"] <= 95

    def test_chinese_clash_detected(self):
        r = _chinese_compat(
            {"year_animal": "Rat", "element": "Water"},
            {"year_animal": "Horse", "element": "Fire"},
        )
        assert r["relationship_type"] == "Six Clash"
        assert r["score"] < 50

    def test_chinese_trine_detected(self):
        r = _chinese_compat(
            {"year_animal": "Rat", "element": "Water"},
            {"year_animal": "Dragon", "element": "Earth"},
        )
        assert r["relationship_type"] == "Trine Harmony"
        assert r["score"] >= 80

    def test_bazi_productive_cycle(self):
        r = _bazi_compat(
            {"day_master": "Jia Wood", "day_master_element": "Wood", "day_master_profile": {}, "branch_interactions": []},
            {"day_master": "Bing Fire", "day_master_element": "Fire", "day_master_profile": {}, "branch_interactions": []},
        )
        assert r["score"] >= 75  # productive cycle

    def test_persian_temperament_compat(self):
        r = _persian_compat(
            {"temperament": "Sanguine", "lunar_mansion": {"name": ""}},
            {"temperament": "Phlegmatic", "lunar_mansion": {"name": ""}},
        )
        assert r["score"] >= 75  # classic complement

    def test_kabbalistic_same_sefirah_bonus(self):
        r1 = _kabbalistic_compat({"birth_sefirah": 6, "soul_sefirah": 6}, {"birth_sefirah": 6, "soul_sefirah": 6})
        r2 = _kabbalistic_compat({"birth_sefirah": 6, "soul_sefirah": 6}, {"birth_sefirah": 6, "soul_sefirah": 1})
        assert r1["score"] >= r2["score"]  # same soul sefirah bonus


# ─── PHASE 7: Verdict categories ─────────────────────────

class TestVerdicts:
    def test_verdict_is_string(self, happy_pair):
        u, p = happy_pair
        r = compute(u, p, "A", "B")
        assert isinstance(r["verdict"], str) and len(r["verdict"]) > 0

    def test_verdict_prose_is_string(self, happy_pair):
        u, p = happy_pair
        r = compute(u, p, "A", "B")
        assert isinstance(r["verdict_prose"], str) and len(r["verdict_prose"]) > 30

    def test_score_bounded(self, happy_pair):
        u, p = happy_pair
        r = compute(u, p, "A", "B")
        assert 0 <= r["overall_score"] <= 100


# ─── PHASE 8: Tier 1 Synthesis ──────────────────────────────

class TestTier1Synthesis:
    def test_synthesis_present_in_response(self, happy_pair):
        u, p = happy_pair
        r = compute(u, p, "Alice", "Bob")
        assert "tier1_synthesis" in r
        s = r["tier1_synthesis"]
        assert "narrative" in s
        assert "theme_count" in s

    def test_synthesis_narrative_not_empty(self, happy_pair):
        u, p = happy_pair
        r = compute(u, p, "Alice", "Bob")
        assert len(r["tier1_synthesis"]["narrative"]) > 100

    def test_synthesis_narrative_under_length_limit(self, happy_pair):
        u, p = happy_pair
        r = compute(u, p, "A", "B")
        assert len(r["tier1_synthesis"]["narrative"]) <= 2000

    def test_synthesis_has_multiple_themes(self, happy_pair):
        u, p = happy_pair
        r = compute(u, p, "A", "B")
        assert r["tier1_synthesis"]["theme_count"] >= 3

    def test_synthesis_no_system_labels(self, happy_pair):
        u, p = happy_pair
        r = compute(u, p, "A", "B")
        narrative = r["tier1_synthesis"]["narrative"].lower()
        for label in ["western astrology", "vedic astrology", "bazi", "four pillars"]:
            assert label not in narrative, f"Synthesis contains system label '{label}'"

    def test_synthesis_paragraphs_readable(self, happy_pair):
        u, p = happy_pair
        r = compute(u, p, "A", "B")
        paras = r["tier1_synthesis"]["narrative"].split("\n\n")
        for p in paras:
            assert len(p) <= 500, f"Paragraph too long ({len(p)} chars): {p[:60]}..."

    def test_synthesis_empty_readings(self, empty_reading):
        r = compute(empty_reading, empty_reading, "X", "Y")
        s = r["tier1_synthesis"]
        assert len(s["narrative"]) > 50
        assert s["theme_count"] >= 3

    def test_synthesis_direct_call_high_score(self):
        """High-score synthesis should mention resonance or natural."""
        systems = {
            "western": {"score": 85, "strengths": ["Strong emotional understanding"],
                        "challenges": [], "user_profile": {}, "partner_profile": {}},
            "vedic": {"score": 80, "strengths": ["Gana harmony"], "challenges": [],
                      "user_profile": {"gana": "Deva"}, "partner_profile": {"gana": "Deva"}},
            "bazi": {"score": 82, "strengths": [], "challenges": [],
                     "element_dynamic": {"type": "productive"},
                     "user_profile": {"needs": "space"}, "partner_profile": {"needs": "warmth"}},
        }
        s = _synthesize_tier1(systems, "A", "B", 82)
        assert "resonance" in s["narrative"].lower() or "natural" in s["narrative"].lower()

    def test_synthesis_direct_call_low_score(self):
        """Low-score synthesis should mention growth or friction."""
        systems = {
            "western": {"score": 40, "strengths": [], "challenges": ["Emotional disconnect"],
                        "user_profile": {}, "partner_profile": {}},
            "vedic": {"score": 35, "strengths": [], "challenges": [],
                      "user_profile": {"gana": "Deva"}, "partner_profile": {"gana": "Rakshasa"}},
            "bazi": {"score": 45, "strengths": [], "challenges": [],
                     "element_dynamic": {"type": "controlling"},
                     "user_profile": {"needs": "space"}, "partner_profile": {"needs": "commitment"}},
        }
        s = _synthesize_tier1(systems, "A", "B", 40)
        assert "growth" in s["narrative"].lower() or "friction" in s["narrative"].lower()


# ─── PHASE 9: Relationship Roles & Dynamics ─────────────────

VALID_ROLES = {"The Visionary", "The Inspirer", "The Stabilizer", "The Challenger", "The Emotional Anchor"}


class TestRelationshipRoles:
    def test_roles_present_in_response(self, happy_pair):
        u, p = happy_pair
        r = compute(u, p, "Alice", "Bob")
        assert "relationship_roles" in r
        roles = r["relationship_roles"]
        assert "user_role" in roles
        assert "partner_role" in roles
        assert "narrative" in roles

    def test_roles_are_valid_labels(self, happy_pair):
        u, p = happy_pair
        r = compute(u, p, "A", "B")
        roles = r["relationship_roles"]
        assert roles["user_role"] in VALID_ROLES
        assert roles["partner_role"] in VALID_ROLES

    def test_narrative_length_bounded(self, happy_pair):
        u, p = happy_pair
        r = compute(u, p, "A", "B")
        narrative = r["relationship_roles"]["narrative"]
        assert 100 < len(narrative) <= 1000

    def test_narrative_no_system_labels(self, happy_pair):
        u, p = happy_pair
        r = compute(u, p, "A", "B")
        text = r["relationship_roles"]["narrative"].lower()
        for label in ["western", "vedic", "bazi", "four pillars"]:
            assert label not in text, f"Roles narrative contains system label '{label}'"

    def test_roles_empty_readings(self, empty_reading):
        r = compute(empty_reading, empty_reading, "X", "Y")
        roles = r["relationship_roles"]
        assert roles["user_role"] in VALID_ROLES
        assert len(roles["narrative"]) > 50

    def test_same_element_role_narrative(self):
        """Same element should mention competition or same role."""
        systems = {
            "bazi": {
                "user_profile": {"element": "Fire", "day_master": "Bing Fire"},
                "partner_profile": {"element": "Fire", "day_master": "Ding Fire"},
            },
        }
        r = _build_relationship_roles(systems, "A", "B")
        assert r["user_role"] == r["partner_role"] == "The Inspirer"
        assert "competition" in r["narrative"].lower() or "same" in r["narrative"].lower()

    def test_different_element_roles(self):
        """Different elements should produce different role labels."""
        systems = {
            "bazi": {
                "user_profile": {"element": "Wood"},
                "partner_profile": {"element": "Metal"},
            },
        }
        r = _build_relationship_roles(systems, "A", "B")
        assert r["user_role"] == "The Visionary"
        assert r["partner_role"] == "The Challenger"

    def test_productive_cycle_complement(self):
        """Productive element cycle should mention complement/feed."""
        systems = {
            "bazi": {
                "user_profile": {"element": "Wood"},
                "partner_profile": {"element": "Fire"},
            },
        }
        r = _build_relationship_roles(systems, "A", "B")
        assert "feed" in r["narrative"].lower() or "grow" in r["narrative"].lower()

    def test_adjustment_guidance_present(self, happy_pair):
        u, p = happy_pair
        r = compute(u, p, "Alice", "Bob")
        narrative = r["relationship_roles"]["narrative"].lower()
        assert "overexpress" in narrative or "when" in narrative

    def test_nuance_fields_present(self, happy_pair):
        u, p = happy_pair
        r = compute(u, p, "A", "B")
        roles = r["relationship_roles"]
        assert "user_nuance" in roles
        assert "partner_nuance" in roles

    def test_nuance_none_when_signals_agree(self):
        """BaZi=Wood + Sun=Aries(Fire→Fire) + Moon=Aries(Fire) + Mars=Leo(Fire) + Gana=Rakshasa(Fire)
        → only 1 distinct conflict at most, so no nuance."""
        systems = {
            "bazi": {
                "user_profile": {"element": "Fire"},
                "partner_profile": {"element": "Fire"},
            },
            "western": {
                "user_profile": {"sun": "Aries", "moon": "Leo", "mars": "Sagittarius"},
                "partner_profile": {"sun": "Leo", "moon": "Aries", "mars": "Leo"},
            },
            "vedic": {
                "user_profile": {"gana": "Rakshasa"},
                "partner_profile": {"gana": "Rakshasa"},
            },
        }
        r = _build_relationship_roles(systems, "A", "B")
        assert r["user_nuance"] is None
        assert r["partner_nuance"] is None

    def test_nuance_added_when_signals_conflict(self):
        """BaZi=Wood but Moon=Cancer(Water) + Mars=Scorpio(Water) + Gana=Deva(Water)
        → 3 Water votes vs Wood primary → nuance should fire."""
        systems = {
            "bazi": {
                "user_profile": {"element": "Wood"},
                "partner_profile": {"element": "Earth"},
            },
            "western": {
                "user_profile": {"sun": "Aries", "moon": "Cancer", "mars": "Scorpio"},
                "partner_profile": {},
            },
            "vedic": {
                "user_profile": {"gana": "Deva"},
                "partner_profile": {},
            },
        }
        r = _build_relationship_roles(systems, "Alice", "Bob")
        assert r["user_role"] == "The Visionary"  # label unchanged
        assert r["user_nuance"] == "The Emotional Anchor"  # Water nuance
        assert "however" in r["narrative"].lower() or "also carries" in r["narrative"].lower()

    def test_nuance_does_not_change_role_label(self):
        """Even with strong conflict, the primary role label stays BaZi-derived."""
        systems = {
            "bazi": {
                "user_profile": {"element": "Metal"},
                "partner_profile": {"element": "Water"},
            },
            "western": {
                "user_profile": {"sun": "Cancer", "moon": "Pisces", "mars": "Scorpio"},
                "partner_profile": {"sun": "Taurus", "moon": "Virgo", "mars": "Capricorn"},
            },
            "vedic": {
                "user_profile": {"gana": "Deva"},
                "partner_profile": {"gana": "Manushya"},
            },
        }
        r = _build_relationship_roles(systems, "A", "B")
        assert r["user_role"] == "The Challenger"
        assert r["partner_role"] == "The Emotional Anchor"


# ─── PHASE 10: When You Clash ──────────────────────────────────

class TestWhenYouClash:
    def test_clash_present_in_response(self, happy_pair):
        u, p = happy_pair
        r = compute(u, p, "Alice", "Bob")
        assert "when_you_clash" in r
        clash = r["when_you_clash"]
        assert "narrative" in clash
        assert "trigger" in clash

    def test_clash_has_all_keys(self, happy_pair):
        u, p = happy_pair
        r = compute(u, p, "A", "B")
        clash = r["when_you_clash"]
        expected = {"trigger", "user_stress", "partner_stress", "breaking_point",
                    "user_deescalation", "partner_deescalation", "narrative"}
        assert expected == set(clash.keys())

    def test_narrative_not_empty(self, happy_pair):
        u, p = happy_pair
        r = compute(u, p, "A", "B")
        assert len(r["when_you_clash"]["narrative"]) > 100

    def test_narrative_length_bounded(self, happy_pair):
        u, p = happy_pair
        r = compute(u, p, "A", "B")
        assert len(r["when_you_clash"]["narrative"]) <= 1000

    def test_narrative_no_system_labels(self, happy_pair):
        u, p = happy_pair
        r = compute(u, p, "A", "B")
        text = r["when_you_clash"]["narrative"].lower()
        for label in ["western", "vedic", "bazi", "four pillars", "mars sign"]:
            assert label not in text, f"Clash narrative contains system label '{label}'"

    def test_clash_empty_readings(self, empty_reading):
        r = compute(empty_reading, empty_reading, "X", "Y")
        clash = r["when_you_clash"]
        assert len(clash["narrative"]) > 50
        assert clash["trigger"]

    def test_deescalation_uses_names(self, happy_pair):
        u, p = happy_pair
        r = compute(u, p, "Alice", "Bob")
        clash = r["when_you_clash"]
        assert "Alice" in clash["user_deescalation"]
        assert "Bob" in clash["partner_deescalation"]

    def test_direct_call_productive(self):
        """Productive element pair should trigger give-and-take trigger."""
        systems = {
            "western": {
                "user_profile": {"mars": "Aries"},
                "partner_profile": {"mars": "Cancer"},
            },
            "bazi": {
                "user_profile": {"element": "Wood"},
                "partner_profile": {"element": "Fire"},
            },
        }
        roles = {"user_role": "The Visionary", "partner_role": "The Inspirer"}
        clash = _build_when_you_clash(systems, "A", "B", roles)
        assert "give-and-take" in clash["trigger"] or "empty" in clash["trigger"]

    def test_direct_call_controlling(self):
        """Controlling element pair should reference power struggle."""
        systems = {
            "western": {
                "user_profile": {"mars": "Scorpio"},
                "partner_profile": {"mars": "Pisces"},
            },
            "bazi": {
                "user_profile": {"element": "Wood"},
                "partner_profile": {"element": "Earth"},
            },
        }
        roles = {"user_role": "The Visionary", "partner_role": "The Stabilizer"}
        clash = _build_when_you_clash(systems, "A", "B", roles)
        assert "power" in clash["trigger"].lower()

    def test_direct_call_same_element(self):
        """Same element pair should mention competition."""
        systems = {
            "western": {
                "user_profile": {"mars": "Leo"},
                "partner_profile": {"mars": "Leo"},
            },
            "bazi": {
                "user_profile": {"element": "Fire"},
                "partner_profile": {"element": "Fire"},
            },
        }
        roles = {"user_role": "The Inspirer", "partner_role": "The Inspirer"}
        clash = _build_when_you_clash(systems, "A", "B", roles)
        assert "competition" in clash["trigger"].lower() or "lead" in clash["trigger"].lower()

    def test_deescalation_matches_role(self):
        """De-escalation advice should differ by role."""
        systems = {
            "western": {"user_profile": {}, "partner_profile": {}},
            "bazi": {
                "user_profile": {"element": "Metal"},
                "partner_profile": {"element": "Water"},
            },
        }
        roles = {"user_role": "The Challenger", "partner_role": "The Emotional Anchor"}
        clash = _build_when_you_clash(systems, "A", "B", roles)
        assert "soften" in clash["user_deescalation"].lower()
        assert "name" in clash["partner_deescalation"].lower()

    def test_stress_from_mars_sign(self):
        """Mars sign should drive stress behavior text."""
        systems = {
            "western": {
                "user_profile": {"mars": "Aries"},
                "partner_profile": {"mars": "Taurus"},
            },
            "bazi": {
                "user_profile": {"element": "Fire"},
                "partner_profile": {"element": "Earth"},
            },
        }
        roles = {"user_role": "The Inspirer", "partner_role": "The Stabilizer"}
        clash = _build_when_you_clash(systems, "A", "B", roles)
        assert "head-on" in clash["user_stress"]
        assert "silent" in clash["partner_stress"]


# ─── PHASE 11: Intent Modes ────────────────────────────────────────

class TestIntentModes:
    def test_default_intent_is_serious(self, happy_pair):
        u, p = happy_pair
        r = compute(u, p, "A", "B")
        assert r["intent"] == "serious"

    def test_all_intents_produce_valid_output(self, happy_pair):
        u, p = happy_pair
        for intent in VALID_INTENTS:
            r = compute(u, p, "Alice", "Bob", intent=intent)
            assert r["intent"] == intent
            assert r["overall_score"] >= 0
            assert r["tier1_synthesis"]["narrative"]
            assert r["relationship_roles"]["narrative"]
            assert r["when_you_clash"]["narrative"]
            assert r["relationship_playbook"]["what_works"]

    def test_structure_unchanged_across_intents(self, happy_pair):
        """All intents must produce the same set of keys."""
        u, p = happy_pair
        base_keys = set(compute(u, p, "A", "B", intent="serious").keys())
        for intent in ("dating", "marriage", "healing"):
            assert set(compute(u, p, "A", "B", intent=intent).keys()) == base_keys

    def test_dating_synthesis_lighter_tone(self, happy_pair):
        u, p = happy_pair
        r = compute(u, p, "A", "B", intent="dating")
        text = r["tier1_synthesis"]["narrative"].lower()
        # Should not contain heavy commitment language
        assert "marriage" not in text
        assert "lasting" not in text or "commitment" not in text

    def test_healing_synthesis_reflective(self, happy_pair):
        u, p = happy_pair
        r = compute(u, p, "A", "B", intent="healing")
        text = r["tier1_synthesis"]["narrative"].lower()
        # Should use past-tense or reflective framing
        assert any(w in text for w in ["looking back", "was", "held", "learned", "carried"])

    def test_marriage_playbook_long_term_focus(self, happy_pair):
        u, p = happy_pair
        r = compute(u, p, "A", "B", intent="marriage")
        lt = r["relationship_playbook"]["long_term"].lower()
        assert any(w in lt for w in ["marriage", "schedule", "check-in", "all in", "commit"])

    def test_dating_playbook_keeps_it_light(self, happy_pair):
        u, p = happy_pair
        r = compute(u, p, "A", "B", intent="dating")
        ww = r["relationship_playbook"]["what_works"].lower()
        assert any(w in ww for w in ["spark", "curiosity", "exploring", "playful"])

    def test_healing_clash_past_tense(self, happy_pair):
        u, p = happy_pair
        r = compute(u, p, "A", "B", intent="healing")
        narrative = r["when_you_clash"]["narrative"].lower()
        assert "was" in narrative or "would" in narrative or "happened" in narrative

    def test_healing_roles_reflective_friction(self, happy_pair):
        u, p = happy_pair
        r = compute(u, p, "A", "B", intent="healing")
        text = r["relationship_roles"]["narrative"].lower()
        assert any(w in text for w in ["looking back", "likely came", "felt", "pattern"])

    def test_marriage_clash_mentions_repair(self, happy_pair):
        u, p = happy_pair
        r = compute(u, p, "A", "B", intent="marriage")
        text = r["when_you_clash"]["narrative"].lower()
        assert any(w in text for w in ["repair", "marriage", "lasting", "recover"])

    def test_intent_no_jargon(self, happy_pair):
        """No intent should introduce system labels."""
        u, p = happy_pair
        for intent in VALID_INTENTS:
            r = compute(u, p, "A", "B", intent=intent)
            for section in ("tier1_synthesis", "relationship_roles", "when_you_clash"):
                text = r[section]["narrative"].lower()
                for label in ["western", "vedic", "bazi", "four pillars"]:
                    assert label not in text, f"Intent '{intent}' section '{section}' has jargon '{label}'"

    def test_empty_readings_all_intents(self, empty_reading):
        for intent in VALID_INTENTS:
            r = compute(empty_reading, empty_reading, "X", "Y", intent=intent)
            assert r["intent"] == intent
            assert r["tier1_synthesis"]["narrative"]
            assert r["relationship_playbook"]["what_works"]
