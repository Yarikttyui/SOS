"""GigaChat AI client for enhanced emergency guidance"""
from __future__ import annotations

import asyncio
import json
import uuid
from datetime import datetime, timedelta
from typing import Any, Dict, Optional, List

import httpx

from app.core.config import settings


class GigaChatClient:
    """Simple asynchronous client for Sber GigaChat API."""

    def __init__(self) -> None:
        self._auth_key = settings.GIGACHAT_AUTH_KEY
        self._base_url = settings.GIGACHAT_BASE_URL.rstrip("/")
        self._scope = settings.GIGACHAT_SCOPE
        self._verify = settings.GIGACHAT_VERIFY_SSL
        self._token: Optional[str] = None
        self._token_expiry: Optional[datetime] = None
        self._lock = asyncio.Lock()

    async def _ensure_token(self) -> None:
        """Fetch or refresh access token when necessary."""
        if not self._auth_key:
            raise RuntimeError("GigaChat AUTH key is not configured")

        if self._token and self._token_expiry and datetime.utcnow() < self._token_expiry:
            return

        async with self._lock:
            if self._token and self._token_expiry and datetime.utcnow() < self._token_expiry:
                return

            token_url = f"{self._base_url}/oauth/token"
            payload = {
                "scope": self._scope,
                "grant_type": "client_credentials",
            }

            headers = {
                "Authorization": f"Basic {self._auth_key}",
                "Content-Type": "application/x-www-form-urlencoded",
                "Accept": "application/json",
                "RqUID": str(uuid.uuid4()),
            }

            async with httpx.AsyncClient(verify=self._verify, timeout=30) as client:
                response = await client.post(
                    token_url,
                    headers=headers,
                    data=payload,
                )
                try:
                    response.raise_for_status()
                except httpx.HTTPStatusError as exc:
                    detail = exc.response.text.strip()
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

        async with httpx.AsyncClient(verify=self._verify, timeout=60) as client:
            response = await client.post(
                completion_url,
                headers={
                    "Authorization": f"Bearer {self._token}",
                    "Content-Type": "application/json",
                    "RqUID": str(uuid.uuid4()),
                },
                content=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
            )
            response.raise_for_status()
            return response.json()

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


gigachat_client = GigaChatClient()
