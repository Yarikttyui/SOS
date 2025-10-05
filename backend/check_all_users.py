import sqlite3

conn = sqlite3.connect('rescue.db')
cursor = conn.cursor()

cursor.execute("""
    SELECT id, email, full_name, role, specialization, team_id 
    FROM users 
    ORDER BY role, email
""")

users = cursor.fetchall()

print(f"\n{'='*80}")
print(f"Total users: {len(users)}")
print(f"{'='*80}\n")

from collections import defaultdict
by_role = defaultdict(list)

for user in users:
    user_id, email, full_name, role, specialization, team_id = user
    by_role[role].append({
        'id': user_id,
        'email': email,
        'name': full_name,
        'spec': specialization,
        'team': team_id
    })

for role in ['ADMIN', 'COORDINATOR', 'OPERATOR', 'RESCUER', 'CITIZEN']:
    if role in by_role:
        print(f"\n{role}s ({len(by_role[role])} users):")
        print("-" * 80)
        for u in by_role[role]:
            spec = f"[{u['spec']}]" if u['spec'] else ""
            team = f"(team: {u['team']})" if u['team'] else ""
            print(f"  • {u['email']:30} | {u['name']:20} {spec} {team}")

conn.close()
