"""Aggregator — combines SystemOpinion outputs into a single decision.

Confidence is derived from three signals:
  1. Agreement strength — how many systems agree on the winner
  2. Score gap — margin between top two options
  3. Average confidence — mean confidence of winning-side systems
"""

from __future__ import annotations

import math
from collections import defaultdict
from typing import Any

from .calibration import calibrate_confidence, get_learned_weight_multiplier
from .runtime_config import RuntimeConfig, load_runtime_config
from .schemas import AggregatedResult, ClassifiedIntent, SYSTEM_WEIGHT, SystemOpinion

# Domain-specific weight overrides: {question_type: {system_id: multiplier}}
# Multiplier is applied on top of base weight.
DOMAIN_WEIGHT_OVERRIDES: dict[str, dict[str, float]] = {
    "timing_question": {
        "persian": 1.4,    # strongest timing system
        "vedic": 1.2,
        "western": 1.1,
        "kabbalistic": 0.6,
        "gematria": 0.5,
        "chinese": 0.7,
    },
    "relationship_question": {
        "western": 1.3,
        "chinese": 1.1,
        "gematria": 0.5,
    },
    "career_question": {
        "bazi": 1.3,
        "kabbalistic": 0.9,
        "gematria": 0.5,
        "chinese": 0.7,
    },
    "health_energy_question": {
        "vedic": 1.2,
        "persian": 1.1,
        "bazi": 1.1,
        "kabbalistic": 0.5,
        "gematria": 0.4,
    },
    "emotional_state_question": {
        "kabbalistic": 1.2,
        "western": 1.1,
        "gematria": 0.8,
    },
}


def _effective_weight(
    system_id: str,
    question_type: str,
    runtime_config: RuntimeConfig | None = None,
) -> float:
    """Compute domain-aware weight for a system."""
    config = runtime_config or load_runtime_config()
    base = SYSTEM_WEIGHT.get(system_id, 0.5)
    overrides = DOMAIN_WEIGHT_OVERRIDES.get(question_type, {})
    multiplier = overrides.get(system_id, 1.0)
    learned = get_learned_weight_multiplier(system_id, config)
    return base * multiplier * learned


def _confidence_label(confidence: float) -> str:
    if confidence >= 0.58:
        return "High"
    if confidence >= 0.35:
        return "Medium"
    return "Low"


# ── Upgrade 8: weighted dissent ──────────────────────────────────
DISSENT_WEIGHT: dict[str, float] = {
    "western": 2.0,
    "vedic": 2.0,
    "bazi": 1.5,
    "persian": 1.2,
    "chinese": 1.0,
    "numerology": 0.8,
    "kabbalistic": 0.7,
    "gematria": 0.5,
}


# ── Upgrade 12: cross-system evidence deduplication ──────────────
def _semantic_overlap(a: str, b: str) -> float:
    tokens_a = set(a.split())
    tokens_b = set(b.split())
    if not tokens_a or not tokens_b:
        return 0.0
    return len(tokens_a & tokens_b) / len(tokens_a | tokens_b)


def _deduplicate_evidence_weight(
    relevant: list[SystemOpinion],
    runtime_config: RuntimeConfig | None = None,
) -> None:
    """Reduce weight of evidence features that appear in 3+ systems.

    For each feature name appearing in 3+ systems, keep full weight only
    on the instance with the highest weight; reduce others by 0.2.
    Mutates evidence items in-place.
    """
    # Collect (system_id, evidence_index, weight) per lowercased feature
    feature_map: dict[str, list[tuple[str, int, float]]] = defaultdict(list)
    use_semantic = True if runtime_config is None else runtime_config.feature_flags.semantic_evidence_dedup
    for o in relevant:
        for idx, ev in enumerate(o.evidence):
            key = ev.semantic_key or ev.feature.lower()
            feature_map[key].append((o.system_id, idx, ev.weight))

    if use_semantic:
        keys = list(feature_map.keys())
        for i, left in enumerate(keys):
            for right in keys[i + 1:]:
                if _semantic_overlap(left, right) >= 0.7:
                    feature_map[left].extend(feature_map[right])
                    feature_map[right] = []

    for _feature, entries in feature_map.items():
        if len(entries) < 2:
            continue
        # Sort descending by weight — first entry keeps full weight
        entries_sorted = sorted(entries, key=lambda t: t[2], reverse=True)
        for sys_id, ev_idx, old_w in entries_sorted[1:]:
            for o in relevant:
                if o.system_id == sys_id:
                    decay = 0.15 if use_semantic else 0.2
                    o.evidence[ev_idx].weight = round(max(0.0, old_w - decay), 2)
                    break


