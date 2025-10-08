# Миграция на MySQL

## Шаги для перехода с SQLite на MySQL

### 1. Установка MySQL сервера

Если MySQL еще не установлен:
- Скачайте MySQL Community Server: https://dev.mysql.com/downloads/mysql/
- Или используйте XAMPP/WAMP/MAMP с MySQL

### 2. Настройка MySQL

1. Отредактируйте файл `setup_mysql.py`:
   ```python
   MYSQL_CONFIG = {
       'host': 'localhost',
       'port': 3306,
       'user': 'root',  # Ваш MySQL root пользователь
       'password': 'YOUR_ROOT_PASSWORD',  # Пароль root
   }
   ```

2. Запустите скрипт настройки:
   ```bash
   python setup_mysql.py
   ```

   Этот скрипт создаст:
   - База данных: `rescue_db`
   - Пользователь: `rescue_user`
   - Пароль: `rescue_pass_2024`

### 3. Обновление .env файла

Файл `.env` уже обновлен с MySQL строкой подключения:
```env
DATABASE_URL=mysql+pymysql://rescue_user:rescue_pass_2024@localhost:3306/rescue_db?charset=utf8mb4
```

Если ваш MySQL на другом хосте или порту, обновите соответственно.

### 4. Создание таблиц в MySQL

Запустите скрипт инициализации базы данных:
```bash
python init_database.py
```

Это создаст все таблицы и заполнит их тестовыми данными.

### 5. (Опционально) Миграция существующих данных

Если нужно перенести данные из SQLite:

1. Убедитесь, что таблицы созданы в MySQL (шаг 4)
2. Запустите скрипт миграции:
   ```bash
   python migrate_to_mysql.py
   ```

### 6. Перезапуск приложения

После настройки MySQL перезапустите backend:
```bash
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Для продакшен сервера (хостинг)

### Удаленный MySQL

Если MySQL на хостинге, обновите `.env`:
```env
DATABASE_URL=mysql+pymysql://user:password@host:port/database?charset=utf8mb4
```

Где:
- `user` - имя пользователя MySQL
- `password` - пароль MySQL
- `host` - адрес MySQL сервера (например, `db.example.com`)
- `port` - порт MySQL (обычно 3306)
- `database` - имя базы данных

### Пример для популярных хостингов:

**DigitalOcean / AWS / Azure:**
```env
DATABASE_URL=mysql+pymysql://admin:SecurePass123@mysql-db.example.com:3306/rescue_production?charset=utf8mb4
```

**Shared hosting (cPanel):**
```env
DATABASE_URL=mysql+pymysql://cpanel_user:password@localhost:3306/cpanel_rescuedb?charset=utf8mb4
```

## Проверка подключения

Простой тест подключения:
```bash
python -c "from app.core.database import sync_engine; print(sync_engine.url)"
```

## Troubleshooting

### Ошибка: Access denied
- Проверьте username/password в DATABASE_URL
- Убедитесь, что пользователь имеет права на базу данных

### Ошибка: Can't connect to MySQL server
- Проверьте, что MySQL запущен
- Проверьте host и port в DATABASE_URL
- Проверьте firewall правила

### Ошибка: Unknown database
- Создайте базу данных через `setup_mysql.py`
- Или создайте вручную в MySQL:
  ```sql
  CREATE DATABASE rescue_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  ```

## Преимущества MySQL над SQLite

✅ Лучшая производительность для множественных пользователей
✅ Поддержка конкурентных записей
✅ Больше возможностей для масштабирования
✅ Лучше для продакшена
✅ Поддержка репликации и бэкапов

## Откат на SQLite

Если нужно вернуться к SQLite, просто измените в `.env`:
```env
DATABASE_URL=sqlite:///./rescue.db
```
