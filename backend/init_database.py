"""Инициализация базы данных для глобального обновления Rescue System."""
from __future__ import annotations

import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, List

sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy.orm import Session  # noqa: E402
from sqlalchemy import func  # noqa: E402

from app.core.config import settings  # noqa: E402
from app.core.database import Base, SessionLocal, sync_engine  # noqa: E402
from app.core.security import get_password_hash  # noqa: E402
from app.models.team import RescueTeam  # noqa: E402
from app.models.user import User  # noqa: E402


SPECIALIZED_UNITS = [
    {
        "type": "fire",
        "name": "Пожарная служба",
        "summary": "Пламя, задымление, запах гари",
        "description": "Реагирует на пожары, взрывы и последствия теплового воздействия.",
        "accent": "#F97316",
        "icon": "flame",
        "capacity": "4–8 спасателей",
        "specialization": ["firefighter"],
    },
    {
        "type": "medical",
        "name": "Медицинская помощь",
        "summary": "Травмы, потеря сознания, реанимация",
        "description": "Экстренная помощь, стабилизация состояния и транспортировка пострадавших.",
        "accent": "#EF5DA8",
        "icon": "medical",
        "capacity": "3–6 медиков",
        "specialization": ["paramedic"],
    },
    {
        "type": "police",
        "name": "Полиция",
        "summary": "Угроза безопасности, правонарушения",
        "description": "Обеспечение правопорядка, сопровождение спасательных операций и эвакуаций.",
        "accent": "#60A5FA",
        "icon": "shield",
        "capacity": "4–10 сотрудников",
        "specialization": ["police"],
    },
    {
        "type": "water_rescue",
        "name": "Спасение на воде",
        "summary": "Течение, утопление, наводнение",
        "description": "Поиск людей на воде, эвакуация из подтопленных зон, работа с гидротехникой.",
        "accent": "#22D3EE",
        "icon": "waves",
        "capacity": "3–8 специалистов",
        "specialization": ["water_rescue"],
    },
    {
        "type": "mountain_rescue",
        "name": "Горноспасательная",
        "summary": "Лавина, обрыв, потеря ориентира",
        "description": "Работа в горах и труднодоступной местности, эвакуация с высоты.",
        "accent": "#8B5CF6",
        "icon": "mountain",
        "capacity": "4–12 специалистов",
        "specialization": ["mountain_rescue"],
    },
    {
        "type": "search_rescue",
        "name": "Поисково-спасательная",
        "summary": "Пропавшие люди, разведка местности",
        "description": "Поиск пропавших, работа с кинологами, дронами и тепловизорами.",
        "accent": "#34D399",
        "icon": "search",
        "capacity": "6–15 специалистов",
        "specialization": ["search_rescue"],
    },
    {
        "type": "ecological",
        "name": "Экологическая",
        "summary": "Химическая опасность, утечка газа",
        "description": "Ликвидация химических и биологических угроз, мониторинг окружающей среды.",
        "accent": "#FACC15",
        "icon": "biohazard",
        "capacity": "4–8 специалистов",
        "specialization": ["ecological"],
    },
    {
        "type": "multi_purpose",
        "name": "Общая ситуация",
        "summary": "Иной инцидент, требующий помощи",
        "description": "Комбинированные силы для нестандартных происшествий и поддержки других подразделений.",
        "accent": "#F472B6",
        "icon": "support",
        "capacity": "8–16 специалистов",
        "specialization": ["multi_purpose"],
        "badge": "выбрано",
    },
]


CORE_ACCOUNTS = (
    {
        "email": "admin@rescue-system.ru",
        "legacy_emails": ["admin@admin"],
        "password": "admin1",
        "role": "admin",
        "full_name": "Системный администратор",
        "phone": "+79990000001",
        "is_shared_account": False,
    },
    {
        "email": "operator@rescue-system.ru",
        "legacy_emails": ["operator@operator"],
        "password": "operator1",
        "role": "operator",
        "full_name": "Дежурный оператор",
        "phone": "+79990000002",
        "is_shared_account": False,
    },
    {
        "email": "team@rescue-system.ru",
        "legacy_emails": ["spasat@spasat"],
        "password": "spasat1",
        "role": "rescuer",
        "full_name": "Общий аккаунт спасателей",
        "phone": "+79990000003",
        "is_shared_account": True,
        "specialization": "multi_purpose",
    },
)


def drop_tables() -> None:
    """Полностью очистить базу данных."""
    print("🧹 Очистка существующих таблиц...")
    Base.metadata.drop_all(bind=sync_engine)
    print("✅ Таблицы удалены")


def create_tables() -> None:
    """Создать таблицы согласно текущим моделям."""
    print("🗄️  Создание таблиц...")
    Base.metadata.create_all(bind=sync_engine)
    print("✅ Таблицы созданы")


