"""Актуализация базовых аккаунтов без пересоздания таблиц."""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from app.core.database import SessionLocal  # noqa: E402
from init_database import create_core_users  # noqa: E402


def main() -> None:
    print("=" * 64)
    print("🔄 Обновление базовых аккаунтов Rescue System")
    print("=" * 64)
    db = SessionLocal()
    try:
        create_core_users(db)
    finally:
        db.close()
    print("✨ Готово!" )
    print("=" * 64)


if __name__ == "__main__":
    main()
