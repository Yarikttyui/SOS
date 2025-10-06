"""Yandex GPT client for emergency intelligence"""
from __future__ import annotations

import json
import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

import httpx

from app.core.config import settings


logger = logging.getLogger(__name__)


class YandexGPTClient:
    """Asynchronous client for Yandex Cloud GPT APIs."""

    def __init__(self) -> None:
        self._api_key = settings.YANDEX_GPT_API_KEY.strip()
        self._folder_id = settings.YANDEX_GPT_FOLDER_ID.strip()
        self._model = (settings.YANDEX_GPT_MODEL or "yandexgpt-lite").strip()
        self._completion_url = settings.YANDEX_GPT_COMPLETION_URL.rstrip("/")
        self._default_temperature = settings.YANDEX_GPT_TEMPERATURE
        self._default_max_tokens = settings.YANDEX_GPT_MAX_TOKENS

    @property
    def model_name(self) -> str:
        return self._model or "yandexgpt-lite"

    def _build_headers(self) -> Dict[str, str]:
        if not self._api_key:
            raise RuntimeError("YANDEX_GPT_API_KEY is not configured")
        if not self._folder_id:
            raise RuntimeError("YANDEX_GPT_FOLDER_ID is not configured")

        return {
            "Authorization": f"Api-Key {self._api_key}",
            "X-Folder-Id": self._folder_id,
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

    def _build_messages(self, messages: List[Dict[str, str]]) -> List[Dict[str, str]]:
        prepared: List[Dict[str, str]] = []
        for message in messages:
            role = message.get("role", "user")
            text = message.get("content") or message.get("text") or ""
            if isinstance(text, list):
                text = "\n".join(str(item) for item in text if item)
            prepared.append({"role": role, "text": str(text)})
        return prepared

    async def chat_completion(
        self,
        messages: List[Dict[str, str]],
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
    ) -> Dict[str, Any]:
        headers = self._build_headers()
        payload = {
            "modelUri": f"gpt://{self._folder_id}/{self.model_name}",
            "completionOptions": {
                "stream": False,
                "temperature": float(temperature if temperature is not None else self._default_temperature),
                "maxTokens": int(max_tokens if max_tokens is not None else self._default_max_tokens),
            },
            "messages": self._build_messages(messages),
        }

        async with httpx.AsyncClient(timeout=60) as client:
            response = await client.post(self._completion_url, headers=headers, json=payload)

        try:
            response.raise_for_status()
        except httpx.HTTPStatusError as exc:
            detail = self._extract_error(exc.response)
            logger.warning("Yandex GPT completion failed: status=%s detail=%s", exc.response.status_code, detail)
            raise RuntimeError(
                f"Yandex GPT request failed (status {exc.response.status_code}): {detail or exc.response.reason_phrase}"
            ) from exc

        raw = response.json()
        alternatives = (raw.get("result") or {}).get("alternatives") or []
        content = ""
        if alternatives:
            message = alternatives[0].get("message") or {}
            content = message.get("text") or message.get("content") or ""
        return {
            "choices": [{"message": {"content": content}}],
            "raw": raw,
        }

    async def suggest_actions(self, emergency_description: str) -> Dict[str, Any]:
        try:
            messages = [
                {
                    "role": "system",
                    "content": (
                        "Ты опытный координатор спасательных служб. На основе описания ситуации дай чёткий перечень действий, "
                        "приоритетов и предупреждений. Отвечай строго в JSON с полями: guidance (array of strings), "
                        "checklist (array of strings), priority (1-5), warning (string)."
                    ),
                },
                {"role": "user", "content": emergency_description},
            ]
            data = await self.chat_completion(messages)
            content = data["choices"][0]["message"]["content"]
            parsed = json.loads(content)
            parsed["provider"] = self.model_name
            parsed["raw"] = data.get("raw")
            return parsed
        except Exception as exc:
            return {
                "provider": self.model_name,
                "error": str(exc),
                "guidance": [],
                "checklist": [],
                "priority": None,
                "warning": "Не удалось получить рекомендации от Yandex GPT",
            }

    async def classify_emergency(self, description: str) -> Dict[str, Any]:
        try:
            messages = [
                {
                    "role": "system",
                    "content": (
                        "Ты аналитик спасательных служб. На основе описания классифицируй тип ЧС, приоритет, риски и дай рекомендации. "
                        "Верни СТРОГО JSON со следующими полями: detected_type (fire|medical|police|water_rescue|mountain_rescue|search_rescue|ecological|general), "
                        "priority (1-5), severity (low|medium|high|critical), confidence (0-1), risk_level (string), keywords (array of strings), "
                        "estimated_victims (integer или null), location_hints (array), resources (array), guidance (array), warning (string или null), notes (string или null)."
                    ),
                },
                {"role": "user", "content": description},
            ]

            data = await self.chat_completion(messages)
            content = data["choices"][0]["message"]["content"]
            parsed = json.loads(content)

            parsed.setdefault("detected_type", "general")
            parsed.setdefault("priority", 3)
            parsed.setdefault("severity", "medium")
            parsed.setdefault("confidence", 0.5)
            parsed.setdefault("risk_level", "requires_verification")
            parsed.setdefault("keywords", [])
            parsed.setdefault("estimated_victims", None)
            parsed.setdefault("location_hints", [])
            parsed.setdefault("resources", [])
            parsed.setdefault("guidance", [])
            parsed.setdefault("warning", None)
            parsed.setdefault("notes", None)

            heuristics = self._heuristic_analysis(description)
            parsed.setdefault("heuristics", heuristics)

            if parsed.get("detected_type") in {None, "", "general"} and heuristics["detected_type"]:
                parsed["detected_type"] = heuristics["detected_type"]

            parsed["priority"] = self._normalize_priority(parsed.get("priority"), heuristics["priority"])
            parsed["severity"] = self._normalize_severity(parsed.get("severity"), heuristics["severity"])
            parsed["confidence"] = max(
                self._clamp_float(parsed.get("confidence", 0.5)),
                heuristics["confidence_boost"],
            )
            parsed["risk_level"] = heuristics["risk_level"] or parsed.get("risk_level", "requires_verification")

            self._augment_keywords(parsed, heuristics)

            parsed["generated_at"] = datetime.utcnow().isoformat()
            parsed["provider"] = self.model_name
            parsed["raw"] = data.get("raw")

            return parsed
        except Exception as exc:
            return {
                "provider": self.model_name,
                "error": str(exc),
                "detected_type": "general",
                "priority": 3,
                "severity": "medium",
                "confidence": 0.0,
                "risk_level": "unknown",
                "keywords": [],
                "estimated_victims": None,
                "location_hints": [],
                "resources": [],
                "guidance": [],
                "warning": "Не удалось получить анализ от Yandex GPT",
            }

    async def generate_rescue_plan(
        self,
        emergency_type: str,
        description: str,
        location: str = "",
        resources: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        try:
            resources_str = ", ".join(resources) if resources else "стандартные ресурсы"
            messages = [
                {
                    "role": "system",
                    "content": (
                        "Ты координатор спасательных операций. Создай детальный план действий. "
                        "Верни СТРОГО JSON с полями: operation_name (string), phases (array of objects с полями phase_number, phase_name, duration_estimate, actions (array), required_personnel (array), equipment_needed (array)), "
                        "team_composition (object с полями team_leader, members, specialists), safety_measures (array), communication_plan (string), evacuation_routes (array), "
                        "medical_support (string), contingency_plans (array), estimated_duration (string), success_criteria (array), risks (array), guidance (array), resources (array), "
                        "priority (1-5), risk_level (string), recommended_team (string|null), estimated_time (string|null), notes (string|null)."
                    ),
                },
                {
                    "role": "user",
                    "content": json.dumps(
                        {
                            "emergency_type": emergency_type,
                            "description": description,
                            "location": location or "не указано",
                            "resources_available": resources_str,
                        },
                        ensure_ascii=False,
                    ),
                },
            ]

            data = await self.chat_completion(messages, temperature=0.25)
            content = data["choices"][0]["message"]["content"]
            parsed = json.loads(content)

            parsed.setdefault("operation_name", "План спасательной операции")
            parsed.setdefault("phases", [])
            parsed.setdefault("team_composition", {})
            parsed.setdefault("safety_measures", [])
            parsed.setdefault("communication_plan", "")
            parsed.setdefault("evacuation_routes", [])
            parsed.setdefault("medical_support", "")
            parsed.setdefault("contingency_plans", [])
            parsed.setdefault("estimated_duration", "")
            parsed.setdefault("success_criteria", [])
            parsed.setdefault("risks", [])
            parsed.setdefault("guidance", [])
            parsed.setdefault("resources", resources or [])
            parsed.setdefault("priority", 3)
            parsed.setdefault("risk_level", "medium")
            parsed.setdefault("recommended_team", None)
            parsed.setdefault("estimated_time", None)
            parsed.setdefault("notes", None)
            parsed["generated_at"] = datetime.utcnow().isoformat()
            parsed["provider"] = self.model_name
            parsed["raw"] = data.get("raw")

            return parsed
        except Exception as exc:
            return {
                "provider": self.model_name,
                "error": str(exc),
                "operation_name": "Стандартная спасательная операция",
                "phases": [],
                "team_composition": {},
                "safety_measures": [],
                "communication_plan": "",
                "evacuation_routes": [],
                "medical_support": "",
                "contingency_plans": [],
                "estimated_duration": "",
                "success_criteria": [],
                "risks": [],
                "guidance": [],
                "resources": resources or [],
                "priority": 3,
                "risk_level": "unknown",
            }

    def _heuristic_analysis(self, description: str) -> Dict[str, Any]:
        text = (description or "").lower()
        found_keywords: set[str] = set()

        type_keywords: Dict[str, List[str]] = {
            "fire": [
                "пожар",
                "горит",
                "огонь",
                "пламя",
                "дым",
                "воспламен",
                "fire",
                "flame",
                "burn",
                "smoke",
            ],
            "medical": [
                "сердце",
                "инфаркт",
                "инсульт",
                "без сознания",
                "не дышит",
                "кровотеч",
                "рана",
                "перелом",
                "ожог",
                "судорога",
                "heart",
                "stroke",
                "bleed",
                "unconscious",
                "breath",
            ],
            "police": [
                "оруж",
                "драка",
                "напал",
                "угроза",
                "разбой",
                "ограб",
                "knife",
                "gun",
                "violence",
                "fight",
            ],
            "water_rescue": [
                "тонет",
                "утону",
                "река",
                "озеро",
                "вода",
                "плот",
                "лодк",
                "drown",
                "river",
                "lake",
                "water",
            ],
            "mountain_rescue": [
                "гора",
                "склон",
                "скала",
                "альп",
                "лавин",
                "обрыв",
                "mount",
                "climb",
                "rockfall",
            ],
            "search_rescue": [
                "пропал",
                "пропала",
                "исчез",
                "не выходит на связь",
                "lost",
                "search",
                "поиск",
                "missing",
            ],
            "ecological": [
                "химичес",
                "утечк",
                "газ",
                "радии",
                "разлив",
                "токс",
                "chemical",
                "hazmat",
                "spill",
                "radiation",
            ],
            "general": [],
        }

        type_scores: Dict[str, int] = {}
        for emergency_type, keywords in type_keywords.items():
            matches = [kw for kw in keywords if kw and kw in text]
            if matches:
                type_scores[emergency_type] = len(matches)
                found_keywords.update(matches)

        detected_type = max(type_scores, key=type_scores.get) if type_scores else "general"

        priority = 3
        severity = "medium"
        confidence_boost = 0.45 if type_scores else 0.35

        critical_markers = [
            "массов",
            "несколько человек",
            "много людей",
            "дети",
            "ребенок",
            "берем",
            "не дышит",
            "остановилось сердце",
            "massive bleeding",
            "explosion",
            "обруш",
            "завалило",
            "chemical burn",
        ]
        high_markers = [
            "сильное кровотеч",
            "ножев",
            "огнестр",
            "оруж",
            "перелом",
            "потерял сознание",
            "жечь",
            "удар током",
            "пожар",
            "пламя",
            "gas leak",
        ]
        low_markers = [
            "легкая",
            "небольш",
            "царап",
            "ушиб",
            "без травм",
            "контроль",
            "столкновение без пострадавших",
            "minor",
            "stabilized",
        ]
        reassurance_markers = [
            "учения",
            "тренировка",
            "ложная тревога",
            "false alarm",
            "проверка",
        ]

        if any(marker in text for marker in critical_markers):
            severity = "critical"
            priority = 1
            confidence_boost = max(confidence_boost, 0.9)
        elif any(marker in text for marker in high_markers):
            severity = "high"
            priority = min(priority, 2)
            confidence_boost = max(confidence_boost, 0.75)
        elif any(marker in text for marker in low_markers):
            severity = "low"
            priority = max(priority, 4)
            confidence_boost = max(confidence_boost, 0.55)

        if severity != "critical" and any(marker in text for marker in reassurance_markers):
            severity = "low"
            priority = 5
            confidence_boost = max(confidence_boost, 0.5)

        if "эвакуац" in text or "evacu" in text:
            found_keywords.add("эвакуация")
            priority = min(priority, 2)

        if "взрыв" in text or "explosion" in text:
            found_keywords.add("взрыв")
            severity = "critical"
            priority = 1
            confidence_boost = max(confidence_boost, 0.9)

        resources_map: Dict[str, List[str]] = {
            "fire": ["Пожарный расчёт", "Автоцистерна", "Пеногенератор"],
            "medical": ["Бригада СМП", "Реанимационная бригада", "Аптечка расширенная"],
            "police": ["Наряд полиции", "Группа быстрого реагирования"],
            "water_rescue": ["Водолазы", "Катер МЧС", "Спасательные круги"],
            "mountain_rescue": ["Горная поисковая группа", "Альпинистское снаряжение"],
            "search_rescue": ["Поисково-спасательный отряд", "Квадрокоптер", "Кинологи"],
            "ecological": ["Химическая лаборатория", "Защитные костюмы", "Дезактивация"],
            "general": [],
        }

        severity_to_risk = {
            "critical": "life_threatening",
            "high": "high_risk",
            "medium": "requires_coordination",
            "low": "monitoring",
        }

        return {
            "detected_type": detected_type,
            "priority": priority,
            "severity": severity,
            "risk_level": severity_to_risk.get(severity, "requires_verification"),
            "keywords": sorted(found_keywords),
            "resources": resources_map.get(detected_type, []),
            "confidence_boost": max(0.0, min(1.0, confidence_boost)),
        }

    @staticmethod
    def _normalize_priority(model_priority: Any, heuristic_priority: Optional[int]) -> int:
        fallback = heuristic_priority or 3
        try:
            value = int(model_priority)
        except (TypeError, ValueError):
            value = fallback

        if not 1 <= value <= 5:
            value = fallback

        if heuristic_priority:
            value = min(value, heuristic_priority)

        return max(1, min(5, value))

    @staticmethod
    def _normalize_severity(model_severity: Any, heuristic_severity: Optional[str]) -> str:
        allowed = {"low", "medium", "high", "critical"}
        if isinstance(model_severity, str):
            severity = model_severity.lower().strip()
        else:
            severity = ""

        if severity not in allowed:
            severity = heuristic_severity or "medium"

        if heuristic_severity and allowed:
            order = {"low": 0, "medium": 1, "high": 2, "critical": 3}
            if order.get(heuristic_severity, 1) > order.get(severity, 1):
                severity = heuristic_severity

        return severity

    @staticmethod
    def _clamp_float(value: Any, default: float = 0.5) -> float:
        try:
            numeric = float(value)
        except (TypeError, ValueError):
            return default
        return max(0.0, min(1.0, numeric))

    def _augment_keywords(self, parsed: Dict[str, Any], heuristics: Dict[str, Any]) -> None:
        keywords = {str(kw).strip() for kw in parsed.get("keywords") or [] if kw}
        keywords.update(heuristics.get("keywords") or [])
        parsed["keywords"] = sorted(k for k in keywords if k)

        resource_set = {str(res).strip() for res in parsed.get("resources") or [] if res}
        for extra in heuristics.get("resources") or []:
            if extra:
                resource_set.add(extra)
        parsed["resources"] = sorted(resource_set)

    @staticmethod
    def _extract_error(response: httpx.Response) -> str:
        text = response.text.strip()
        if not text:
            return ""
        if text.startswith("{"):
            try:
                data = response.json()
            except json.JSONDecodeError:
                return text[:200]
            detail = (
                data.get("errorDescription")
                or data.get("message")
                or data.get("detail")
                or data.get("error")
            )
            if isinstance(detail, (dict, list)):
                return json.dumps(detail, ensure_ascii=False)[:200]
            if detail:
                return str(detail)
        return text[:200]


yandex_gpt_client = YandexGPTClient()
