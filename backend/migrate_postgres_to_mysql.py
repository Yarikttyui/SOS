"""Migrate data from PostgreSQL to MySQL while preserving IDs.

Run this script once before switching the production stack to MySQL.
The script copies the contents of the main tables (users, rescue_teams,
notifications, sos_alerts) from the source PostgreSQL database to the
target MySQL database. Existing rows in MySQL will be replaced using the
same primary keys so that related records remain linked.

Usage (inside backend folder):

```
python migrate_postgres_to_mysql.py \
    --postgres postgresql://user:pass@localhost:5432/rescue_db \
    --mysql mysql+pymysql://user:pass@localhost:3306/rescue_db?charset=utf8mb4
```

If the connection strings are not provided, the script reads the
`POSTGRES_DATABASE_URL` and `DATABASE_URL` environment variables. This
allows reusing the existing `.env.production` (for MySQL) together with a
temporary `POSTGRES_DATABASE_URL` entry that points to the running
PostgreSQL instance.
"""
from __future__ import annotations

import argparse
import os
from contextlib import contextmanager
from typing import Iterable, Mapping

from sqlalchemy import create_engine, text
from sqlalchemy.engine import Connection, Result
from sqlalchemy.exc import SQLAlchemyError

TABLE_ORDER = [
    "users",
    "rescue_teams",
    "notifications",
    "sos_alerts",
]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Migrate PostgreSQL data to MySQL")
    parser.add_argument(
        "--postgres",
        dest="postgres_url",
        default=os.getenv("POSTGRES_DATABASE_URL", "postgresql://rescue_user:rescue_pass_2024_secure@localhost:5432/rescue_db"),
        help="SQLAlchemy connection string for PostgreSQL",
    )
    parser.add_argument(
        "--mysql",
        dest="mysql_url",
        default=os.getenv("DATABASE_URL", "mysql+pymysql://rescue_user:rescue_pass_2024_secure@localhost:3306/rescue_db?charset=utf8mb4"),
        help="SQLAlchemy connection string for MySQL",
    )
    return parser.parse_args()


@contextmanager
def db_connection(url: str) -> Iterable[Connection]:
    engine = create_engine(url, pool_pre_ping=True, future=True)
    try:
        with engine.connect() as connection:
            yield connection
    finally:
        engine.dispose()


def fetch_rows(conn: Connection, table_name: str) -> Iterable[Mapping[str, object]]:
    result: Result = conn.execute(text(f"SELECT * FROM {table_name}"))
    return result.mappings().all()


def upsert_rows(conn: Connection, table_name: str, rows: Iterable[Mapping[str, object]]) -> int:
    rows = list(rows)
    if not rows:
        return 0

    column_names = list(rows[0].keys())
    column_list = ", ".join(column_names)
    value_placeholders = ", ".join(f":{column}" for column in column_names)

    insert_sql = text(
        f"REPLACE INTO {table_name} ({column_list}) VALUES ({value_placeholders})"
    )

    affected = 0
    for row in rows:
        conn.execute(insert_sql, row)
        affected += 1
    return affected


def migrate_table(pg_conn: Connection, mysql_conn: Connection, table: str) -> int:
    rows = fetch_rows(pg_conn, table)
    if not rows:
        return 0
    return upsert_rows(mysql_conn, table, rows)


def main() -> None:
    args = parse_args()

    print("=" * 70)
    print("PostgreSQL → MySQL migration")
    print("=" * 70)
    print(f"Source: {args.postgres_url}")
    print(f"Target: {args.mysql_url}")
    print("=" * 70)

    try:
        with db_connection(args.postgres_url) as pg_conn, db_connection(args.mysql_url) as mysql_conn:
            total = 0
            mysql_conn.execute(text("SET FOREIGN_KEY_CHECKS=0"))
            try:
                for table in TABLE_ORDER:
                    print(f"Migrating table '{table}'…", end=" ")
                    count = migrate_table(pg_conn, mysql_conn, table)
                    total += count
                    print(f"done ({count} rows)")
                mysql_conn.commit()
            except SQLAlchemyError:
                mysql_conn.rollback()
                raise
            finally:
                mysql_conn.execute(text("SET FOREIGN_KEY_CHECKS=1"))
    except SQLAlchemyError as exc:
        print(f"\n✗ Migration failed: {exc}")
        return

    print("\n✓ Migration completed successfully")
    print("Total rows migrated:", total)


if __name__ == "__main__":
    main()
