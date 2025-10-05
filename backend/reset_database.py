"""
Быстрый скрипт для очистки и пересоздания базы данных
ВНИМАНИЕ: Удаляет ВСЕ данные!
"""
import sys
import os
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from app.core.database import sync_engine, Base
from init_database import main as init_db


def drop_all_tables():
    """Удалить все таблицы"""
    print("⚠️  ВНИМАНИЕ: Удаление всех таблиц...")
    response = input("Вы уверены? Это удалит ВСЕ данные! (yes/no): ")
    
    if response.lower() != 'yes':
        print("❌ Отменено пользователем")
        sys.exit(0)
    
    print("🗑️  Удаление таблиц...")
    Base.metadata.drop_all(bind=sync_engine)
    print("✅ Таблицы удалены")


if __name__ == "__main__":
    print("=" * 60)
    print("🔄 ПОЛНЫЙ СБРОС БАЗЫ ДАННЫХ")
    print("=" * 60)
    
    drop_all_tables()
    print("\n")
    init_db()