# ── Upgrade 13: question clarity scoring ─────────────────────────
_CLARITY_BY_TYPE: dict[str, float] = {
    "binary_decision": 1.0,
    "timing_question": 0.9,
    "relationship_question": 0.85,
    "career_question": 0.85,
    "health_energy_question": 0.85,
    "emotional_state_question": 0.7,
    "general_guidance_question": 0.5,
}


def _question_clarity(
    question_type: str,
    domain_tags: list[str],
    options: list[str],
) -> float:
    """Return 0.0–1.0 measuring how focused the question is."""
    base = _CLARITY_BY_TYPE.get(question_type, 0.5)
    # binary_decision gets full 1.0 only with 2 clear options
    if question_type == "binary_decision" and len(options) < 2:
        base = 0.8
    # Scatter penalty: 3+ domain tags
    if len(domain_tags) >= 3:
        base -= 0.1
    return max(0.0, min(1.0, base))


# ── Upgrade 94: evidence quality scoring ─────────────────────────

def _evidence_quality_bonus(opinion: SystemOpinion) -> float:
    """Bonus for opinions with diverse evidence categories."""
    categories = set()
    for ev in opinion.evidence:
        cat = getattr(ev, "category", None) or ""
        if cat:
            categories.add(cat)
    if len(categories) >= 5:
        return 0.05 * opinion.confidence
    return 0.0


# ── Upgrade 95: sigmoid confidence calibration ───────────────────

def _sigmoid_calibrate(conf: float) -> float:
    """Push mid-range values toward extremes for more decisive labels."""
    return 1.0 / (1.0 + math.exp(-8.0 * (conf - 0.45)))


# ── Upgrade 97: stance distribution variance ─────────────────────

def _stance_variance(relevant: list[SystemOpinion], winner: str) -> float:
    """Compute variance of stances for the winning option."""
    stances = [o.stance.get(winner, 0.5) for o in relevant]
    if len(stances) < 2:
        return 0.0
    mean = sum(stances) / len(stances)
    return sum((s - mean) ** 2 for s in stances) / len(stances)


# ── Upgrade 92: cluster detection ────────────────────────────────

def _detect_clusters(relevant: list[SystemOpinion], winner: str) -> bool:
    """Detect if systems form distinct clusters (bimodal stances)."""
    stances = sorted(o.stance.get(winner, 0.5) for o in relevant)
    if len(stances) < 4:
        return False
    # Look for a gap > 0.15 in the sorted stance values
    for i in range(len(stances) - 1):
        if stances[i + 1] - stances[i] > 0.15:
            left = stances[:i + 1]
            right = stances[i + 1:]
            if len(left) >= 2 and len(right) >= 2:
                return True
    return False


def _compute_pairwise_agreement(relevant: list[SystemOpinion]) -> dict[str, dict[str, float]]:
    matrix: dict[str, dict[str, float]] = {}
    for left in relevant:
        matrix[left.system_id] = {}
        for right in relevant:
            if left.system_id == right.system_id:
                matrix[left.system_id][right.system_id] = 1.0
                continue
            shared = set(left.stance) | set(right.stance)
            if not shared:
                matrix[left.system_id][right.system_id] = 0.0
                continue
            distance = sum(abs(left.stance.get(opt, 0.5) - right.stance.get(opt, 0.5)) for opt in shared) / len(shared)
            matrix[left.system_id][right.system_id] = round(max(0.0, 1.0 - distance), 3)
    return matrix


