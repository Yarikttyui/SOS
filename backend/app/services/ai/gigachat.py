"""GigaChat AI client for enhanced emergency guidance"""
from __future__ import annotations

import asyncio
import json
from datetime import datetime, timedelta
from typing import Any, Dict, Optional

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
            payload = {"scope": self._scope}

            async with httpx.AsyncClient(verify=self._verify, timeout=30) as client:
                response = await client.post(
                    token_url,
                    headers={"Authorization": f"Basic {self._auth_key}"},
                    data=payload,
                )
                response.raise_for_status()
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


gigachat_client = GigaChatClient()
