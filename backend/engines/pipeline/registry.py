"""Dynamic adapter discovery, runtime health, and evaluation caching."""

from __future__ import annotations

import copy
import hashlib
import importlib
import inspect
import json
import pkgutil
from collections import OrderedDict
from dataclasses import asdict, dataclass
from typing import Any

from .adapters.base import BaseAdapter
from .runtime_config import RuntimeConfig


CONTRACT_VERSION = "2.0"


@dataclass
class AdapterHealth:
    system_id: str
    successes: int = 0
    failures: int = 0
    consecutive_failures: int = 0
    last_error: str = ""
    health_score: float = 1.0
    quarantined: bool = False


@dataclass
class AdapterSpec:
    system_id: str
    system_name: str
    module_name: str
    contract_version: str
    adapter: BaseAdapter


_REGISTRY_CACHE: dict[str, AdapterSpec] | None = None
_HEALTH: dict[str, AdapterHealth] = {}
_EVAL_CACHE: OrderedDict[str, Any] = OrderedDict()


def _hash_payload(payload: Any) -> str:
    serial = json.dumps(payload, sort_keys=True, default=str)
    return hashlib.md5(serial.encode("utf-8")).hexdigest()


def _discover_adapter_specs() -> dict[str, AdapterSpec]:
    specs: dict[str, AdapterSpec] = {}
    package = importlib.import_module(f"{__package__}.adapters")
    prefix = package.__name__ + "."

    for module_info in pkgutil.iter_modules(package.__path__, prefix):
        if module_info.name.endswith(".base"):
            continue
        module = importlib.import_module(module_info.name)
        for _, obj in inspect.getmembers(module, inspect.isclass):
            if obj is BaseAdapter or not issubclass(obj, BaseAdapter):
                continue
            adapter = obj()
            system_id = getattr(adapter, "system_id", "") or ""
            system_name = getattr(adapter, "system_name", "") or ""
            contract_version = getattr(adapter, "contract_version", CONTRACT_VERSION)
            if not system_id or not system_name:
                raise ValueError(f"Adapter {obj.__name__} missing system_id or system_name")
            if contract_version != CONTRACT_VERSION:
                raise ValueError(
                    f"Adapter {system_id} contract mismatch: {contract_version} != {CONTRACT_VERSION}"
                )
            specs[system_id] = AdapterSpec(
                system_id=system_id,
                system_name=system_name,
                module_name=module_info.name,
                contract_version=contract_version,
                adapter=adapter,
            )
            _HEALTH.setdefault(system_id, AdapterHealth(system_id=system_id))
    return specs


def get_adapter_registry(force_reload: bool = False) -> dict[str, AdapterSpec]:
    global _REGISTRY_CACHE
    if _REGISTRY_CACHE is None or force_reload:
        _REGISTRY_CACHE = _discover_adapter_specs()
    return _REGISTRY_CACHE


def get_adapter_health_snapshot() -> dict[str, dict[str, Any]]:
    return {system_id: asdict(state) for system_id, state in _HEALTH.items()}


def snapshot_registry_state() -> dict[str, Any]:
    return {
        "health": copy.deepcopy(_HEALTH),
        "eval_cache": copy.deepcopy(_EVAL_CACHE),
    }


def restore_registry_state(snapshot: dict[str, Any]) -> None:
    global _HEALTH, _EVAL_CACHE
    _HEALTH = copy.deepcopy(snapshot.get("health", {}))
    _EVAL_CACHE = OrderedDict(copy.deepcopy(snapshot.get("eval_cache", OrderedDict())))


def adapter_is_quarantined(system_id: str, config: RuntimeConfig) -> bool:
    state = _HEALTH.setdefault(system_id, AdapterHealth(system_id=system_id))
    state.quarantined = state.consecutive_failures >= config.quarantine_failures
    return state.quarantined


def record_adapter_success(system_id: str) -> None:
    state = _HEALTH.setdefault(system_id, AdapterHealth(system_id=system_id))
    state.successes += 1
    state.consecutive_failures = 0
    total = max(state.successes + state.failures, 1)
    state.health_score = round(max(0.05, min(1.0, state.successes / total)), 2)
    state.quarantined = False
    state.last_error = ""


def record_adapter_failure(system_id: str, error: str, config: RuntimeConfig) -> None:
    state = _HEALTH.setdefault(system_id, AdapterHealth(system_id=system_id))
    state.failures += 1
    state.consecutive_failures += 1
    state.last_error = error
    total = max(state.successes + state.failures, 1)
    success_ratio = state.successes / total
    penalty = min(state.consecutive_failures * 0.15, 0.75)
    state.health_score = round(max(0.05, success_ratio - penalty), 2)
    state.quarantined = state.consecutive_failures >= config.quarantine_failures


def make_evaluation_cache_key(
    system_id: str,
    system_data: dict[str, Any],
    intent_payload: dict[str, Any],
    profile: str,
) -> str:
    return _hash_payload(
        {
            "system_id": system_id,
            "system_data": system_data,
            "intent": intent_payload,
            "profile": profile,
        }
    )


def get_cached_evaluation(cache_key: str) -> Any | None:
    opinion = _EVAL_CACHE.get(cache_key)
    if opinion is None:
        return None
    _EVAL_CACHE.move_to_end(cache_key)
    return opinion


def store_cached_evaluation(cache_key: str, opinion: Any, config: RuntimeConfig) -> None:
    _EVAL_CACHE[cache_key] = opinion
    _EVAL_CACHE.move_to_end(cache_key)
    while len(_EVAL_CACHE) > config.adapter_cache_size:
        _EVAL_CACHE.popitem(last=False)
