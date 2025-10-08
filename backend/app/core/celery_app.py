"""Celery application configuration for Rescue System."""
from __future__ import annotations

from celery import Celery

from app.core.config import settings


celery_app = Celery("rescue-system")
celery_app.conf.broker_url = settings.REDIS_URL
celery_app.conf.result_backend = settings.REDIS_URL
celery_app.conf.task_default_queue = "default"
celery_app.conf.task_track_started = True
celery_app.conf.task_serializer = "json"
celery_app.conf.result_serializer = "json"
celery_app.conf.accept_content = ["json"]
@celery_app.task(name="rescue_system.health_check")
def health_check() -> str:
    """Простой ping-task, чтобы убедиться, что Celery поднялся."""
    return "ok"


__all__ = ["celery_app", "health_check"]
