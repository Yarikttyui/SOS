"""Text Analysis Service powered exclusively by GigaChat."""
from __future__ import annotations

import json
from copy import deepcopy
from datetime import datetime
from typing import Any, Dict, List, Optional

from .gigachat import gigachat_client


EMERGENCY_TYPE_INFO: Dict[str, Dict[str, str]] = {
    "fire": {
        "name": "Пожар",
        "description": "Возгорание, дым или угроза распространения огня",
    },
    "medical": {
        "name": "Медицинская помощь",
        "description": "Травмы, болезни, необходимость экстренной помощи",
    },
    "police": {
        "name": "Полиция",
        "description": "Угроза безопасности, правонарушения, насилие",
    },
    "water_rescue": {
        "name": "Спасение на воде",
        "description": "Тонущее лицо, авария на воде, наводнение",
    },
    "mountain_rescue": {
        "name": "Горноспасательные работы",
        "description": "Схождение лавины, травмы в горах, застрявшие туристы",
    },
    "search_rescue": {
        "name": "Поисково-спасательная операция",
        "description": "Пропавшие люди, необходимость поиска территории",
    },
    "ecological": {
        "name": "Экологическая катастрофа",
        "description": "Химические выбросы, утечка газа, загрязнение",
    },
    "general": {
        "name": "Общая чрезвычайная ситуация",
        "description": "Нестандартная ситуация, требующая оценки",
    },
}

PRIORITY_INFO: List[Dict[str, Any]] = [
    {
        "level": 1,
        "name": "Критический",
        "description": "Угроза жизни, необходим немедленный отклик",
    },
    {
        "level": 2,
        "name": "Высокий",
        "description": "Срочная помощь, риск серьезного ухудшения",
    },
    {
        "level": 3,
        "name": "Средний",
        "description": "Требуется помощь в ближайшее время",
    },
    {
        "level": 4,
        "name": "Низкий",
        "description": "Мониторинг ситуации, опасность минимальна",
    },
    {
        "level": 5,
        "name": "Информационный",
        "description": "Сообщение для учета или планирования",
    },
]

SEVERITY_INFO: Dict[str, Dict[str, str]] = {
    "low": {
        "name": "Низкая",
        "description": "Ситуация под контролем, риск минимален",
    },
    "medium": {
        "name": "Средняя",
        "description": "Есть риски, требуются координированные действия",
    },
    "high": {
        "name": "Высокая",
        "description": "Серьезная угроза, необходимы усиленные меры",
    },
    "critical": {
        "name": "Критическая",
        "description": "Немедленная опасность жизни и здоровью",
    },
}


def _get_type_info(code: str) -> Dict[str, str]:
    return EMERGENCY_TYPE_INFO.get(code, EMERGENCY_TYPE_INFO["general"])


def _get_priority_info(level: int) -> Dict[str, Any]:
    for record in PRIORITY_INFO:
        if record.get("level") == level:
            return record
    for record in PRIORITY_INFO:
        if record.get("level") == 3:
            return record
    return PRIORITY_INFO[0]


def _get_severity_info(code: str) -> Dict[str, str]:
    return SEVERITY_INFO.get(code, SEVERITY_INFO["medium"])


def _build_reference_data() -> Dict[str, Any]:
    return {
        "types": [
            {"code": code, **info}
            for code, info in EMERGENCY_TYPE_INFO.items()
        ],
        "priorities": [record.copy() for record in PRIORITY_INFO],
        "severity_levels": [
            {"code": code, **info}
            for code, info in SEVERITY_INFO.items()
        ],
    }
def _ensure_list(value: Optional[Any]) -> List[Any]:
    if isinstance(value, list):
        return value
    if value is None:
        return []
    return [value]


def _safe_float(value: Any, default: float = 0.0) -> float:
    try:
        if value is None:
            return default
        return float(value)
    except (TypeError, ValueError):
        return default


def _safe_int(value: Any, default: int = 0) -> int:
    try:
        if value is None:
            return default
        return int(value)
    except (TypeError, ValueError):
        return default