def _normalize_email(value: str | None) -> str | None:
    if not value:
        return None
    return value.strip().lower()


def _normalize_phone(value: str | None) -> str | None:
    if not value:
        return None
    cleaned = value.replace(" ", "").replace("-", "").replace("(", "").replace(")", "")
    return cleaned or None


def create_core_users(db: Session) -> Dict[str, User]:
    """Создать базовые аккаунты системы."""
    print("\n👤 Создание базовых аккаунтов...")

    created: Dict[str, User] = {}

    for raw_account in CORE_ACCOUNTS:
        account = raw_account.copy()
        legacy_emails: List[str] = [email for email in account.pop("legacy_emails", []) if email]
        password = account.pop("password")

        normalized_email = _normalize_email(account.get("email"))
        account["email"] = normalized_email
        account["phone"] = _normalize_phone(account.get("phone"))

        existing = (
            db.query(User)
            .filter(func.lower(User.email) == normalized_email)
            .first()
        )

        if not existing and legacy_emails:
            for legacy in legacy_emails:
                legacy_norm = _normalize_email(legacy)
                if not legacy_norm:
                    continue
                legacy_user = (
                    db.query(User)
                    .filter(func.lower(User.email) == legacy_norm)
                    .first()
                )
                if legacy_user:
                    print(f"  • Обновляем legacy email {legacy_user.email} → {normalized_email}")
                    legacy_user.email = normalized_email
                    if account.get("full_name"):
                        legacy_user.full_name = account["full_name"]
                    if account.get("phone"):
                        legacy_user.phone = account["phone"]
                    legacy_user.role = account.get("role", legacy_user.role)
                    legacy_user.is_shared_account = account.get("is_shared_account", legacy_user.is_shared_account)
                    legacy_user.specialization = account.get("specialization", legacy_user.specialization)
                    existing = legacy_user
                    break

        if existing:
            print(f"  • Уже существует: {existing.email}")
            created[existing.email] = existing
            continue

        user = User(
            **account,
            hashed_password=get_password_hash(password),
            is_active=True,
            is_verified=True,
            created_at=datetime.utcnow(),
        )
        db.add(user)
        db.flush()
        created[user.email] = user
        print(f"  ✓ Создано: {user.email} ({user.role})")

    db.commit()
    print(f"✅ Базовые аккаунты готовы: {len(created)}")
    return created


def create_specialized_teams(db: Session, users: Dict[str, User]) -> None:
    """Создать преднастроенные специализированные подразделения."""
    print("\n🚒 Подготовка специализированных подразделений...")

    shared_rescuer = users.get("team@rescue-system.ru") or users.get("spasat@spasat")
    default_lat = getattr(settings, "DEFAULT_LATITUDE", None)
    default_lon = getattr(settings, "DEFAULT_LONGITUDE", None)

    for unit in SPECIALIZED_UNITS:
        exists = (
            db.query(RescueTeam)
            .filter(RescueTeam.type == unit["type"], RescueTeam.name == unit["name"])
            .first()
        )
        if exists:
            print(f"  • Команда уже создана: {exists.name}")
            continue

        meta = {
            "summary": unit["summary"],
            "description": unit["description"],
            "accent": unit["accent"],
            "icon": unit["icon"],
        }
        if "badge" in unit:
            meta["badge"] = unit["badge"].upper()

        team = RescueTeam(
            name=unit["name"],
            type=unit["type"],
            status="available",
            contact_email="support@rescue-system.ru",
            contact_phone="8-800-500-600",
            base_latitude=default_lat,
            base_longitude=default_lon,
            base_address=unit.get("base_address", "Тверь, оперативный центр"),
            capacity=unit["capacity"],
            specialization=unit["specialization"],
            members=[],
            equipment=[],
            meta=meta,
            leader_id=None,
            leader_name=None,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )

        db.add(team)
        print(f"  ✓ Подразделение добавлено: {team.name}")

    if shared_rescuer:
        shared_rescuer.team_id = None
        shared_rescuer.is_team_leader = False

    db.commit()
    print("✅ Специализированные подразделения готовы")


def main() -> None:
    print("=" * 64)
    print("🚀 ИНИЦИАЛИЗАЦИЯ RESCUE SYSTEM (глобальное обновление)")
    print("=" * 64)

    drop_tables()
    create_tables()

    db = SessionLocal()
    try:
        users = create_core_users(db)
        create_specialized_teams(db, users)
    finally:
        db.close()

    print("\n✨ Инициализация завершена")
    print("Новые учетные записи:")
    print("  • admin@rescue-system.ru     / admin1")
    print("  • operator@rescue-system.ru / operator1")
    print("  • team@rescue-system.ru     / spasat1")
    print("Граждане регистрируются самостоятельно через приложение.")
    print("=" * 64)


if __name__ == "__main__":
    main()
