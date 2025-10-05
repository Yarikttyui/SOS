"""
Скрипт инициализации базы данных с тестовыми данными
Создает таблицы и заполняет их начальными данными для разработки и тестирования
"""
import sys
import os
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import random

from app.core.database import sync_engine, SessionLocal, Base
from app.core.security import get_password_hash
from app.models.user import User, UserRole, RescuerSpecialization
from app.models.sos_alert import SOSAlert, EmergencyType, AlertStatus, AlertPriority
from app.models.team import RescueTeam, TeamStatus, TeamType
from app.models.notification import Notification


def create_tables():
    """Создать все таблицы в базе данных"""
    print("🗄️  Создание таблиц...")
    Base.metadata.create_all(bind=sync_engine)
    print("✅ Таблицы созданы успешно!")


def create_users(db: Session):
    """Создать тестовых пользователей"""
    print("\n👥 Создание пользователей...")
    
    users_data = [
        {
            "email": "admin@test.ru",
            "phone": "+79991234567",
            "password": "Test1234",
            "role": "admin",
            "full_name": "Администратор Системы"
        },
        
        {
            "email": "coordinator@test.ru",
            "phone": "+79991234568",
            "password": "Test1234",
            "role": "coordinator",
            "full_name": "Иван Координаторов"
        },
        
        {
            "email": "operator@test.ru",
            "phone": "+79991234569",
            "password": "Test1234",
            "role": "operator",
            "full_name": "Мария Операторова"
        },
        {
            "email": "operator2@test.ru",
            "phone": "+79991234570",
            "password": "Test1234",
            "role": "operator",
            "full_name": "Сергей Операторов"
        },
        
        {
            "email": "rescuer1@test.ru",
            "phone": "+79991234571",
            "password": "Test1234",
            "role": "rescuer",
            "full_name": "Алексей Пожарный",
            "specialization": "firefighter",
            "is_team_leader": True
        },
        {
            "email": "rescuer2@test.ru",
            "phone": "+79991234572",
            "password": "Test1234",
            "role": "rescuer",
            "full_name": "Дмитрий Огнеборец",
            "specialization": "firefighter"
        },
        
        {
            "email": "rescuer3@test.ru",
            "phone": "+79991234573",
            "password": "Test1234",
            "role": "rescuer",
            "full_name": "Елена Врачева",
            "specialization": "paramedic",
            "is_team_leader": True
        },
        {
            "email": "rescuer4@test.ru",
            "phone": "+79991234574",
            "password": "Test1234",
            "role": "rescuer",
            "full_name": "Ольга Медицинская",
            "specialization": "paramedic"
        },
        
        {
            "email": "rescuer5@test.ru",
            "phone": "+79991234575",
            "password": "Test1234",
            "role": "rescuer",
            "full_name": "Николай Полицейский",
            "specialization": "police",
            "is_team_leader": True
        },
        {
            "email": "rescuer6@test.ru",
            "phone": "+79991234576",
            "password": "Test1234",
            "role": "rescuer",
            "full_name": "Андрей Правопорядков",
            "specialization": "police"
        },
        
        {
            "email": "rescuer7@test.ru",
            "phone": "+79991234577",
            "password": "Test1234",
            "role": "rescuer",
            "full_name": "Виктор Водный",
            "specialization": "water_rescue"
        },
        
        {
            "email": "rescuer8@test.ru",
            "phone": "+79991234578",
            "password": "Test1234",
            "role": "rescuer",
            "full_name": "Максим Горный",
            "specialization": "mountain_rescue"
        },
        
        {
            "email": "rescuer9@test.ru",
            "phone": "+79991234579",
            "password": "Test1234",
            "role": "rescuer",
            "full_name": "Игорь Поисковиков",
            "specialization": "search_rescue"
        },
        
        {
            "email": "citizen@test.ru",
            "phone": "+79991234580",
            "password": "Test1234",
            "role": "citizen",
            "full_name": "Петр Гражданский"
        },
        {
            "email": "citizen2@test.ru",
            "phone": "+79991234581",
            "password": "Test1234",
            "role": "citizen",
            "full_name": "Анна Гражданская"
        },
        {
            "email": "citizen3@test.ru",
            "phone": "+79991234582",
            "password": "Test1234",
            "role": "citizen",
            "full_name": "Михаил Обычный"
        }
    ]
    
    created_users = {}
    
    for user_data in users_data:
        password = user_data.pop("password")
        specialization = user_data.pop("specialization", None)
        is_team_leader = user_data.pop("is_team_leader", False)
        
        user = User(
            **user_data,
            hashed_password=get_password_hash(password),
            specialization=specialization,
            is_team_leader=is_team_leader,
            created_at=datetime.utcnow()
        )
        db.add(user)
        db.flush()
        created_users[user.email] = user
        print(f"  ✓ Создан пользователь: {user.full_name} ({user.role})")
    
    db.commit()
    print(f"✅ Создано {len(created_users)} пользователей")
    return created_users


