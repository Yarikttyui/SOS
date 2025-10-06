"""GigaChat AI client for enhanced emergency guidance"""
from __future__ import annotations

import asyncio
import base64
import binascii
import json
import logging
import uuid
from datetime import datetime, timedelta
from typing import Any, Dict, Optional, List

import httpx
from email.utils import formatdate

from app.core.config import settings


logger = logging.getLogger(__name__)


class GigaChatClient:
    """Simple asynchronous client for Sber GigaChat API."""

    def __init__(self) -> None:
        self._auth_key = settings.GIGACHAT_AUTH_KEY.strip()
        self._client_id = settings.GIGACHAT_CLIENT_ID.strip()
        self._client_secret = settings.GIGACHAT_CLIENT_SECRET.strip()
        self._base_url = settings.GIGACHAT_BASE_URL.rstrip("/")
        self._auth_url = settings.GIGACHAT_AUTH_URL.rstrip("/") if settings.GIGACHAT_AUTH_URL else ""
        self._scope = settings.GIGACHAT_SCOPE
        self._verify = settings.GIGACHAT_VERIFY_SSL
        self._token: Optional[str] = None
        self._token_expiry: Optional[datetime] = None
        self._lock = asyncio.Lock()

    def _resolve_basic_header(self) -> str:
        """Build Authorization header supporting both encoded and raw credentials."""
        credential_source = self._auth_key

        if not credential_source and self._client_id and self._client_secret:
            credential_source = f"{self._client_id}:{self._client_secret}"

        if not credential_source:
            raise RuntimeError("GigaChat credentials are not configured")

        credential_source = credential_source.strip()

        if credential_source.lower().startswith("basic "):
            return credential_source

        if ":" in credential_source:
            encoded = base64.b64encode(credential_source.encode("utf-8")).decode("utf-8")
        else:
            try:
                base64.b64decode(credential_source, validate=True)
                encoded = credential_source
            except (binascii.Error, ValueError):
                encoded = base64.b64encode(credential_source.encode("utf-8")).decode("utf-8")

        return f"Basic {encoded}"

    async def _ensure_token(self) -> None:
        """Fetch or refresh access token when necessary."""
        if not (self._auth_key or (self._client_id and self._client_secret)):
            raise RuntimeError("GigaChat AUTH key is not configured")

        if self._token and self._token_expiry and datetime.utcnow() < self._token_expiry:
            return

        async with self._lock:
            if self._token and self._token_expiry and datetime.utcnow() < self._token_expiry:
                return

            token_base = self._auth_url or self._base_url
            if token_base.endswith("/oauth") or token_base.endswith("/oauth/"):
                token_url = token_base.rstrip("/")
            else:
                token_url = f"{token_base}/oauth"
            if token_url.endswith("/api/v1/oauth"):
                token_url = f"{token_url}/token"

            payload = {
                "scope": self._scope,
                "grant_type": "client_credentials",
            }

            headers = {
                "Authorization": self._resolve_basic_header(),
                "Content-Type": "application/x-www-form-urlencoded",
                "Accept": "application/json",
                "RqUID": str(uuid.uuid4()),
                "Date": formatdate(usegmt=True),
            }

            if self._client_id:
                headers.setdefault("X-Client-ID", self._client_id)

            async with httpx.AsyncClient(verify=self._verify, timeout=30) as client:
                response = await client.post(token_url, headers=headers, data=payload)

            try:
                response.raise_for_status()
            except httpx.HTTPStatusError as exc:
                detail = _safe_error_detail(exc.response)
                logger.warning(
                    "GigaChat auth failed: status=%s detail=%s", exc.response.status_code, detail
                )
                raise RuntimeError(
                    f"GigaChat auth failed (status {exc.response.status_code}): {detail or exc.response.reason_phrase}"
                ) from exc

            data = response.json()

            self._token = data.get("access_token")
            expires_in = data.get("expires_in") or data.get("expires_at")
            ttl_seconds = 600
            if isinstance(expires_in, (int, float)):
                ttl_seconds = max(int(expires_in) - 30, 60)
            self._token_expiry = datetime.utcnow() + timedelta(seconds=ttl_seconds)

    async def chat_completion(self, messages: list[dict[str, str]], temperature: float = 0.2) -> Dict[str, Any]:
        """Call GigaChat chat completion endpoint."""
        await self._ensure_token()

        completion_url = f"{self._base_url}/chat/completions"
        payload = {
            "model": "GigaChat",
            "messages": messages,
            "temperature": temperature,
            "max_tokens": 1024,
        }

        attempt = 0
        while attempt < 2:
            attempt += 1
            async with httpx.AsyncClient(verify=self._verify, timeout=60) as client:
                headers = {
                    "Authorization": f"Bearer {self._token}",
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "RqUID": str(uuid.uuid4()),
                    "Date": formatdate(usegmt=True),
                }
                if self._client_id:
                    headers.setdefault("X-Client-ID", self._client_id)

                response = await client.post(
                    completion_url,
                    headers=headers,
                    content=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
                )

            try:
                response.raise_for_status()
                return response.json()
            except httpx.HTTPStatusError as exc:
                status_code = exc.response.status_code
                detail = _safe_error_detail(exc.response)
                logger.warning(
                    "GigaChat completion failed: status=%s detail=%s attempt=%s",
                    status_code,
                    detail,
                    attempt,
                )
                if status_code in {401, 403} and attempt == 1:
                    self._token = None
                    self._token_expiry = None
                    await self._ensure_token()
                    continue
                raise RuntimeError(
                    f"GigaChat request failed (status {status_code}): {detail or exc.response.reason_phrase}"
                ) from exc

    async def suggest_actions(self, emergency_description: str) -> Dict[str, Any]:
        """Get actionable guidance for an emergency description."""
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
                {
                    "role": "user",
                    "content": emergency_description,
                },
            ]

            data = await self.chat_completion(messages)
            content = data["choices"][0]["message"]["content"]
            parsed = json.loads(content)
            parsed["provider"] = "gigachat"
            return parsed
        except Exception as exc:
            return {
                "provider": "gigachat",
                "error": str(exc),
                "guidance": [],
                "checklist": [],
                "priority": None,
                "warning": "Не удалось получить рекомендации от GigaChat",
            }

    async def classify_emergency(self, description: str) -> Dict[str, Any]:
        """Classify emergency and provide structured assessment."""
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
            parsed["provider"] = "gigachat"

            return parsed
        except Exception as exc:
            return {
                "provider": "gigachat",
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
                "warning": "Не удалось получить анализ от GigaChat",
            }

    async def generate_rescue_plan(
        self,
        emergency_type: str,
        description: str,
        location: str = "",
        resources: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """Generate detailed rescue plan."""
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
            parsed["provider"] = "gigachat"

            return parsed
        except Exception as exc:
            return {
                "provider": "gigachat",
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


gigachat_client = GigaChatClient()


def _safe_error_detail(response: httpx.Response) -> str:
    text = response.text.strip()
    if not text:
        return ""
    if text.startswith("{"):
        try:
            data = response.json()
        except json.JSONDecodeError:
            return text[:200]
        detail = (
            data.get("error_description")
            or data.get("message")
            or data.get("detail")
            or data.get("error")
        )
        if isinstance(detail, (dict, list)):
            return json.dumps(detail, ensure_ascii=False)[:200]
        if detail:
            return str(detail)
    return text[:200]