def _build_evidence_graph(
    relevant: list[SystemOpinion],
    winner: str,
    domains: list[str],
) -> dict[str, Any]:
    nodes: list[dict[str, Any]] = [{"id": winner, "type": "winner"}]
    edges: list[dict[str, Any]] = []
    seen_nodes: set[str] = {winner}

    for domain in domains:
        if domain not in seen_nodes:
            nodes.append({"id": domain, "type": "domain"})
            seen_nodes.add(domain)
        edges.append({"source": domain, "target": winner, "kind": "domain_support"})

    for opinion in relevant:
        if opinion.system_id not in seen_nodes:
            nodes.append({"id": opinion.system_id, "type": "system"})
            seen_nodes.add(opinion.system_id)
        edges.append(
            {
                "source": opinion.system_id,
                "target": winner,
                "kind": "system_vote",
                "weight": round(opinion.stance.get(winner, 0.5), 3),
            }
        )
        for ev in opinion.evidence[:3]:
            ev_id = f"{opinion.system_id}:{ev.semantic_key or ev.feature}"
            if ev_id not in seen_nodes:
                nodes.append(
                    {
                        "id": ev_id,
                        "type": "evidence",
                        "label": ev.feature,
                        "source_kind": ev.source_kind,
                    }
                )
                seen_nodes.add(ev_id)
            edges.append({"source": opinion.system_id, "target": ev_id, "kind": "cites", "weight": ev.weight})
            edges.append({"source": ev_id, "target": winner, "kind": "supports", "weight": ev.weight})

    return {"nodes": nodes, "edges": edges}


def _compute_option_totals(
    relevant: list[SystemOpinion],
    question_type: str,
    runtime_config: RuntimeConfig,
) -> tuple[dict[str, float], dict[str, float], float]:
    all_options: set[str] = set()
    for opinion in relevant:
        all_options.update(opinion.stance.keys())

    option_totals: dict[str, float] = {opt: 0.0 for opt in all_options}
    opinion_weights: dict[str, float] = {}
    total_weight = 0.0

    for opinion in relevant:
        weight = opinion.confidence * _effective_weight(opinion.system_id, question_type, runtime_config)
        weight += _evidence_quality_bonus(opinion)
        opinion_weights[opinion.system_id] = weight
        for opt, score in opinion.stance.items():
            option_totals[opt] += score * weight
        total_weight += weight

    if total_weight > 0:
        for opt in option_totals:
            option_totals[opt] /= total_weight
    score_sum = sum(option_totals.values())
    if score_sum > 0:
        option_totals = {k: round(v / score_sum, 3) for k, v in option_totals.items()}
    return option_totals, opinion_weights, total_weight


def _winner_from_totals(option_totals: dict[str, float]) -> str:
    return max(option_totals, key=option_totals.get)  # type: ignore[arg-type]


def _protect_strong_signals(
    option_totals: dict[str, float],
    relevant: list[SystemOpinion],
    opinion_weights: dict[str, float],
    question_type: str,
    runtime_config: RuntimeConfig,
) -> tuple[dict[str, float], bool]:
    if not opinion_weights:
        return option_totals, False

    max_weight = max(opinion_weights.values())
    strong_ids = {
        system_id
        for system_id, weight in opinion_weights.items()
        if weight >= max_weight * 0.55
    }
    strong_subset = [opinion for opinion in relevant if opinion.system_id in strong_ids]
    if len(strong_subset) < 2:
        return option_totals, False

    strong_totals, _, _ = _compute_option_totals(strong_subset, question_type, runtime_config)
    if not strong_totals:
        return option_totals, False

    winner_full = _winner_from_totals(option_totals)
    winner_strong = _winner_from_totals(strong_totals)
    if winner_full == winner_strong:
        return option_totals, False

    blended: dict[str, float] = {}
    for option in set(option_totals) | set(strong_totals):
        blended[option] = round((option_totals.get(option, 0.0) * 0.35) + (strong_totals.get(option, 0.0) * 0.65), 3)
    total = sum(blended.values())
    if total > 0:
        blended = {option: round(value / total, 3) for option, value in blended.items()}
    return blended, True