def create_teams(db: Session, users: dict):
    """Создать бригады спасателей"""
    print("\n🚒 Создание бригад...")
    
    teams_data = [
        {
            "name": "Пожарная бригада Альфа",
            "type": "fire",
            "status": "available",
            "leader_email": "rescuer1@test.ru",
            "members_emails": ["rescuer1@test.ru", "rescuer2@test.ru"],
            "contact_phone": "+79991111111",
            "contact_email": "fire.alpha@rescue.ru",
            "current_latitude": 55.7558,
            "current_longitude": 37.6173,
            "capacity": "5-10 человек",
            "specialization": ["firefighter"],
            "equipment": [
                "Пожарные рукава",
                "Автолестница",
                "Защитные костюмы",
                "Дыхательные аппараты"
            ]
        },
        {
            "name": "Медицинская бригада Vita",
            "type": "medical",
            "status": "available",
            "leader_email": "rescuer3@test.ru",
            "members_emails": ["rescuer3@test.ru", "rescuer4@test.ru"],
            "contact_phone": "+79992222222",
            "contact_email": "medical.vita@rescue.ru",
            "current_latitude": 55.7612,
            "current_longitude": 37.6098,
            "capacity": "3-5 человек",
            "specialization": ["paramedic"],
            "equipment": [
                "Дефибриллятор",
                "Медикаменты",
                "Носилки",
                "Реанимационный набор"
            ]
        },
        {
            "name": "Полицейский отряд Страж",
            "type": "police",
            "status": "busy",
            "leader_email": "rescuer5@test.ru",
            "members_emails": ["rescuer5@test.ru", "rescuer6@test.ru"],
            "contact_phone": "+79993333333",
            "contact_email": "police.guard@rescue.ru",
            "current_latitude": 55.7500,
            "current_longitude": 37.6200,
            "capacity": "4-8 человек",
            "specialization": ["police"],
            "equipment": [
                "Спецтехника",
                "Средства связи",
                "Защитное снаряжение"
            ]
        },
        {
            "name": "Универсальная бригада Омега",
            "type": "multi_purpose",
            "status": "available",
            "leader_email": "rescuer9@test.ru",
            "members_emails": ["rescuer9@test.ru", "rescuer7@test.ru", "rescuer8@test.ru"],
            "contact_phone": "+79994444444",
            "contact_email": "omega@rescue.ru",
            "current_latitude": 55.7400,
            "current_longitude": 37.6300,
            "capacity": "10-15 человек",
            "specialization": ["search_rescue", "water_rescue", "mountain_rescue"],
            "equipment": [
                "GPS-навигаторы",
                "Альпинистское снаряжение",
                "Спасательные жилеты",
                "Поисковые дроны"
            ]
        }
    ]
    
    created_teams = {}
    
    for team_data in teams_data:
        leader_email = team_data.pop("leader_email")
        members_emails = team_data.pop("members_emails")
        equipment = team_data.pop("equipment", [])
        specialization = team_data.pop("specialization", [])
        
        leader = users.get(leader_email)
        
        members = []
        for email in members_emails:
            member = users.get(email)
            if member:
                members.append({
                    "user_id": member.id,
                    "full_name": member.full_name,
                    "specialization": member.specialization
                })
        
        team = RescueTeam(
            **team_data,
            leader_id=leader.id if leader else None,
            leader_name=leader.full_name if leader else None,
            members=members,
            member_count=len(members),
            equipment=equipment,
            specialization=specialization,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(team)
        db.flush()
        
        for email in members_emails:
            member = users.get(email)
            if member:
                member.team_id = team.id
        
        created_teams[team.name] = team
        print(f"  ✓ Создана бригада: {team.name} ({len(members)} участников)")
    
    db.commit()
    print(f"✅ Создано {len(created_teams)} бригад")
    return created_teams


def create_alerts(db: Session, users: dict, teams: dict):
    """Создать тестовые тревоги"""
    print("\n🚨 Создание тревог...")
    
    alerts_data = [
        {
            "user_email": "citizen@test.ru",
            "type": "fire",
            "status": "in_progress",
            "priority": 1,
            "title": "Пожар в жилом доме",
            "description": "Пожар на 5 этаже, требуется срочная эвакуация жильцов",
            "latitude": 55.7558,
            "longitude": 37.6173,
            "address": "ул. Ленина, д. 15, кв. 53",
            "assigned_team": "Пожарная бригада Альфа",
            "assigned_rescuer": "rescuer1@test.ru",
            "created_hours_ago": 0.5
        },
        {
            "user_email": "citizen2@test.ru",
            "type": "medical",
            "status": "assigned",
            "priority": 1,
            "title": "Сердечный приступ",
            "description": "Мужчина 65 лет, боли в груди, затрудненное дыхание",
            "latitude": 55.7612,
            "longitude": 37.6098,
            "address": "пр. Мира, д. 32, кв. 12",
            "assigned_team": "Медицинская бригада Vita",
            "assigned_rescuer": "rescuer3@test.ru",
            "created_hours_ago": 1
        },
        {
            "user_email": "citizen3@test.ru",
            "type": "police",
            "status": "in_progress",
            "priority": 2,
            "title": "Кража со взломом",
            "description": "Квартирная кража, воры скрылись в неизвестном направлении",
            "latitude": 55.7500,
            "longitude": 37.6200,
            "address": "ул. Садовая, д. 7, кв. 28",
            "assigned_team": "Полицейский отряд Страж",
            "assigned_rescuer": "rescuer5@test.ru",
            "created_hours_ago": 2
        },
        
        {
            "user_email": "citizen@test.ru",
            "type": "water_rescue",
            "status": "pending",
            "priority": 2,
            "title": "Утопающий на озере",
            "description": "Человек в воде, требуется немедленная помощь",
            "latitude": 55.7400,
            "longitude": 37.6300,
            "address": "Парк Сокольники, Большой пруд",
            "created_hours_ago": 0.2
        },
        {
            "user_email": "citizen2@test.ru",
            "type": "search_rescue",
            "status": "pending",
            "priority": 3,
            "title": "Потерялся ребенок",
            "description": "Мальчик 7 лет, последний раз видели 2 часа назад в парке",
            "latitude": 55.7350,
            "longitude": 37.6250,
            "address": "Парк Горького, главная аллея",
            "created_hours_ago": 2.5
        },
        
        {
            "user_email": "citizen3@test.ru",
            "type": "medical",
            "status": "completed",
            "priority": 2,
            "title": "Перелом ноги",
            "description": "Женщина упала с лестницы, подозрение на перелом",
            "latitude": 55.7300,
            "longitude": 37.6400,
            "address": "ул. Тверская, д. 25",
            "assigned_team": "Медицинская бригада Vita",
            "assigned_rescuer": "rescuer3@test.ru",
            "created_hours_ago": 24,
            "completed_hours_ago": 22
        },
        {
            "user_email": "citizen@test.ru",
            "type": "fire",
            "status": "completed",
            "priority": 3,
            "title": "Задымление на кухне",
            "description": "Сгорела еда на плите, много дыма",
            "latitude": 55.7450,
            "longitude": 37.6150,
            "address": "ул. Арбат, д. 40, кв. 8",
            "assigned_team": "Пожарная бригада Альфа",
            "assigned_rescuer": "rescuer1@test.ru",
            "created_hours_ago": 48,
            "completed_hours_ago": 47
        },
        {
            "user_email": "citizen2@test.ru",
            "type": "ecological",
            "status": "completed",
            "priority": 4,
            "title": "Утечка химикатов",
            "description": "Разлив неизвестного вещества возле завода",
            "latitude": 55.7200,
            "longitude": 37.6500,
            "address": "Промзона Южная, территория завода",
            "created_hours_ago": 72,
            "completed_hours_ago": 70
        },
        
        {
            "user_email": "citizen3@test.ru",
            "type": "general",
            "status": "cancelled",
            "priority": 5,
            "title": "Ложная тревога",
            "description": "Сигнализация сработала по ошибке",
            "latitude": 55.7600,
            "longitude": 37.6100,
            "address": "ул. Пушкина, д. 10",
            "created_hours_ago": 96
        }
    ]
    
    created_alerts = []
    
    for alert_data in alerts_data:
        user_email = alert_data.pop("user_email")
        assigned_team_name = alert_data.pop("assigned_team", None)
        assigned_rescuer_email = alert_data.pop("assigned_rescuer", None)
        created_hours_ago = alert_data.pop("created_hours_ago", 1)
        completed_hours_ago = alert_data.pop("completed_hours_ago", None)
        
        user = users.get(user_email)
        team = teams.get(assigned_team_name) if assigned_team_name else None
        rescuer = users.get(assigned_rescuer_email) if assigned_rescuer_email else None
        
        created_at = datetime.utcnow() - timedelta(hours=created_hours_ago)
        
        alert = SOSAlert(
            user_id=user.id,
            assigned_to=rescuer.id if rescuer else None,
            team_id=team.id if team else None,
            created_at=created_at,
            updated_at=datetime.utcnow(),
            **alert_data
        )
        
        if alert.status in ["assigned", "in_progress"]:
            alert.assigned_at = created_at + timedelta(minutes=5)
        
        if alert.status == "completed" and completed_hours_ago:
            alert.completed_at = datetime.utcnow() - timedelta(hours=completed_hours_ago)
        
        if alert_data["type"] in ["fire", "medical"]:
            alert.ai_analysis = {
                "confidence": random.uniform(0.75, 0.95),
                "severity": "high" if alert.priority <= 2 else "medium",
                "keywords": ["urgent", "immediate response needed"] if alert.priority == 1 else ["assistance required"],
                "recommended_team": alert_data["type"]
            }
        
        db.add(alert)
        db.flush()
        created_alerts.append(alert)
        print(f"  ✓ Создана тревога: {alert.title} ({alert.status})")
    
    db.commit()
    print(f"✅ Создано {len(created_alerts)} тревог")
    return created_alerts


def create_notifications(db: Session, users: dict, alerts: list):
    """Создать уведомления"""
    print("\n📬 Создание уведомлений...")
    
    created_notifications = []
    
    operators = [u for u in users.values() if u.role == "operator"]
    
    for alert in alerts[:3]:  # Только для первых 3 тревог
        for operator in operators:
            notification = Notification(
                user_id=operator.id,
                type="alert_created",
                title="Новая тревога",
                message=f"Поступила новая тревога: {alert.title}",
                data={"alert_id": alert.id},
                is_read=random.choice([True, False]),
                created_at=alert.created_at
            )
            db.add(notification)
            created_notifications.append(notification)
    
    db.commit()
    print(f"✅ Создано {len(created_notifications)} уведомлений")
    return created_notifications


def main():
    """Основная функция инициализации"""
    print("=" * 60)
    print("🚀 ИНИЦИАЛИЗАЦИЯ БАЗЫ ДАННЫХ SOS RESCUE SYSTEM")
    print("=" * 60)
    
    try:
        create_tables()
        
        db = SessionLocal()
        
        try:
            users = create_users(db)
            teams = create_teams(db, users)
            alerts = create_alerts(db, users, teams)
            notifications = create_notifications(db, users, alerts)
            
            print("\n" + "=" * 60)
            print("✅ ИНИЦИАЛИЗАЦИЯ ЗАВЕРШЕНА УСПЕШНО!")
            print("=" * 60)
            print("\n📊 Статистика:")
            print(f"  • Пользователей: {len(users)}")
            print(f"  • Бригад: {len(teams)}")
            print(f"  • Тревог: {len(alerts)}")
            print(f"  • Уведомлений: {len(notifications)}")
            
            print("\n🔐 Тестовые аккаунты (пароль для всех: Test1234):")
            print("  • admin@test.ru - Администратор")
            print("  • coordinator@test.ru - Координатор")
            print("  • operator@test.ru - Оператор")
            print("  • rescuer1@test.ru - Спасатель (лидер пожарной бригады)")
            print("  • citizen@test.ru - Гражданин")
            
            print("\n🌐 Доступ к системе:")
            print("  • Бэкенд API: http://localhost:8000")
            print("  • Документация API: http://localhost:8000/docs")
            print("  • Фронтенд: http://localhost:3001")
            print("=" * 60)
            
        finally:
            db.close()
            
    except Exception as e:
        print(f"\n❌ Ошибка инициализации: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
