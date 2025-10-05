import sqlite3

conn = sqlite3.connect('rescue.db')
cursor = conn.cursor()

print('\n=== USERS IN DATABASE ===\n')
users = cursor.execute('SELECT email, role, full_name, created_at FROM users').fetchall()

if users:
    for user in users:
        print(f'Email: {user[0]}')
        print(f'Role: {user[1]}')
        print(f'Name: {user[2]}')
        print(f'Created: {user[3]}')
        print('---')
else:
    print('No users found')

print(f'\nTotal users: {len(users)}')

conn.close()
