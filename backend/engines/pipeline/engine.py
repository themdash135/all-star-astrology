"""Pipeline orchestrator — runs the full neuro-symbolic pipeline.

    question  →  IntentClassifier
                       ↓
                  SystemRouter
                       ↓
                  SystemAdapters
                       ↓
                  Aggregator
                       ↓
              ContextMemory + PatternAnalyzer
                       ↓
                  AnswerComposer (3 layers + tone + conflict)
                       ↓
                  PipelineResponse
"""

from __future__ import annotations

import hashlib
import json
import time
from typing import Any

from .adapters.base import BaseAdapter
from .aggregator import aggregate
from .answer_composer import compose, SYSTEM_NAMES
from .context_memory import build_context as build_user_context
from .intent_classifier import classify
from .pattern_analyzer import analyze as analyze_pattern
from .question_decomposer import classify_with_decomposition
from .registry import (
    adapter_is_quarantined,
    get_adapter_health_snapshot,
    get_adapter_registry,
    get_cached_evaluation,
    make_evaluation_cache_key,
    record_adapter_failure,
    record_adapter_success,
    store_cached_evaluation,
)
from .runtime_config import load_runtime_config
from .session_store import (
    append_session_interaction,
    merge_session_inputs,
    summarize_session_state,
)
from .schemas import AggregatedResult, ClassifiedIntent, PipelineResponse, SystemOpinion
from .system_router import route
from .telemetry import build_trace_fingerprint, build_trace_id, emit_pipeline_telemetry, write_trace_bundle
from .temporal import (
    apply_temporal_modulation,
    compute_temporal_modulation,
    moon_phase_confidence_modifier,
)


# ── Adapter registry ──────────────────────────────────────────────

ADAPTERS: dict[str, BaseAdapter] = {}


# ── Upgrade 121: Intent classification cache ─────────────────────

_intent_cache: dict[str, Any] = {}
_INTENT_CACHE_MAX = 50


def _cached_classify(question: str):
    """Cache classify() results to avoid re-classifying history questions."""
    key = hashlib.md5(question.encode()).hexdigest()
    if key in _intent_cache:
        return _intent_cache[key]
    result = classify(question)
    if len(_intent_cache) >= _INTENT_CACHE_MAX:
        # Evict oldest entry
        oldest = next(iter(_intent_cache))
        del _intent_cache[oldest]
    _intent_cache[key] = result
    return result


def _build_advisories(
    intent: ClassifiedIntent,
    aggregation: AggregatedResult,
    degraded_systems: list[str],
) -> list[str]:
    """Emit compact machine-readable warnings for downstream callers."""
    advisories: list[str] = []

    if intent.feasibility < 0.5:
        advisories.append("low_feasibility")
    if intent.specificity < 0.35:
        advisories.append("low_specificity")
    if aggregation.confidence < 0.35:
        advisories.append("low_confidence")
    if aggregation.near_split:
        advisories.append("near_split")
    if aggregation.polarized:
        advisories.append("polarized_signals")
    if aggregation.multi_path:
        advisories.append("multi_path")
    if aggregation.clustered:
        advisories.append("clustered_signals")
    if aggregation.abstained:
        advisories.append("insufficient_signal")
    if aggregation.weak_signal_override:
        advisories.append("weak_signal_override")
    for contradiction in intent.contradictions:
        advisories.append(f"contradiction:{contradiction}")
    for reason in intent.feasibility_reasons[:3]:
        advisories.append(f"feasibility_reason:{reason}")

    for system_id in degraded_systems:
        advisories.append(f"system_degraded:{system_id}")

    return advisories


