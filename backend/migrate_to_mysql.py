"""
Скрипт миграции данных из SQLite в MySQL
Переносит все данные из текущей SQLite базы в MySQL
"""
import sys
import os
from pathlib import Path

# Добавляем путь к модулям приложения
sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import pymysql

# Конфигурация
SQLITE_DB = "sqlite:///./rescue.db"
MYSQL_DB = "mysql+pymysql://rescue_user:55646504@localhost:3306/rescue_db?charset=utf8mb4"


def migrate_data():
    """Мигрировать данные из SQLite в MySQL"""
    
    print("🔗 Подключение к базам данных...")
    
    # Подключение к SQLite
    sqlite_engine = create_engine(SQLITE_DB)
    SQLiteSession = sessionmaker(bind=sqlite_engine)
    sqlite_session = SQLiteSession()
    
    # Подключение к MySQL
    mysql_engine = create_engine(MYSQL_DB, echo=True)
    MySQLSession = sessionmaker(bind=mysql_engine)
    mysql_session = MySQLSession()
    
    try:
        # Получить список таблиц из SQLite
        print("\n📋 Получение списка таблиц...")
        tables_query = text("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
        tables = sqlite_session.execute(tables_query).fetchall()
        table_names = [table[0] for table in tables]
        
        print(f"Найдено таблиц: {len(table_names)}")
        for table_name in table_names:
            print(f"  - {table_name}")
        
        # Мигрировать каждую таблицу
        for table_name in table_names:
            print(f"\n🔄 Миграция таблицы '{table_name}'...")
            
            # Получить данные из SQLite
            select_query = text(f"SELECT * FROM {table_name}")
            rows = sqlite_session.execute(select_query).fetchall()
            
            if not rows:
                print(f"  ⚠️  Таблица '{table_name}' пустая, пропускаем")
                continue
            
            print(f"  Найдено записей: {len(rows)}")
            
            # Получить имена колонок
            columns = rows[0]._mapping.keys()
            
            # Очистить таблицу MySQL
            mysql_session.execute(text(f"DELETE FROM {table_name}"))
            
            # Вставить данные в MySQL
            for row in rows:
                columns_str = ", ".join(columns)
                placeholders = ", ".join([f":{col}" for col in columns])
                insert_query = text(f"INSERT INTO {table_name} ({columns_str}) VALUES ({placeholders})")
                
                row_dict = dict(row._mapping)
                mysql_session.execute(insert_query, row_dict)
            
            mysql_session.commit()
            print(f"  ✅ Таблица '{table_name}' мигрирована ({len(rows)} записей)")
        
        print("\n✅ Миграция завершена успешно!")
        
    except Exception as e:
        print(f"\n❌ Ошибка миграции: {e}")
        mysql_session.rollback()
        raise
    
    finally:
        sqlite_session.close()
        mysql_session.close()


if __name__ == "__main__":
    print("=" * 60)
    print("🔄 МИГРАЦИЯ ДАННЫХ SQLite → MySQL")
    print("=" * 60)
    print()
    print(f"Источник: {SQLITE_DB}")
    print(f"Назначение: {MYSQL_DB}")
    print()
    print("⚠️  ВНИМАНИЕ: Эта операция удалит все данные в MySQL базе!")
    print()
    
    response = input("Продолжить? (y/n): ")
    if response.lower() != 'y':
        print("Отменено")
        sys.exit(0)
    
    try:
        migrate_data()
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ Миграция не удалась: {e}")
        sys.exit(1)
