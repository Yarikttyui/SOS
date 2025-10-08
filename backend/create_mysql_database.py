"""Создание или проверка базы Rescue System в MySQL.

Скрипт может выполняться как на локальной машине, так и внутри docker-контейнера.
Параметры подключения берутся из переменных окружения, чтобы не привязываться к
`127.0.0.1`. При отсутствии переменных используются безопасные значения по умолчанию.
"""

from __future__ import annotations

import os
from urllib.parse import urlparse

import mysql.connector
from mysql.connector import Error


def _env(name: str, default: str | None = None) -> str | None:
    """Получить значение переменной окружения c fallback."""

    value = os.getenv(name)
    if value is not None and value.strip() != "":
        return value.strip()
    return default


def _from_database_url() -> dict[str, str | int] | None:
    """Распарсить DATABASE_URL (если задан) для получения хоста/порта/базы."""

    url = _env("DATABASE_URL")
    if not url:
        return None

    try:
        parsed = urlparse(url)
    except ValueError:
        return None

    host = parsed.hostname or "mysql"
    port = parsed.port or 3306
    database = (parsed.path or "/").lstrip("/") or "rescue_db"
    user = parsed.username or "rescue_user"
    password = parsed.password or ""

    return {
        "host": host,
        "port": port,
        "user": user,
        "password": password,
        "database": database,
    }


def _resolve_connection_params() -> tuple[str, int, str, str, str]:
    """Определить параметры подключения, разрешая приоритеты."""

    # 1. Явные переменные для скрипта (можно передать при запуске).
    host = _env("MYSQL_SETUP_HOST")
    port = _env("MYSQL_SETUP_PORT")
    user = _env("MYSQL_SETUP_USER")
    password = _env("MYSQL_SETUP_PASSWORD")
    database = _env("MYSQL_SETUP_DB")

    # 2. Данные из переменных контейнера MySQL (если прокинуты).
    if host is None:
        host = _env("MYSQL_HOST")
    if port is None:
        port = _env("MYSQL_PORT")
    if user is None:
        user = _env("MYSQL_ROOT_USER") or _env("MYSQL_USER")
    if password is None:
        password = _env("MYSQL_ROOT_PASSWORD") or _env("MYSQL_PASSWORD")
    if database is None:
        database = _env("MYSQL_DATABASE")

    # 3. Попробовать распарсить DATABASE_URL (например, из backend/.env).
    if not host or not user:
        parsed = _from_database_url()
        if parsed:
            host = host or parsed["host"]
            port = port or str(parsed["port"])
            database = database or parsed["database"]
            # Для создания базы лучше использовать root, но если он не указан,
            # используем пользователя из URL.
            user = user or parsed["user"]
            password = password or parsed["password"]

    # 4. Значения по умолчанию
    host = host or "mysql"
    port = int(port) if port else 3306
    user = user or "root"
    password = password or "rescue_root_pass_2024_secure"
    database = database or "rescue_db"

    return host, port, user, password, database


DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME = _resolve_connection_params()