def _build_diagnostics(
    *,
    intent: ClassifiedIntent,
    aggregation: AggregatedResult,
    selected_ids: list[str],
    degraded_systems: list[str],
    temporal_mods: dict[str, float],
    timings_ms: dict[str, float],
    history: list[str],
    sub_intents: list[ClassifiedIntent],
    trace_id: str,
    adapter_health: dict[str, Any],
    shadow_summary: dict[str, Any] | None,
    telemetry_file: str | None,
    trace_bundle_file: str | None,
    session_summary: dict[str, Any] | None,
) -> dict[str, Any]:
    """Return structured pipeline telemetry without changing answer behavior."""
    return {
        "trace_id": trace_id,
        "timings_ms": dict(timings_ms),
        "question_type": intent.question_type,
        "domain_tags": list(intent.domain_tags),
        "time_horizon": intent.time_horizon,
        "time_window": dict(intent.time_window),
        "entities": dict(intent.entities),
        "goal_intent": intent.goal_intent,
        "history_questions_considered": len(history),
        "sub_intent_count": len(sub_intents),
        "selected_systems": list(selected_ids),
        "degraded_systems": list(degraded_systems),
        "temporal_modifiers": dict(temporal_mods),
        "winner": aggregation.winner,
        "score_gap": aggregation.score_gap,
        "confidence": aggregation.confidence,
        "epistemic_confidence": aggregation.epistemic_confidence,
        "advice_strength": aggregation.advice_strength,
        "pairwise_agreement": aggregation.pairwise_agreement,
        "adapter_health": adapter_health,
        "shadow_summary": shadow_summary or {},
        "telemetry_file": telemetry_file or "",
        "trace_bundle_file": trace_bundle_file or "",
        "session_summary": session_summary or {},
    }


def _current_adapters() -> dict[str, BaseAdapter]:
    if ADAPTERS:
        return ADAPTERS
    return {system_id: spec.adapter for system_id, spec in get_adapter_registry().items()}


def _degraded_opinion(
    system_id: str,
    intent: ClassifiedIntent,
    reason: str,
    *,
    health_score: float = 0.0,
) -> SystemOpinion:
    options = intent.options or ["favorable", "cautious"]
    stance = {opt: round(1 / len(options), 3) for opt in options}
    return SystemOpinion(
        system_id=system_id,
        relevant=False,
        stance=stance,
        confidence=0.0,
        reason=reason,
        evidence=[],
        degraded=True,
        health_score=health_score,
    )


# ── Pipeline entry point ─────────────────────────────────────────

