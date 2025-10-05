# Развёртывание проекта SOS на Beget VPS

Инструкция предполагает, что у вас есть VPS на Beget с доступом `root@<ip>` (как на скриншоте) и установленная ОС семейства Ubuntu 22.04+. Дополнительно описаны команды для PowerShell/Windows (локальная подготовка) и Bash (сервер). Если ваша платформа отличается, адаптируйте команды.

## 1. Подготовка локально

1. Склонируйте проект (если ещё не сделали):
   ```powershell
   git clone https://github.com/Yarikttyui/SOS.git
   cd SOS
   ```
2. Скопируйте и заполните переменные окружения:
   ```powershell
   copy backend\.env.production.example backend\.env.production
   copy frontend\.env.production.example frontend\.env.production
   ```
   Обязательно поменяйте:
   - `SECRET_KEY` на длинную случайную строку (не менее 32 символов).
   - `CORS_ORIGINS` на домен вашего сайта (например, `https://sos.your-domain.ru`).
   - API‑ключи (`OPENAI_API_KEY`, `MAPBOX_ACCESS_TOKEN`) и SMTP‑учётки, если они нужны.
   - Во фронтенде в `VITE_WS_URL` укажите `wss://<ваш-домен>/ws`.
3. Закоммитьте приватные данные **нельзя**. Создаваемые файлы `.env.production` добавлены в `.gitignore`, поэтому просто передайте их на сервер вручную (scp/WinSCP).

## 2. Доступ на сервер

1. Подключитесь по SSH:
   ```powershell
   ssh root@84.54.30.211
   ```
2. Обновите систему и установите базовые пакеты:
   ```bash
   apt update && apt upgrade -y
   apt install -y git curl ca-certificates gnupg lsb-release ufw
   ```
3. (Опционально) Включите файрволл и откройте нужные порты:
   ```bash
   ufw allow OpenSSH
   ufw allow 80/tcp
   ufw allow 443/tcp
   ufw enable
   ```

## 3. Установка Docker и docker compose plugin

```bash
curl -fsSL https://get.docker.com | sh
systemctl enable --now docker

mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
```

Проверьте версию:
```bash
docker compose version
```

## 4. Развёртывание кода

1. Склонируйте репозиторий на сервер:
   ```bash
   cd /opt
   git clone https://github.com/Yarikttyui/SOS.git sos
   cd sos
   ```
2. Скопируйте подготовленные файлы окружения из локальной машины, например с помощью `scp`:
   ```powershell
   scp backend\.env.production root@84.54.30.211:/opt/sos/backend/.env.production
   scp frontend\.env.production root@84.54.30.211:/opt/sos/frontend/.env.production
   ```
3. Откройте `.env.production` на сервере и ещё раз убедитесь, что значения корректные (пароли, ключи, домен).

## 5. Запуск docker compose (production)

В репозитории добавлен готовый файл `deploy/beget/docker-compose.prod.yml`, адаптированный для продакшена:

```bash
cd /opt/sos
mkdir -p backend/uploads
sudo docker compose -f deploy/beget/docker-compose.prod.yml pull
sudo docker compose -f deploy/beget/docker-compose.prod.yml up -d --build
```

Сервисы, которые стартуют:
- `postgres` — БД PostgreSQL (данные хранятся в volume `postgres_data`).
- `redis` — redis для очередей/кеша.
- `backend` — FastAPI (uvicorn, 4 воркера).
- `celery_worker` — фоновые задачи.
- `web` — Nginx, обслуживает статику фронтенда и проксирует запросы `/api` и `/ws` в backend.

Проверьте состояние:
```bash
sudo docker compose -f deploy/beget/docker-compose.prod.yml ps
sudo docker compose -f deploy/beget/docker-compose.prod.yml logs -f backend
```

## 6. HTTPS и домен

1. Привяжите домен в панели Beget к вашему VPS (A‑запись на IP `84.54.30.211`).
2. Для получения сертификата можно использовать `certbot` с режимом standalone или dockerized вариант. Простой способ:
   ```bash
   apt install -y certbot
   systemctl stop nginx docker
   certbot certonly --standalone -d sos.your-domain.ru
   ```
   Затем смонтируйте директорию `/etc/letsencrypt` в контейнер Nginx и обновите `frontend.conf`, добавив блок `listen 443 ssl` со ссылками на сертификаты. Перезапустите docker compose.
3. Не забудьте настроить автоматическое обновление сертификатов (`certbot renew`).

## 7. Поддержка и обновления

- Обновление кода:
  ```bash
  cd /opt/sos
  git pull
  sudo docker compose -f deploy/beget/docker-compose.prod.yml up -d --build
  ```
- Просмотр логов:
  ```bash
  sudo docker compose -f deploy/beget/docker-compose.prod.yml logs -f backend
  sudo docker compose -f deploy/beget/docker-compose.prod.yml logs -f web
  ```
- Резервное копирование БД:
  ```bash
  sudo docker exec -t rescue_postgres pg_dump -U rescue_user rescue_db > /opt/backup/rescue_db_$(date +%F).sql
  ```

## 8. Настройка схемы и начальных данных

1. Выполните миграции базы (если используете Alembic):
   ```bash
   sudo docker exec -it rescue_backend alembic upgrade head
   ```
2. Для создания первого администратора используйте собственный скрипт или интерактивный сеанс Python:
   ```bash
   sudo docker exec -it rescue_backend python
   >>> from app.services import user_service
   >>> user_service.create_superuser(...)
   ```
   Либо адаптируйте существующие скрипты в каталоге `backend/` (например, `create_admin_mysql.py`) под PostgreSQL.

## 9. Альтернативы (без Docker)

Если Docker использовать нельзя, развёртывайте сервисы вручную:
1. Установите `python3.11`, `pip`, `node18`, `postgresql`, `redis`.
2. Создайте virtualenv, установите зависимости из `backend/requirements.txt`.
3. Настройте systemd‑юнит для `uvicorn` и `celery`.
4. Соберите фронтенд командой `npm install && npm run build` и отдавайте статику через системный Nginx.

## 10. Проверка

После запуска убедитесь, что:
- `http://<ip>` открывает фронтенд и API отвечает на `http://<ip>/api/v1/ping` (через браузер или `curl`).
- В консоли нет ошибок CORS и WebSocket подключается к `wss://<домен>/ws/<user_id>?token=...`.

На этом развёртывание завершено ✅. Вопросы по доработке или автоматизации (CI/CD, мониторинг, резервирование) — выносите отдельной задачей.