def create_database():
    """Create the rescue_db database if it doesn't exist"""
    try:
        connection = mysql.connector.connect(
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER,
            password=DB_PASSWORD
        )
        
        if connection.is_connected():
            cursor = connection.cursor()
            
            cursor.execute(f"CREATE DATABASE IF NOT EXISTS {DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
            print(f"✓ Database '{DB_NAME}' created or already exists")
            
            cursor.close()
            connection.close()
            
    except Error as e:
        print(f"✗ Error creating database: {e}")
        return False
    
    return True


def create_tables():
    """Create all required tables"""
    try:
        connection = mysql.connector.connect(
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_NAME
        )
        
        if connection.is_connected():
            cursor = connection.cursor()
            
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id VARCHAR(36) PRIMARY KEY,
                    email VARCHAR(255) NOT NULL UNIQUE,
                    phone VARCHAR(20) UNIQUE,
                    hashed_password VARCHAR(255) NOT NULL,
                    role VARCHAR(20) NOT NULL CHECK(role IN ('citizen', 'rescuer', 'operator', 'coordinator', 'admin')),
                    full_name VARCHAR(255),
                    specialization VARCHAR(50),
                    team_id VARCHAR(36),
                    is_team_leader BOOLEAN DEFAULT FALSE,
                    is_active BOOLEAN DEFAULT TRUE,
                    is_verified BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX idx_email (email),
                    INDEX idx_phone (phone),
                    INDEX idx_role (role),
                    INDEX idx_team_id (team_id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """)
            print("✓ Table 'users' created")
            
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS sos_alerts (
                    id VARCHAR(36) PRIMARY KEY,
                    user_id VARCHAR(36) NOT NULL,
                    type VARCHAR(20) NOT NULL CHECK(type IN ('fire', 'medical', 'accident', 'crime', 'natural_disaster', 'other')),
                    status VARCHAR(20) NOT NULL CHECK(status IN ('pending', 'assigned', 'in_progress', 'completed', 'cancelled')),
                    priority VARCHAR(20) NOT NULL CHECK(priority IN ('low', 'medium', 'high', 'critical')),
                    latitude DECIMAL(10, 8),
                    longitude DECIMAL(11, 8),
                    address TEXT,
                    title VARCHAR(255),
                    description TEXT,
                    media_urls JSON,
                    ai_analysis JSON,
                    assigned_to VARCHAR(36),
                    team_id VARCHAR(36),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    assigned_at TIMESTAMP NULL,
                    completed_at TIMESTAMP NULL,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
                    INDEX idx_user_id (user_id),
                    INDEX idx_status (status),
                    INDEX idx_type (type),
                    INDEX idx_assigned_to (assigned_to),
                    INDEX idx_team_id (team_id),
                    INDEX idx_created_at (created_at)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """)
            print("✓ Table 'sos_alerts' created")
            
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS rescue_teams (
                    id VARCHAR(36) PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    description TEXT,
                    specialization VARCHAR(50),
                    leader_id VARCHAR(36),
                    is_active BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    FOREIGN KEY (leader_id) REFERENCES users(id) ON DELETE SET NULL,
                    INDEX idx_leader_id (leader_id),
                    INDEX idx_specialization (specialization)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """)
            print("✓ Table 'rescue_teams' created")
            
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS notifications (
                    id VARCHAR(36) PRIMARY KEY,
                    user_id VARCHAR(36) NOT NULL,
                    type VARCHAR(50) NOT NULL,
                    title VARCHAR(255) NOT NULL,
                    message TEXT NOT NULL,
                    data JSON,
                    is_read BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                    INDEX idx_user_id (user_id),
                    INDEX idx_is_read (is_read),
                    INDEX idx_created_at (created_at)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """)
            print("✓ Table 'notifications' created")
            
            connection.commit()
            cursor.close()
            connection.close()
            
            print("\n✅ All tables created successfully!")
            return True
            
    except Error as e:
        print(f"✗ Error creating tables: {e}")
        return False


def main():
    """Main execution"""
    print("="*70)
    print("MySQL Database Setup for Rescue System")
    print("="*70)
    print(f"Host: {DB_HOST}")
    print(f"Port: {DB_PORT}")
    print(f"User: {DB_USER}")
    print(f"Database: {DB_NAME}")
    print("="*70)
    print()
    
    print("Step 1: Creating database...")
    if not create_database():
        print("Failed to create database. Exiting.")
        return
    
    print()
    
    print("Step 2: Creating tables...")
    if not create_tables():
        print("Failed to create tables. Exiting.")
        return
    
    print()
    print("="*70)
    print("✅ Database setup completed successfully!")
    print("="*70)
    print()
    print("Next steps:")
    print("1. Update your .env file with MySQL connection string")
    print("2. Install MySQL connector: pip install mysql-connector-python")
    print("3. Restart your backend server")
    print()


if __name__ == "__main__":
    main()