def run(
    question: str,
    reading: dict[str, Any],
    question_history: list[str] | None = None,
    prior_confidences: list[float] | None = None,
    profile: str | None = None,
    response_mode: str | None = None,
    session_id: str | None = None,
    persist_session: bool = True,
) -> PipelineResponse:
    """Execute the full neuro-symbolic pipeline.

    Parameters
    ----------
    question : str
        The user's question.
    reading : dict
        Full reading result from ``POST /api/reading``.
    question_history : list[str] | None
        Up to 10 most recent past questions (newest first).
        Enables personal-insight and pattern detection.
    """
    systems_data = reading.get("systems", {})
    runtime_config = load_runtime_config(profile=profile, response_mode=response_mode)
    trace_id = build_trace_id(
        question,
        reading,
        profile=runtime_config.profile,
        response_mode=runtime_config.response_mode,
    )
    trace_fingerprint = build_trace_fingerprint(
        question,
        reading,
        profile=runtime_config.profile,
        response_mode=runtime_config.response_mode,
    )
    adapters = _current_adapters()
    history, prior_confidences_resolved, session_state = merge_session_inputs(
        session_id,
        runtime_config,
        question_history,
        prior_confidences,
    )

    # ── Upgrade 124: Pipeline timing diagnostics ─────────────────
    _timings: dict[str, float] = {}
    _t0 = time.perf_counter()

    # 1. Classify intent with decomposition + follow-up resolution (#4, #8)
    previous_q = history[0] if history else None
    previous_domains = None
    if previous_q:
        # Upgrade 121: use cached classify for history questions
        prev_intent = _cached_classify(previous_q)
        previous_domains = prev_intent.domain_tags

    intent, sub_intents = classify_with_decomposition(
        question, previous_q, previous_domains,
    )

    # For compound questions, merge domain tags from sub-intents
    if sub_intents:
        extra_domains = set()
        for si in sub_intents:
            extra_domains.update(si.domain_tags)
        merged_domains = list(dict.fromkeys(intent.domain_tags + list(extra_domains)))[:4]
        intent = intent.model_copy(update={"domain_tags": merged_domains})

    # Upgrade 16: Follow-up context enrichment — boost previous domains
    # for short or detected-followup questions so follow-ups stay on topic.
    if previous_q and previous_domains:
        is_short = len(question.strip()) < 30
        # classify_with_decomposition already resolves explicit follow-ups,
        # but domain inheritance only fires when current domains are the
        # default fallback.  Here we also boost when the question is short
        # (likely a follow-up even if not syntactically detected).
        is_followup = is_short or (
            set(intent.domain_tags) == {"mood", "career"}  # default fallback
        )
        if is_followup:
            # Move previous domains to front, preserving current unique ones
            boosted = list(dict.fromkeys(previous_domains + intent.domain_tags))[:4]
            intent = intent.model_copy(update={"domain_tags": boosted})

    _timings["classify_ms"] = round((time.perf_counter() - _t0) * 1000, 1)

    # 2. Route to relevant systems
    # Upgrade 9: Pass prior confidence history for confidence-aware re-routing
    _t1 = time.perf_counter()
    confidence_history = list(prior_confidences_resolved or [])
    if not confidence_history and len(history) >= 3:
        for past_q in history[:3]:
            past_intent = _cached_classify(past_q)
            confidence_history.append(past_intent.feasibility)

    selected_ids = route(
        intent,
        prior_confidences=confidence_history,
        runtime_config=runtime_config,
    )
    _timings["route_ms"] = round((time.perf_counter() - _t1) * 1000, 1)

    # 3. Run adapters — Upgrade 123: graceful fallback per adapter
    _t2 = time.perf_counter()
    opinions: list[SystemOpinion] = []
    degraded_systems: list[str] = []
    cache_hits = 0
    for sys_id in selected_ids:
        adapter = adapters.get(sys_id)
        if adapter is None:
            continue
        if adapter_is_quarantined(sys_id, runtime_config):
            health_score = get_adapter_health_snapshot().get(sys_id, {}).get("health_score", 0.0)
            degraded_systems.append(sys_id)
            opinions.append(
                _degraded_opinion(
                    sys_id,
                    intent,
                    "Adapter quarantined after repeated runtime failures",
                    health_score=float(health_score),
                )
            )
            continue
        sys_data = systems_data.get(sys_id, {})
        cache_key = make_evaluation_cache_key(
            sys_id,
            sys_data,
            intent.model_dump(),
            runtime_config.profile,
        )
        try:
            opinion = None
            if runtime_config.feature_flags.adapter_cache:
                opinion = get_cached_evaluation(cache_key)
                if opinion is not None:
                    cache_hits += 1
                    opinion = opinion.model_copy(update={"cache_hit": True})
            if opinion is None:
                opinion = adapter.evaluate(sys_data, intent)
                if runtime_config.feature_flags.adapter_cache:
                    store_cached_evaluation(cache_key, opinion, runtime_config)
            record_adapter_success(sys_id)
            health_score = get_adapter_health_snapshot().get(sys_id, {}).get("health_score", 1.0)
            opinion = opinion.model_copy(update={"health_score": float(health_score)})
        except Exception as exc:
            degraded_systems.append(sys_id)
            record_adapter_failure(sys_id, str(exc), runtime_config)
            health_score = get_adapter_health_snapshot().get(sys_id, {}).get("health_score", 0.0)
            opinion = _degraded_opinion(
                sys_id,
                intent,
                f"{sys_id} adapter unavailable",
                health_score=float(health_score),
            )
        opinions.append(opinion)
    _timings["adapt_ms"] = round((time.perf_counter() - _t2) * 1000, 1)

    # 3.5 Upgrade 10: Apply temporal modulation before aggregation
    temporal_mods = compute_temporal_modulation(reading)
    apply_temporal_modulation(opinions, temporal_mods, intent.domain_tags)

    # 4. Aggregate (domain-aware weighting)
    _t3 = time.perf_counter()
    # Upgrade 91: pass prior confidence average for Bayesian blending
    prior_conf_avg = (
        sum(confidence_history) / len(confidence_history)
        if confidence_history else None
    )
    aggregation = aggregate(
        opinions,
        intent,
        prior_confidence=prior_conf_avg,
        runtime_config=runtime_config,
    )

    # 4.5a Upgrade 1 (God-Level): Feasibility confidence cap
    # Unanswerable questions get confidence capped at feasibility × 0.50
    if intent.feasibility < 0.5:
        feas_cap = round(intent.feasibility * 0.50, 2)
        if aggregation.confidence > feas_cap:
            aggregation = aggregation.model_copy(
                update={
                    "confidence": feas_cap,
                    "epistemic_confidence": feas_cap,
                    "confidence_label": (
                        "High" if feas_cap >= 0.58 else
                        "Medium" if feas_cap >= 0.35 else
                        "Low"
                    ),
                }
            )

    # 4.5b Upgrade 20 (prior round): Moon phase confidence modifier
    moon_mod = moon_phase_confidence_modifier(reading)
    if moon_mod != 0.0:
        adjusted = max(0.05, min(0.95, round(aggregation.confidence + moon_mod, 2)))
        aggregation = aggregation.model_copy(
            update={
                "confidence": adjusted,
                "epistemic_confidence": adjusted,
                "confidence_label": (
                    "High" if adjusted >= 0.58 else
                    "Medium" if adjusted >= 0.35 else
                    "Low"
                ),
            }
        )

    shadow_summary = None
    if runtime_config.feature_flags.shadow_mode and runtime_config.shadow_profile:
        shadow_config = load_runtime_config(profile=runtime_config.shadow_profile, response_mode=runtime_config.response_mode)
        shadow = aggregate(
            opinions,
            intent,
            prior_confidence=prior_conf_avg,
            runtime_config=shadow_config,
        )
        shadow_summary = {
            "profile": shadow_config.profile,
            "winner": shadow.winner,
            "confidence": shadow.confidence,
            "abstained": shadow.abstained,
        }

    _timings["aggregate_ms"] = round((time.perf_counter() - _t3) * 1000, 1)

    # 5. Build user context + detect patterns
    user_ctx = build_user_context(history, prior_confidences=confidence_history)
    pattern = analyze_pattern(user_ctx)

    # 6. Compose answer (3 layers + tone + conflict)
    _t4 = time.perf_counter()
    composed = compose(
        intent,
        aggregation,
        user_ctx,
        pattern,
        response_mode=runtime_config.response_mode,
        trace_seed=trace_fingerprint,
    )
    _timings["compose_ms"] = round((time.perf_counter() - _t4) * 1000, 1)
    _timings["total_ms"] = round((time.perf_counter() - _t0) * 1000, 1)

    # 7. Build per-system signals for UI
    system_signals = []
    for opinion in aggregation.opinions:
        if not opinion.relevant:
            continue
        winner = aggregation.winner
        stance_for_winner = opinion.stance.get(winner, 0.5)
        if stance_for_winner >= 0.6:
            sentiment = "supports"
        elif stance_for_winner >= 0.45:
            sentiment = "neutral"
        else:
            sentiment = "cautions"

        system_signals.append({
            "system_id": opinion.system_id,
            "name": SYSTEM_NAMES.get(opinion.system_id, opinion.system_id),
            "sentiment": sentiment,
            "score": round(stance_for_winner * 100, 1),
            "reason": opinion.reason,
            "confidence": opinion.confidence,
            "health_score": opinion.health_score,
            "cache_hit": opinion.cache_hit,
            "strongest_support": opinion.strongest_support,
            "strongest_caution": opinion.strongest_caution,
            "evidence": [
                {
                    "feature": e.feature,
                    "value": e.value,
                    "weight": e.weight,
                    "freshness": e.freshness,
                    "source_kind": e.source_kind,
                    "semantic_key": e.semantic_key,
                }
                for e in opinion.evidence[:4]
            ],
        })

    # 8. Assemble answer text (conflict + insight are rendered separately by UI)
    answer_text = f"{composed.short_answer}\n\n{composed.reasoning}"

    # 9. Top systems summary
    top_systems = []
    for sid in aggregation.contributors[:3]:
        op = next((o for o in aggregation.opinions if o.system_id == sid and o.relevant), None)
        if op:
            top_ev = sorted(op.evidence, key=lambda e: e.weight, reverse=True)[:1]
            reason = top_ev[0].feature + ": " + top_ev[0].value if top_ev else op.reason
            top_systems.append({
                "name": SYSTEM_NAMES.get(sid, sid),
                "reason": reason,
            })

    advisories = _build_advisories(intent, aggregation, degraded_systems)
    adapter_health = get_adapter_health_snapshot()
    telemetry_payload = {
        "question": question,
        "profile": runtime_config.profile,
        "response_mode": runtime_config.response_mode,
        "session_id": session_id or "",
        "trace_fingerprint": trace_fingerprint,
        "selected_systems": selected_ids,
        "degraded_systems": degraded_systems,
        "cache_hits": cache_hits,
        "advisories": advisories,
        "aggregation": aggregation.model_dump(),
    }
    telemetry_file = emit_pipeline_telemetry(trace_id, telemetry_payload, runtime_config)
    trace_bundle_payload = {
        "trace_id": trace_id,
        "question": question,
        "question_history": history,
        "prior_confidences": confidence_history,
        "profile": runtime_config.profile,
        "response_mode": runtime_config.response_mode,
        "session_id": session_id or "",
        "trace_fingerprint": trace_fingerprint,
        "reading": reading,
        "response": {
            "answer": answer_text,
            "areas": intent.domain_tags,
            "advisories": advisories,
            "confidence": aggregation.confidence,
            "winner": aggregation.winner,
        },
    }
    trace_bundle_file = write_trace_bundle(trace_id, trace_bundle_payload, runtime_config)
    session_summary = summarize_session_state(session_state) if session_state is not None else None
    diagnostics = _build_diagnostics(
        intent=intent,
        aggregation=aggregation,
        selected_ids=selected_ids,
        degraded_systems=degraded_systems,
        temporal_mods=temporal_mods,
        timings_ms=_timings,
        history=history,
        sub_intents=sub_intents,
        trace_id=trace_id,
        adapter_health=adapter_health,
        shadow_summary=shadow_summary,
        telemetry_file=telemetry_file,
        trace_bundle_file=trace_bundle_file,
        session_summary=session_summary,
    )
    diagnostics["cache_hits"] = cache_hits
    diagnostics["trace_fingerprint"] = trace_fingerprint

    response = PipelineResponse(
        answer=answer_text,
        areas=intent.domain_tags,
        classification=intent,
        aggregation=aggregation,
        system_signals=system_signals,
        confidence=aggregation.confidence,
        confidence_label=aggregation.confidence_label,
        tone=composed.tone,
        personal_insight=composed.personal_insight,
        conflict_note=composed.conflict_note,
        system_agreement=aggregation.system_agreement,
        top_systems=top_systems,
        trace_id=trace_id,
        response_mode=composed.response_mode,
        epistemic_confidence=aggregation.epistemic_confidence,
        advice_strength=aggregation.advice_strength,
        abstained=aggregation.abstained,
        short_rationale=composed.short_rationale,
        deep_rationale=composed.deep_rationale,
        confidence_boosters=composed.confidence_boosters,
        advisories=advisories,
        diagnostics=diagnostics,
    )

    if session_id and persist_session and runtime_config.feature_flags.session_store:
        session_path = append_session_interaction(
            session_id,
            runtime_config,
            question=question,
            response=response,
            classification=intent,
            trace_id=trace_id,
        )
        response.diagnostics["session_file"] = session_path
        response.diagnostics["session_summary"] = summarize_session_state(
            merge_session_inputs(session_id, runtime_config, None, None)[2] or {}
        )

    return response
