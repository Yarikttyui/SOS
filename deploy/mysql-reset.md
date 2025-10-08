# Полная переустановка MySQL и переподключение бекенда

> Обновлено: 8 октября 2025

Этот чек-лист описывает, как полностью пересобрать MySQL для Rescue System, заново инициализировать данные и выдать внешним сервисам устойчивое подключение. Выполняйте шаги последовательно; они подходят как для локальной машины, так и для удалённого хоста.

---

## 1. Снять бэкап текущей БД (если она ещё нужна)

```bash
# Через Docker
docker exec -i rescue_mysql mysqldump -u root -p"rescue_root_pass_2024_secure" rescue_db > backup_$(date +%F).sql
```

---

## 2. Остановить стэк и удалить старый том MySQL

```bash
docker compose down --remove-orphans
# Важно: удаляет все данные MySQL
docker volume rm $(docker volume ls -q --filter name=mysql_data) 2>/dev/null || true
```

*Если проект развёрнут через `deploy/beget/docker-compose.prod.yml`, выполните команды из каталога `deploy/beget/` и удалите том `beget_mysql_data`.*

---

## 3. Подготовить переменные окружения

1. Скопируйте `backend/.env.example` → `backend/.env`.
2. Убедитесь, что строка подключения имеет вид:
   ```env
   DATABASE_URL=mysql+pymysql://rescue_user:rescue_pass_2024_secure@mysql:3306/rescue_db?charset=utf8mb4
   ```
3. Для продакшена дополнительно заполните `backend/.env.production` (или секреты хоста) и пропишите там реальный `SECRET_KEY`.

---

## 4. Запустить только MySQL и дождаться healthcheck

```bash
docker compose up -d mysql
# Проверка живости
watch -n 2 docker ps --filter name=rescue_mysql --format 'table {{.Names}}\t{{.Status}}'
```

Убедитесь, что статус перешёл в `healthy`.

---

## 5. Первичная инициализация таблиц и аккаунтов

```bash
# Запускаем backend-контейнер, подключённый к тому же docker network
docker compose run --rm backend python create_mysql_database.py
# Затем наполняем свежие данные и базовые аккаунты
docker compose run --rm backend python init_database.py
```

После выполнения команда `docker compose run --rm backend python check_users.py` должна показать созданных пользователей (`admin@admin`, `operator@operator`, `spasat@spasat`).

---

## 6. Запустить остальные сервисы

```bash
docker compose up -d backend celery_worker redis frontend
```

Проверьте логи:
```bash
docker compose logs -f backend
```

Если всё прошло успешно, должны появиться строки вида `Application startup complete` и `Connected to rescue_db`.

---

## 7. Разрешить внешний доступ к MySQL (по необходимости)

⚠️ **Открывайте порт 3306 только под конкретные IP и с использованием SSL.** В продакшене настоятельно рекомендуется ограничить доступ VPN или reverse-proxy.

Пример для `ufw` (Ubuntu):
```bash
sudo ufw allow from YOUR_TRUSTED_IP to any port 3306 proto tcp
```

Если требуется открыть порт публично (не рекомендуется):
```bash
sudo ufw allow 3306/tcp
```

Проверьте, что в `my.cnf` включён `bind-address = 0.0.0.0`, а в `MYSQL_USER` заданы привилегии:
```sql
GRANT ALL PRIVILEGES ON rescue_db.* TO 'rescue_user'@'%' IDENTIFIED BY 'rescue_pass_2024_secure';
FLUSH PRIVILEGES;
```

---

## 8. Проверка API

После запуска выполните:
```bash
curl -H "Authorization: Bearer <token>" http://<host>/api/v1/auth/me
```

Если возвращается JSON с пользователем — подключение успешно. В логах сервиса не должно быть ошибок `OperationalError`.

---

## 9. Частые проблемы

| Симптом | Что проверить |
|---------|---------------|
| `1045 (28000): Access denied` | Неверный пароль или пользователь не имеет доступа с внешнего IP |
| `Can't connect to MySQL server on 'mysql' (111)` | Контейнер MySQL ещё не поднялся или backend подключается по неправильному host |
| `/api/v1/auth/me` → 500 | Таблицы не созданы; повторите шаг 5 |
| `Duplicate entry` | Скрипт инициализации запускался несколько раз; очистите таблицы (`init_database.py` удаляет их автоматически) |

---

## 10. Автоматизация

Для регулярных деплоев добавьте в CI/CD шаги:
1. `docker compose pull`
2. `docker compose up -d mysql redis`
3. `docker compose run --rm backend python migrate_to_mysql.py`
4. `docker compose up -d backend celery_worker web`

Это гарантирует, что структура БД обновится перед развёртыванием кода.

---

После прохождения всех шагов фронтенд должен успешно получать `/api/v1/auth/me` и `/api/v1/users/` без ошибок 500.