def aggregate(
    opinions: list[SystemOpinion],
    intent: ClassifiedIntent | None = None,
    *,
    prior_confidence: float | None = None,
    runtime_config: RuntimeConfig | None = None,
) -> AggregatedResult:
    """Combine system opinions into a weighted final result.

    Parameters
    ----------
    opinions : list[SystemOpinion]
    intent : ClassifiedIntent | None
        When provided, domain-specific weight overrides are applied so that
        e.g. symbolic systems weigh less on timing questions.
    prior_confidence : float | None
        Upgrade 91: average confidence from previous answers in the session.
    """
    config = runtime_config or load_runtime_config()
    relevant = [o for o in opinions if o.relevant]
    question_type = intent.question_type if intent else "general_guidance_question"

    if not relevant:
        return AggregatedResult(
            winner="uncertain",
            scores={"favorable": 0.5, "cautious": 0.5},
            contributors=[],
            confidence=0.0,
            confidence_label="Low",
            system_agreement={},
            score_gap=0.0,
            opinions=opinions,
        )

    # ── Upgrade 12: deduplicate cross-system evidence ──────────────
    _deduplicate_evidence_weight(relevant, config)

    # ── Weighted sum per option (domain-aware) ─────────────────────
    option_totals, opinion_weights, total_weight = _compute_option_totals(relevant, question_type, config)
    option_totals, weak_signal_override = _protect_strong_signals(
        option_totals, relevant, opinion_weights, question_type, config,
    )
    all_options = set(option_totals)

    # ── Winner ─────────────────────────────────────────────────────
    winner = _winner_from_totals(option_totals)

    # ── Score gap ──────────────────────────────────────────────────
    sorted_scores = sorted(option_totals.values(), reverse=True)
    score_gap = round(sorted_scores[0] - sorted_scores[1], 3) if len(sorted_scores) >= 2 else 0.0

    # ── System agreement count ─────────────────────────────────────
    # Count a system as "agreeing" if its winner stance exceeds 0.55
    AGREE_THRESHOLD = 0.55
    system_agreement: dict[str, int] = {opt: 0 for opt in all_options}
    for o in relevant:
        favored = max(o.stance, key=o.stance.get)  # type: ignore[arg-type]
        if o.stance.get(favored, 0) >= AGREE_THRESHOLD:
            system_agreement[favored] = system_agreement.get(favored, 0) + 1
        # Systems below threshold don't count for either side

    # ── Final confidence ───────────────────────────────────────────
    n_total = len(relevant)

    # 1. Score gap — the single strongest signal for how clear the answer is.
    #    Realistic gaps range 0.02–0.30; saturate at 0.30.
    gap_confidence = min(score_gap / 0.30, 1.0)

    # 2. Strong agreement: systems with stance for winner >= 0.57
    agree_count = sum(1 for o in relevant if o.stance.get(winner, 0) >= 0.57)
    agree_ratio = agree_count / n_total if n_total > 0 else 0.0

    # 3. Active dissent: weighted by system importance (Upgrade 8)
    dissent_w_sum = sum(
        DISSENT_WEIGHT.get(o.system_id, 1.0)
        for o in relevant if o.stance.get(winner, 0) < 0.43
    )
    total_dissent_w = sum(DISSENT_WEIGHT.get(o.system_id, 1.0) for o in relevant)
    weighted_dissent = dissent_w_sum / total_dissent_w if total_dissent_w > 0 else 0.0

    # 4. System data quality — capped so high adapter confidence
    #    doesn't inflate the aggregate when the answer is unclear
    avg_sys_conf = (
        sum(o.confidence for o in relevant) / n_total
        if n_total > 0 else 0.0
    )
    data_signal = min(avg_sys_conf, 0.6)

    # Blend: gap-dominant formula that can produce Low/Medium/High
    final_confidence = round(
        gap_confidence * 0.30
        + agree_ratio * 0.25
        + data_signal * 0.15
        - weighted_dissent * 0.20
        + 0.08,  # minimal floor
        2,
    )

    # ── Upgrade 10: unanimous consensus boost ────────────────────
    n_for = system_agreement.get(winner, 0)
    if n_for == n_total:
        final_confidence += 0.05

    # ── Upgrade 9 + 11: near-split detection & penalty ───────────
    near_split = (score_gap < 0.08) or (
        n_for <= n_total // 2 + 1 and n_total >= 6
    )
    if near_split:
        final_confidence -= 0.04

    # ── Upgrade 91: Bayesian prior from session history ───────────
    if prior_confidence is not None and prior_confidence > 0:
        final_confidence = 0.70 * final_confidence + 0.30 * prior_confidence

    # ── Upgrade 93: inverted consensus handling ────────────────────
    # When all systems agree on "cautious", that IS a clear answer — boost it
    if n_for == n_total and winner in ("cautious", "wait", "no"):
        final_confidence += 0.06

    # ── Upgrade 96: weighted agreement counting ───────────────────
    weighted_agree = sum(
        SYSTEM_WEIGHT.get(o.system_id, 0.5)
        for o in relevant if o.stance.get(winner, 0) >= 0.57
    )
    total_possible_weight = sum(SYSTEM_WEIGHT.get(o.system_id, 0.5) for o in relevant)
    if total_possible_weight > 0 and weighted_agree / total_possible_weight > 0.75:
        final_confidence += 0.03  # strong weighted consensus bonus

    # ── Upgrade 97: stance distribution shape ─────────────────────
    variance = _stance_variance(relevant, winner)
    polarized = variance > 0.03
    if polarized:
        final_confidence -= 0.04
    elif variance < 0.01:
        final_confidence += 0.03

    # ── Upgrade 92: cluster detection ────────────────────────────
    clustered = _detect_clusters(relevant, winner)
    if clustered:
        final_confidence -= 0.02  # distinct clusters imply real disagreement

    # ── Upgrade 98: dynamic confidence floor ─────────────────────
    if intent is not None:
        feasibility = getattr(intent, "feasibility", 1.0)
        specificity = getattr(intent, "specificity", 1.0)
        dynamic_floor = 0.08 * feasibility * specificity
        if final_confidence < dynamic_floor:
            final_confidence = dynamic_floor
    else:
        if final_confidence < 0.08:
            final_confidence = 0.08

    # ── Upgrade 100: multi-path detection ────────────────────────
    multi_path = False
    if len(sorted_scores) >= 3:
        top3 = sorted_scores[:3]
        if top3[0] - top3[2] < 0.05:
            multi_path = True
            final_confidence -= 0.06

    # ── Upgrade 13: question clarity multiplier ──────────────────
    if intent is not None:
        clarity = _question_clarity(
            intent.question_type, intent.domain_tags, intent.options,
        )
        final_confidence *= 0.7 + 0.3 * clarity

    # ── Upgrade 95: sigmoid confidence calibration ───────────────
    final_confidence = _sigmoid_calibrate(final_confidence)
    final_confidence = calibrate_confidence(final_confidence, config)

    final_confidence = round(final_confidence, 2)
    final_confidence = max(0.05, min(0.95, final_confidence))
    if weak_signal_override:
        final_confidence = round(max(0.05, min(0.95, final_confidence - 0.02)), 2)

    label = _confidence_label(final_confidence)
    top_score = option_totals.get(winner, 0.5)
    advice_strength = round(max(0.05, min(0.95, (top_score * 0.65) + (gap_confidence * 0.35))), 2)
    epistemic_confidence = final_confidence
    abstained = False
    if config.feature_flags.abstain_gate:
        abstained = (
            final_confidence < config.abstain_threshold
            or (near_split and score_gap < 0.04)
            or (multi_path and final_confidence < config.low_signal_threshold)
        )

    # ── Contributors ordered by influence ──────────────────────────
    contributors = sorted(
        relevant,
        key=lambda o: (
            o.stance.get(winner, 0.0)
            * o.confidence
            * _effective_weight(o.system_id, question_type, config)
        ),
        reverse=True,
    )
    pairwise_agreement = _compute_pairwise_agreement(relevant)
    evidence_graph = _build_evidence_graph(relevant, winner, intent.domain_tags if intent else [])

    return AggregatedResult(
        winner=winner,
        scores=option_totals,
        contributors=[o.system_id for o in contributors],
        confidence=final_confidence,
        confidence_label=label,
        system_agreement=system_agreement,
        score_gap=score_gap,
        near_split=near_split,
        polarized=polarized,
        multi_path=multi_path,
        clustered=clustered,
        epistemic_confidence=epistemic_confidence,
        advice_strength=advice_strength,
        abstained=abstained,
        weak_signal_override=weak_signal_override,
        pairwise_agreement=pairwise_agreement,
        evidence_graph=evidence_graph,
        opinions=opinions,
    )
