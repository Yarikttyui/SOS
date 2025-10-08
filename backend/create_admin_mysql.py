"""Создание базовых аккаунтов в MySQL для глобального обновления."""
from __future__ import annotations

import uuid

import mysql.connector
from passlib.context import CryptContext


MYSQL_CONFIG = {
    "host": "127.0.0.1",
    "user": "root",
    "password": "55646504",
    "database": "rescue_db",
}


CORE_ACCOUNTS = (
    {
        "email": "admin@rescue-system.ru",
        "legacy_emails": ["admin@admin"],
        "password": "admin1",
        "role": "admin",
        "full_name": "Системный администратор",
        "is_shared_account": False,
    },
    {
        "email": "operator@rescue-system.ru",
        "legacy_emails": ["operator@operator"],
        "password": "operator1",
        "role": "operator",
        "full_name": "Дежурный оператор",
        "is_shared_account": False,
    },
    {
        "email": "team@rescue-system.ru",
        "legacy_emails": ["spasat@spasat"],
        "password": "spasat1",
        "role": "rescuer",
        "full_name": "Общий аккаунт спасателей",
        "is_shared_account": True,
        "specialization": "multi_purpose",
    },
)


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def ensure_core_accounts() -> None:
    """Создать или подтвердить наличие базовых аккаунтов в MySQL."""
    try:
        conn = mysql.connector.connect(**MYSQL_CONFIG)
        cursor = conn.cursor()

        for raw_account in CORE_ACCOUNTS:
            account = raw_account.copy()
            legacy_emails = [email for email in account.pop("legacy_emails", []) if email]
            password = account.pop("password")

            cursor.execute(
                "SELECT id FROM users WHERE LOWER(email) = %s",
                (account["email"].lower(),),
            )
            result = cursor.fetchone()

            if not result and legacy_emails:
                for legacy in legacy_emails:
                    cursor.execute(
                        "SELECT id FROM users WHERE LOWER(email) = %s",
                        (legacy.lower(),),
                    )
                    legacy_row = cursor.fetchone()
                    if legacy_row:
                        cursor.execute(
                            "UPDATE users SET email = %s WHERE id = %s",
                            (account["email"], legacy_row[0]),
                        )
                        conn.commit()
                        print(
                            f"✓ Обновлён legacy email {legacy} → {account['email']}"
                        )
                        result = legacy_row
                        break

            if result:
                print(f"✓ Учетная запись {account['email']} уже существует")
                continue

            user_id = str(uuid.uuid4())
            hashed_password = pwd_context.hash(password)

            cursor.execute(
                """
                INSERT INTO users
                (id, email, hashed_password, role, full_name, is_active, is_verified, is_shared_account, specialization)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    user_id,
                    account["email"],
                    hashed_password,
                    account["role"],
                    account.get("full_name"),
                    True,
                    True,
                    account.get("is_shared_account", False),
                    account.get("specialization"),
                ),
            )

            conn.commit()
            print("✅ Создана учетная запись!")
            print(f"   Email: {account['email']}")
            print(f"   Password: {password}")
            print(f"   ID: {user_id}")

        cursor.close()
        conn.close()

    except Exception as exc:  # pragma: no cover - скрипт запускается вручную
        print(f"✗ Ошибка: {exc}")


if __name__ == "__main__":
    ensure_core_accounts()
