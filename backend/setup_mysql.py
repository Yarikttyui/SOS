"""
Скрипт для настройки MySQL базы данных
Создает базу данных и пользователя для SOS Rescue System
"""
import pymysql
from pymysql.constants import CLIENT
import sys

# Конфигурация MySQL
MYSQL_CONFIG = {
    'host': 'localhost',
    'port': 3306,
    'user': 'root',  # Замените на вашего MySQL root пользователя
    'password': '55646504',  # Замените на пароль root пользователя
}

# Конфигурация базы данных приложения
DB_CONFIG = {
    'database': 'rescue_db',
    'user': 'root',
    'password': '55646504',
    'charset': 'utf8mb4',
}


def create_database_and_user():
    """Создать базу данных и пользователя"""
    try:
        print("🔗 Подключение к MySQL серверу...")
        connection = pymysql.connect(
            host=MYSQL_CONFIG['host'],
            port=MYSQL_CONFIG['port'],
            user=MYSQL_CONFIG['user'],
            password=MYSQL_CONFIG['password'],
            client_flag=CLIENT.MULTI_STATEMENTS
        )
        
        cursor = connection.cursor()
        
        # Создать базу данных
        print(f"📦 Создание базы данных '{DB_CONFIG['database']}'...")
        cursor.execute(f"DROP DATABASE IF EXISTS {DB_CONFIG['database']}")
        cursor.execute(
            f"CREATE DATABASE {DB_CONFIG['database']} "
            f"CHARACTER SET {DB_CONFIG['charset']} "
            f"COLLATE utf8mb4_unicode_ci"
        )
        print(f"✅ База данных '{DB_CONFIG['database']}' создана")
        
        # Создать пользователя
        print(f"👤 Создание пользователя '{DB_CONFIG['user']}'...")
        cursor.execute(f"DROP USER IF EXISTS '{DB_CONFIG['user']}'@'localhost'")
        cursor.execute(
            f"CREATE USER '{DB_CONFIG['user']}'@'localhost' "
            f"IDENTIFIED BY '{DB_CONFIG['password']}'"
        )
        cursor.execute(
            f"GRANT ALL PRIVILEGES ON {DB_CONFIG['database']}.* "
            f"TO '{DB_CONFIG['user']}'@'localhost'"
        )
        cursor.execute("FLUSH PRIVILEGES")
        print(f"✅ Пользователь '{DB_CONFIG['user']}' создан с правами доступа")
        
        cursor.close()
        connection.close()
        
        print("\n✅ MySQL настроен успешно!")
        print(f"\n📝 Строка подключения:")
        print(f"mysql+pymysql://{DB_CONFIG['user']}:{DB_CONFIG['password']}@{MYSQL_CONFIG['host']}:{MYSQL_CONFIG['port']}/{DB_CONFIG['database']}?charset={DB_CONFIG['charset']}")
        
        return True
        
    except pymysql.Error as e:
        print(f"\n❌ Ошибка MySQL: {e}")
        return False
    except Exception as e:
        print(f"\n❌ Ошибка: {e}")
        return False


if __name__ == "__main__":
    print("=" * 60)
    print("🚀 НАСТРОЙКА MYSQL ДЛЯ SOS RESCUE SYSTEM")
    print("=" * 60)
    print()
    
    print("⚠️  ВНИМАНИЕ: Перед запуском отредактируйте MYSQL_CONFIG в этом скрипте")
    print(f"   Текущие настройки: host={MYSQL_CONFIG['host']}, user={MYSQL_CONFIG['user']}")
    print()
    
    response = input("Продолжить? (y/n): ")
    if response.lower() != 'y':
        print("Отменено")
        sys.exit(0)
    
    if create_database_and_user():
        print("\n🎉 Готово! Теперь запустите init_database.py для создания таблиц")
        sys.exit(0)
    else:
        sys.exit(1)