class TextAnalyzer:
    """High-level text analysis routines backed by GigaChat."""

    def __init__(self) -> None:
        self.client = gigachat_client

    async def classify_emergency(self, text: str) -> Dict[str, Any]:
        """Classify emergency type and extract structured metadata."""
        try:
            classification = await self.client.classify_emergency(text)

            if classification.get("error"):
                raise RuntimeError(classification["error"])

            result: Dict[str, Any] = {
                "model_used": "gigachat",
                "generated_at": classification.get("generated_at")
                or datetime.utcnow().isoformat(),
                "type": classification.get("detected_type", "general"),
                "priority": _safe_int(classification.get("priority"), 3),
                "severity": classification.get("severity", "medium"),
                "confidence": _safe_float(classification.get("confidence"), 0.5),
                "risk_assessment": classification.get("risk_level", "requires_verification"),
                "keywords": _ensure_list(classification.get("keywords")),
                "estimated_victims": classification.get("estimated_victims"),
                "location_hints": _ensure_list(classification.get("location_hints")),
                "required_resources": _ensure_list(classification.get("resources")),
                "immediate_actions": _ensure_list(classification.get("guidance")),
                "warning": classification.get("warning"),
                "notes": classification.get("notes"),
                "gigachat_raw": classification,
            }

            type_info = _get_type_info(result["type"])
            priority_info = _get_priority_info(result["priority"])
            severity_info = _get_severity_info(result["severity"])

            result.update(
                {
                    "type_name": type_info["name"],
                    "type_description": type_info["description"],
                    "priority_name": priority_info["name"],
                    "priority_description": priority_info["description"],
                    "severity_name": severity_info["name"],
                    "severity_description": severity_info["description"],
                    "reference": _build_reference_data(),
                }
            )

            return result
        except Exception as exc:
            return {
                "model_used": "gigachat",
                "type": "general",
                "priority": 3,
                "severity": "medium",
                "keywords": [],
                "confidence": 0.0,
                "estimated_victims": None,
                "location_hints": [],
                "required_resources": ["Базовая спасательная команда"],
                "immediate_actions": ["Отправить спасателей"],
                "risk_assessment": "Требуется уточнение",
                "warning": None,
                "notes": None,
                "gigachat_raw": None,
                "type_name": EMERGENCY_TYPE_INFO["general"]["name"],
                "type_description": EMERGENCY_TYPE_INFO["general"]["description"],
                "priority_name": _get_priority_info(3)["name"],
                "priority_description": _get_priority_info(3)["description"],
                "severity_name": _get_severity_info("medium")["name"],
                "severity_description": _get_severity_info("medium")["description"],
                "reference": _build_reference_data(),
                "error": str(exc),
            }

    async def generate_rescue_plan(
        self,
        emergency_type: str,
        description: str,
        location: str = "",
        resources_available: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """Generate detailed rescue operation plan using GigaChat."""
        try:
            plan_response = await self.client.generate_rescue_plan(
                emergency_type=emergency_type,
                description=description,
                location=location,
                resources=resources_available,
            )

            if plan_response.get("error"):
                raise RuntimeError(plan_response["error"])

            plan = deepcopy(plan_response)
            raw_plan = deepcopy(plan_response)

            plan["model_used"] = plan.get("model_used") or "gigachat"
            plan["generated_at"] = plan.get("generated_at") or datetime.utcnow().isoformat()
            plan["priority"] = _safe_int(plan.get("priority"), 3)
            plan["risk_level"] = plan.get("risk_level", "medium")
            plan["guidance"] = _ensure_list(plan.get("guidance"))
            plan["resources"] = _ensure_list(plan.get("resources")) or (resources_available or [])
            plan["phases"] = _ensure_list(plan.get("phases"))
            plan["success_criteria"] = _ensure_list(plan.get("success_criteria"))
            plan["risks"] = _ensure_list(plan.get("risks"))
            plan["safety_measures"] = _ensure_list(plan.get("safety_measures"))
            plan["contingency_plans"] = _ensure_list(plan.get("contingency_plans"))
            plan["evacuation_routes"] = _ensure_list(plan.get("evacuation_routes"))
            plan["communication_plan"] = plan.get("communication_plan") or ""
            plan["medical_support"] = plan.get("medical_support") or ""
            plan["team_composition"] = plan.get("team_composition") or {}
            plan["recommended_team"] = plan.get("recommended_team")
            plan["estimated_time"] = plan.get("estimated_time")
            plan["notes"] = plan.get("notes")
            plan["gigachat_raw"] = raw_plan
            plan["reference"] = _build_reference_data()

            return plan
        except Exception as exc:
            return {
                "model_used": "gigachat",
                "operation_name": "Стандартная спасательная операция",
                "phases": [
                    {
                        "phase_number": 1,
                        "phase_name": "Оценка ситуации",
                        "duration_estimate": "15 минут",
                        "actions": ["Прибыть на место", "Оценить обстановку"],

                        "required_personnel": ["Руководитель группы"],
                        "equipment_needed": ["Средства связи"],
                    }
                ],
                "team_composition": {
                    "team_leader": "Старший спасатель",
                    "members": ["Спасатель 1", "Спасатель 2"],
                    "specialists": [],
                },
                "safety_measures": ["Использовать СИЗ"],
                "communication_plan": "Радиосвязь",
                "evacuation_routes": ["Основной маршрут"],
                "medical_support": "Базовая первая помощь",
                "contingency_plans": ["Вызвать подкрепление"],
                "estimated_duration": "1-2 часа",
                "success_criteria": ["Все пострадавшие в безопасности"],
                "risks": ["Изменение погоды", "Недостаток ресурсов"],
                "guidance": ["Следовать стандартным протоколам спасения"],
                "resources": resources_available or ["Базовое спасательное оборудование"],
                "recommended_team": None,
                "estimated_time": None,
                "notes": None,
                "gigachat_raw": None,
                "reference": _build_reference_data(),
                "error": str(exc),
            }

    async def analyze_situation_report(self, report_text: str) -> Dict[str, Any]:
        """Analyze detailed situation reports via GigaChat."""

        def _parse_response(content: str) -> Dict[str, Any]:
            try:
                return json.loads(content)
            except json.JSONDecodeError:
                start = content.find("{")
                end = content.rfind("}")
                if start != -1 and end != -1 and end > start:
                    try:
                        return json.loads(content[start : end + 1])
                    except json.JSONDecodeError:
                        pass
                raise

        try:
            messages = [
                {
                    "role": "system",
                    "content": (
                        "Ты аналитик спасательных операций. Проанализируй отчет и верни JSON с полями: "
                        "summary (string), key_points (array), current_status (string), challenges (array), progress (string), "
                        "next_steps (array), sentiment (positive|neutral|negative|critical), urgency_level (1-5)."
                    ),
                },
                {"role": "user", "content": report_text},
            ]

            data = await self.client.chat_completion(messages)
            content = data["choices"][0]["message"]["content"]

            parsed = _parse_response(content)

            parsed.setdefault("summary", "")
            parsed.setdefault("key_points", [])
            parsed.setdefault("current_status", "Не определен")
            parsed.setdefault("challenges", [])
            parsed.setdefault("progress", "Не определен")
            parsed.setdefault("next_steps", [])
            parsed.setdefault("sentiment", "neutral")
            parsed.setdefault("urgency_level", 3)
            parsed["model_used"] = "gigachat"
            parsed["gigachat_raw"] = data

            return parsed
        except Exception as exc:
            return {
                "summary": "Ошибка анализа",
                "key_points": [],
                "current_status": "Не определен",
                "challenges": [],
                "progress": "Не определен",
                "next_steps": [],
                "sentiment": "neutral",
                "urgency_level": 3,
                "model_used": "gigachat",
                "gigachat_raw": None,
                "error": str(exc),
            }

